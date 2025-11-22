import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // On Vercel, files are in dist/public relative to the built server file
  // The built server file is in dist/, so we need to go up one level and into dist/public
  // But import.meta.dirname in the built file points to dist/, so we look for dist/public
  // However, when running locally, import.meta.dirname is server/, so we look for server/public
  // Try multiple possible paths
  const possiblePaths = [
    path.resolve(import.meta.dirname, "..", "dist", "public"), // Vercel: dist/index.js -> dist/public
    path.resolve(import.meta.dirname, "public"), // Local: server/index.ts -> server/public
    path.resolve(process.cwd(), "dist", "public"), // Fallback: project root -> dist/public
  ];

  let distPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      break;
    }
  }

  if (!distPath) {
    console.error(`[serveStatic] Could not find build directory. Tried:`, possiblePaths);
    // Don't throw - instead provide a helpful error route
    app.use("*", (_req, res) => {
      res.status(500).json({
        error: "Static files not found",
        message: "The application build files could not be located. Please ensure the build completed successfully.",
        triedPaths: possiblePaths,
      });
    });
    return;
  }

  console.log(`[serveStatic] Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        error: "Not found",
        message: "The requested resource could not be found.",
      });
    }
  });
}
