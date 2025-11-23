// Reference: javascript_log_in_with_replit, javascript_websocket blueprints
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { handleWebSocket } from "./websocket";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

const app = express();
const server = createServer(app);

// Check if running on Vercel (serverless)
const isVercel = !!process.env.VERCEL;

// Track initialization state
let isInitialized = false;
let initError: Error | null = null;
const initPromise = (async () => {
  try {
    await initializeApp();
    isInitialized = true;
  } catch (error) {
    initError = error as Error;
    console.error("[Server] Initialization failed:", error);
    throw error;
  }
})();

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
  // ✅ Register API routes FIRST (includes setupAuth with simple email/password)
  await registerRoutes(app);

  // Setup WebSocket server (only if not on Vercel - WebSockets don't work in serverless)
  if (!isVercel) {
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
    // On Vercel, provide a helpful error for WebSocket attempts
    app.get("/ws", (req, res) => {
      res.status(503).json({ 
        error: "WebSocket not available",
        message: "WebSocket connections are not supported in Vercel serverless functions. Please use HTTP polling or upgrade to a platform that supports persistent connections."
      });
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files AFTER API routes
  // This ensures API routes take precedence, and static files are a fallback
  // Import vite.ts dynamically to avoid bundling Vite/Rollup on Vercel
  const { setupVite, serveStatic, log } = await import("./vite");
  
  if (isVercel) {
    // On Vercel, ONLY serve static files - never use Vite
    console.log('[Server] Vercel detected - serving static files');
    serveStatic(app);
  } else {
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
  if (!isVercel) {
    process.exit(1);
  }
  // On Vercel, don't exit - let the middleware handle the error
});

// Export the app for Vercel serverless functions
// Vercel's @vercel/node will automatically handle Express apps
export default app;
