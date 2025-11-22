// Reference: javascript_log_in_with_replit, javascript_websocket blueprints
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { handleWebSocket } from "./websocket";
import { setupVite, serveStatic, log } from "./vite";

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

async function initializeApp() {

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function initializeApp() {
  // ✅ Register API routes (includes setupAuth with Replit OIDC)
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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // Check if we're in development mode by looking for build directory
  // This works around NODE_ENV being set in Replit Secrets
  const fs = await import("fs");
  const path = await import("path");
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  const hasBuild = fs.existsSync(distPath);
  
  // Use Vite dev server if no build exists OR if explicitly in dev mode
  const isDevelopment = !hasBuild || process.env.NODE_ENV === "development";
  
  console.log(`[Server] NODE_ENV: "${process.env.NODE_ENV}"`);
  console.log(`[Server] Build exists: ${hasBuild}`);
  console.log(`[Server] isDevelopment: ${isDevelopment}`);
  console.log(`[Server] Using ${isDevelopment ? 'Vite dev server' : 'static build'}`);
  
  if (isDevelopment && !isVercel) {
    // Only use Vite dev server in local development, not on Vercel
    await setupVite(app, server);
  } else {
    // On Vercel or production, serve static files
    serveStatic(app);
  }

  // Only start listening if NOT on Vercel (serverless functions don't need this)
  if (!isVercel) {
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  }
}

// Start initialization
initPromise.catch((error) => {
  console.error("[Server] Fatal initialization error:", error);
  if (!isVercel) {
    process.exit(1);
  }
});

// For Vercel: ensure app is initialized before handling requests
if (isVercel) {
  // Add middleware to wait for initialization
  app.use(async (req, res, next) => {
    try {
      await initPromise;
      if (initError) {
        return res.status(500).json({ 
          error: "Server initialization failed",
          message: initError.message 
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ 
        error: "Server initialization error",
        message: (error as Error).message 
      });
    }
  });
}

// Export the app for Vercel serverless functions
// Vercel's @vercel/node will automatically handle Express apps
export default app;
