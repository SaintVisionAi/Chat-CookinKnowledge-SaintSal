import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // On Vercel, files are in dist/public relative to the built server file
  // Try multiple possible paths
  const possiblePaths = [
    path.resolve(import.meta.dirname, "public"),          // Built: dist/index.js -> dist/public
    path.resolve(import.meta.dirname, "..", "dist", "public"), // From server/ -> ../dist/public
    path.resolve(process.cwd(), "dist", "public"),        // From project root
    path.resolve("/var/task", "dist", "public"),          // Vercel serverless path
  ];

  console.log(`[serveStatic] import.meta.dirname: ${import.meta.dirname}`);
  console.log(`[serveStatic] process.cwd(): ${process.cwd()}`);
  
  let distPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    console.log(`[serveStatic] Checking: ${possiblePath} - exists: ${fs.existsSync(possiblePath)}`);
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      console.log(`[serveStatic] ✅ Found static files at: ${distPath}`);
      break;
    }
  }

  if (!distPath) {
    console.error(`[serveStatic] ❌ Could not find build directory. Tried:`, possiblePaths);
    // Don't throw - instead provide a helpful error route
    app.use("*", (_req, res) => {
      res.status(500).json({
        error: "Static files not found",
        message: "The application build files could not be located. Please ensure the build completed successfully.",
        triedPaths: possiblePaths,
        dirname: import.meta.dirname,
        cwd: process.cwd(),
      });
    });
    return;
  }

  console.log(`[serveStatic] Serving static files from: ${distPath}`);
  
  // Serve static files with proper MIME types
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath!, "index.html");
    console.log(`[serveStatic] Serving index.html from: ${indexPath}`);
    if (fs.existsSync(indexPath)) {
      res.setHeader('Content-Type', 'text/html');
      res.sendFile(indexPath);
    } else {
      console.error(`[serveStatic] index.html not found at: ${indexPath}`);
      res.status(404).json({
        error: "Not found",
        message: "The requested resource could not be found.",
        indexPath,
      });
    }
  });
}
