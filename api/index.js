// Vercel serverless function entry point
// This imports the built Express app and exports it for Vercel

console.log('[Vercel] Starting serverless function...');
console.log('[Vercel] __dirname:', import.meta.url);
console.log('[Vercel] process.cwd():', process.cwd());
console.log('[Vercel] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  SESSION_SECRET: process.env.SESSION_SECRET ? 'Set' : 'Not set'
});

// Add error logging for module import failures
let app;
try {
  console.log('[Vercel] Importing Express app from ../dist/index.js...');
  const module = await import('../dist/index.js');
  app = module.default;
  console.log('[Vercel] ✅ Successfully imported Express app');
  
  if (!app) {
    throw new Error('Express app is undefined');
  }
  
  if (typeof app !== 'function') {
    console.error('[Vercel] ❌ App is not a function, it is:', typeof app);
    throw new Error('Imported module is not an Express app');
  }
  
  console.log('[Vercel] ✅ Express app is valid');
} catch (error) {
  console.error('[Vercel] ❌ Failed to import app:', error);
  console.error('[Vercel] Error stack:', error.stack);
  
  // Create a fallback app that shows the error
  const express = (await import('express')).default;
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'Serverless function failed to initialize',
      message: error.message,
      stack: error.stack
    });
  });
}

export default app;
