// Custom build script for Vercel deployment
// Bundles the server code while externalizing ONLY the packages that should be installed in production
import { build } from 'esbuild';

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
];

try {
  await build({
    entryPoints: ['server/index.vercel.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'dist/index.vercel.js',
    external: externalPackages,
    // Do NOT use packages: 'external' - this would externalize everything including vite
    sourcemap: false,
    minify: false, // Don't minify for better error messages
    logLevel: 'info',
  });
  
  console.log('[Build] ✅ Vercel serverless function built successfully');
  console.log('[Build] Output: dist/index.vercel.js');
} catch (error) {
  console.error('[Build] ❌ Build failed:', error);
  process.exit(1);
}
