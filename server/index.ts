// Reference: javascript_log_in_with_replit, javascript_websocket blueprints
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes.js";
import { handleWebSocket } from "./websocket.js";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

const app = express();
const server = createServer(app);

// Check if running on Vercel
// NOTE: Vercel Node.js runtime DOES support WebSockets (not serverless functions)
// We only disable WebSockets if we detect we're in a true serverless environment
// Vercel's Node.js runtime with @vercel/node builder supports persistent connections
const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV;
const isServerless = process.env.VERCEL && process.env.VERCEL_ENV && !process.env.VERCEL_NODE_RUNTIME;

// CRITICAL: Ensure we NEVER import Vite/Rollup on Vercel
// This prevents the @rollup/rollup-linux-x64-gnu error
if (isVercel && (process.env.VERCEL || process.env.VERCEL_ENV)) {
  // Override any potential vite imports
  Object.defineProperty(global, 'vite', {
    get: () => {
      throw new Error('Vite is not available on Vercel - use static file serving instead');
    },
    configurable: false,
  });
}

// Track initialization state
let isInitialized = false;
let initError: Error | null = null;
const initPromise = (async () => {
  try {
    await initializeApp();
    isInitialized = true;
    console.log("[Server] ✅ Initialization complete");
  } catch (error) {
    initError = error as Error; 
    console.error("[Server] ❌ Initialization failed:", error);
    console.error("[Server] Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    // Don't throw on Vercel - let middleware handle gracefully
    if (!isVercel) {
      throw error;
      
    }
  }
})();

// CORS configuration for split architecture (frontend on Vercel, backend on Render/Railway)
// Allow frontend origin and localhost for development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5000',
  'https://chat-cookin-knowledge-saint-*.vercel.app',
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.filter((allowed): allowed is string => !!allowed).some(allowed => origin.includes(allowed.replace('*', ''))) || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware setup (synchronous, outside async function)
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// For Vercel: ensure app is initialized before handling ANY requests
// This MUST be before route registration
if (isVercel) {
  app.use(async (req, res, next) => {
    try {
      await initPromise;
      if (initError) {
        return res.status(500).json({ 
          error: "Server initialization failed",
          message: initError.message,
          details: "The server failed to initialize. Check environment variables and database connection."
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ 
        error: "Server initialization error",
        message: (error as Error).message,
        details: "An error occurred during server initialization."
      });
    }
  });
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`${formattedTime} [express] ${logLine}`);
    }
  });

  next();
});

async function initializeApp() {
  try {
    // ✅ Register API routes FIRST (includes setupAuth with simple email/password)
    await registerRoutes(app);
  } catch (error) {
    console.error("[initializeApp] Error registering routes:", error);
    // Don't throw - let the app continue with basic functionality
    // Add a basic health check route
    app.get("/api/health", (req, res) => {
      res.json({ 
        status: "degraded", 
        message: "Some features may be unavailable",
        error: (error as Error).message 
      });
    });
  }

  // Setup WebSocket server
  // Vercel Node.js runtime DOES support WebSockets (when using @vercel/node builder)
  // Only disable if we're in a true serverless function environment
  if (!isServerless) {
    const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws: any, request: any) => {
    try {
      // Parse session from cookie to get authenticated user
      const cookieHeader = request.headers.cookie;
      if (!cookieHeader) {
        console.error("WebSocket connection rejected: No session cookie");
        ws.close(1008, "Unauthorized - No session");
        return;
      }

      // Extract session ID from cookie
      const cookies = cookieHeader
        .split(";")
        .reduce((acc: any, cookie: string) => {
          const [key, value] = cookie.trim().split("=");
          acc[key] = value;
          return acc;
        }, {});

      const sessionCookie = cookies["connect.sid"];
      if (!sessionCookie) {
        console.error("WebSocket connection rejected: No session ID");
        ws.close(1008, "Unauthorized - No session ID");
        return;
      }

      // Decode session ID (format: s:sessionId.signature)
      const sessionId = decodeURIComponent(sessionCookie)
        .split(".")[0]
        .substring(2);

      // Load session from PostgreSQL using shared session store
      const { sessionStore } = await import("./simple-auth");

      sessionStore.get(sessionId, async (err: any, session: any) => {
        if (err || !session || !session.userId) {
          console.error(
            "WebSocket connection rejected: Invalid or expired session",
            err,
          );
          ws.close(1008, "Unauthorized - Invalid session");
          return;
        }

        // Extract user from simple-auth session
        const userId = session.userId;
        const email = session.user?.email;

        if (!userId || !email) {
          console.error("WebSocket connection rejected: No user in session");
          ws.close(1008, "Unauthorized - No user");
          return;
        }

        console.log(`WebSocket authenticated for user: ${email} (${userId})`);
        handleWebSocket(ws, request, userId, email);
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
      ws.close(1011, "Internal server error");
    }
  });
  } else {
    // True serverless environment - use SSE fallback
    console.log("[Server] Serverless detected - WebSockets disabled, using SSE fallback");
    // SSE endpoint is already registered in routes.ts
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Don't throw after sending response - this crashes serverless functions!
    // Just log the error and send response
    console.error("[Error Handler]", err);
    res.status(status).json({ message });
    // Removed: throw err; - This was causing FUNCTION_INVOCATION_FAILED
  });

  // Serve static files AFTER API routes
  // This ensures API routes take precedence, and static files are a fallback
  if (isVercel) {
    // On Vercel, ALWAYS use the static-only module (no Vite/Rollup dependencies)
    // This prevents Rollup from being bundled or required at runtime
    console.log('[Server] Vercel detected - using static file server (NO VITE)');
    const { serveStatic } = await import("./static.js");
    serveStatic(app);
  } else if (process.env.VERCEL || process.env.VERCEL_ENV) {
    // Double-check: If somehow isVercel is false but env vars are set
    console.log('[Server] Vercel environment detected via env vars - using static server');
    const { serveStatic } = await import("./static.js");
    serveStatic(app);
  } else {
    // Local development ONLY: use vite.ts
    // This code path should NEVER execute on Vercel
    try {
      console.log('[Server] Loading vite module for local development...');
      const { setupVite, serveStatic, log } = await import("./vite.js");
      console.log('[Server] Vite module loaded successfully');
      
      // Check if we're in development mode by looking for build directory
      const fs = await import("fs");
      const path = await import("path");
      const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
      const hasBuild = fs.existsSync(distPath);
      
      // Use Vite dev server if no build exists OR if explicitly in dev mode
      const isDevelopment = !hasBuild || process.env.NODE_ENV === "development";
      
      log(`[Server] NODE_ENV: "${process.env.NODE_ENV}"`);
      log(`[Server] Build exists: ${hasBuild}`);
      log(`[Server] isDevelopment: ${isDevelopment}`);
      log(`[Server] Using ${isDevelopment ? 'Vite dev server' : 'static build'}`);
      
      if (isDevelopment) {
        // In local development, use Vite dev server
        await setupVite(app, server);
      } else {
        // In local production, serve static build
        serveStatic(app);
      }
    } catch (error) {
      console.error('[Server] Error loading vite module:', error);
      // Fallback to static serving if vite fails (should never happen on Vercel)
      console.log('[Server] Falling back to static file server');
      const { serveStatic } = await import("./static.js");
      serveStatic(app);
    }
  }

  // Only start listening if NOT on Vercel (serverless functions don't need this)
  if (!isVercel) {
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      console.log(`${formattedTime} [express] serving on port ${port}`);
    });
  }
}

// Start initialization
initPromise.catch((error) => {
  console.error("[Server] Fatal initialization error:", error);
  console.error("[Server] Error stack:", (error as Error).stack);
  // On Vercel, don't exit - let the middleware handle the error gracefully
  // This prevents FUNCTION_INVOCATION_FAILED errors
  if (!isVercel) {
    process.exit(1);
  }
});

// Export the app for Vercel serverless functions
// Vercel's @vercel/node will automatically handle Express apps
export { app as default };
