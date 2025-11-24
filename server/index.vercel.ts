// Vercel-specific server entry point
// This file NEVER imports vite.ts to avoid Rollup being bundled
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

const app = express();
const server = createServer(app);

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
    console.error("[Server] Error stack:", (error as Error).stack);
    // Don't throw - let middleware handle the error gracefully
    // This prevents the serverless function from crashing
  }
})();

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow same-origin requests and any vercel deployment
  if (origin && (
    origin.includes('vercel.app') || 
    origin === 'http://localhost:5173' || 
    origin === 'http://localhost:5000'
  )) {
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

// Vercel: ensure app is initialized before handling ANY requests
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

// Request logging
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
  console.log("[Server] Initializing Vercel serverless function...");
  
  try {
    // Register API routes
    await registerRoutes(app);
    console.log("[Server] ✅ API routes registered");
  } catch (error) {
    console.error("[Server] Error registering routes:", error);
    // Don't throw - add a basic health check route instead
    app.get("/api/health", (req, res) => {
      res.json({ 
        status: "degraded", 
        message: "Some features may be unavailable",
        error: (error as Error).message 
      });
    });
    throw error; // Still throw to mark initialization as failed
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[Server] Error ${status}:`, message);
    console.error(err.stack);
    // Don't throw after sending response - this crashes serverless functions!
    res.status(status).json({ message });
    // Removed: throw err; - This was causing FUNCTION_INVOCATION_FAILED
  });

  // Serve static files - NO VITE IMPORTS
  console.log("[Server] Setting up static file serving...");
  serveStatic(app);
  console.log("[Server] ✅ Static files configured");
  
  console.log("[Server] ✅ Initialization complete");
}

// Start initialization - catch any unhandled errors
initPromise.catch((error) => {
  console.error("[Server] Fatal initialization error:", error);
  console.error("[Server] Error stack:", (error as Error).stack);
  // Don't let unhandled promise rejections crash the function
  // The middleware will handle returning errors to clients
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash - let the middleware handle it
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  // Don't crash - return error response instead
});

// Export the app for Vercel serverless functions
export default app;
