// Custom build script for Vercel deployment
// Bundles the server code while externalizing ONLY the packages that should be installed in production
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

console.log('[Build] Building Vercel serverless function...');

// These are the ONLY packages that should be external (installed via package.json dependencies)
const externalPackages = [
  // AI SDKs
  '@anthropic-ai/sdk',
  'openai',
  '@google/generative-ai',
  '@google/genai',
  
  // Database & ORM
  '@neondatabase/serverless',
  'drizzle-orm',
  'drizzle-zod',
  'postgres',
  
  // Express & middleware
  'express',
  'express-session',
  'connect-pg-simple',
  'ws',
  
  // Auth
  'openid-client',
  'passport',
  'passport-local',
  'bcryptjs',
  'jsonwebtoken',
  
  // Payments
  'stripe',
  
  // Utilities
  'dotenv',
  'nanoid',
  'memoizee',
  'multer',
  
  // React (for SSR if needed)
  'react',
  'react-dom',
  
  // CRITICAL: Exclude Vite/Rollup to prevent bundling in production
  'vite',
  '@vitejs/plugin-react',
  'rollup',
  '@rollup/rollup-linux-x64-gnu',
  '@rollup/rollup-darwin-x64',
  '@rollup/rollup-darwin-arm64',
  '@rollup/rollup-win32-x64-msvc',
  '@rollup/rollup-win32-arm64-msvc',
  '@rollup/rollup-linux-arm64-gnu',
  '@rollup/rollup-linux-arm64-musl',
  '@rollup/rollup-linux-x64-musl',
];

// Node.js built-in modules that should be external
const nodeBuiltins = [
  'fs', 'path', 'crypto', 'http', 'https', 'url', 'util', 'stream',
  'events', 'buffer', 'querystring', 'zlib', 'tty', 'os', 'net',
  'dns', 'child_process', 'cluster', 'dgram', 'readline', 'repl',
  'string_decoder', 'tls', 'vm', 'worker_threads'
];

try {
  await build({
    entryPoints: ['server/index.ts'], // Use full server with WebSocket support
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'api/index.js',
    external: [
      ...externalPackages, 
      ...nodeBuiltins,
      // CRITICAL: Explicitly exclude vite.ts and related files from bundle
      './vite.js',
      './vite',
      '../vite.config',
      '../vite.config.js',
    ],
    // Mark all Node.js built-ins as external
    packages: 'external', // Externalize all node_modules - only bundle our code
    sourcemap: false,
    minify: false, // Don't minify for better error messages
    logLevel: 'info',
    // Ensure imports are resolved correctly for ESM
    mainFields: ['module', 'main'],
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    // Exclude vite.ts from being analyzed/bundled
    plugins: [{
      name: 'exclude-vite',
      setup(build) {
        // Mark vite.ts as external so it's never bundled
        build.onResolve({ filter: /^\.\/vite\.(js|ts)$/ }, () => {
          return { external: true };
        });
        build.onResolve({ filter: /^\.\.\/vite\.config/ }, () => {
          return { external: true };
        });
      },
    }],
  });
  
  // Post-process the bundle to fix any directory imports
  // This fixes the ERR_UNSUPPORTED_DIR_IMPORT error
  console.log('[Build] Post-processing bundle to fix directory imports...');
  let code = readFileSync('api/index.js', 'utf-8');
  const originalCode = code;
  
  // Fix directory imports: from "./routes" -> from "./routes.js"
  // Match imports like: from "./routes" or from '../routes' but not from "./routes.js"
  code = code.replace(
    /from\s+['"](\.[^'"]*\/routes)(?!\.js)(?!\.ts)['"]/g,
    (match, path) => {
      return `from "${path}.js"`;
    }
  );
  
  // Also fix other common relative imports that might be missing extensions
  // This regex matches relative imports without extensions
  code = code.replace(
    /from\s+['"](\.[^'"]+)(?!\.js)(?!\.ts)(?!\.json)(?!\.mjs)['"]/g,
    (match, path) => {
      // Only fix if it's a local file import (starts with ./ or ../)
      // and doesn't already have an extension
      if (path.match(/^\.\.?\/[^/]+$/)) {
        return `from "${path}.js"`;
      }
      return match;
    }
  );
  
  if (code !== originalCode) {
    writeFileSync('api/index.js', code);
    console.log('[Build] ✅ Fixed directory imports in bundled output');
  }
  
  console.log('[Build] ✅ Vercel serverless function built successfully');
  console.log('[Build] Output: api/index.js');
} catch (error) {
  console.error('[Build] ❌ Build failed:', error);
  process.exit(1);
}
