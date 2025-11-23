// Cleanup script - removes vite and rollup from node_modules after build
// This prevents the Rollup native module error on Vercel
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

console.log('[Cleanup] Removing Vite and Rollup from node_modules...');

// Only run on Vercel
if (!process.env.VERCEL) {
  console.log('[Cleanup] Not on Vercel, skipping cleanup');
  process.exit(0);
}

try {
  // Remove vite and all related packages
  const packagesToRemove = [
    'vite',
    'rollup',
    '@rollup/rollup-linux-x64-gnu',
    '@rollup/rollup-darwin-x64',
    '@rollup/rollup-win32-x64-msvc',
    'vite-plugin-checker',
    '@vitejs/plugin-react',
    '@replit/vite-plugin-cartographer',
    '@replit/vite-plugin-dev-banner',
    '@replit/vite-plugin-runtime-error-modal',
    '@tailwindcss/vite',
  ];

  for (const pkg of packagesToRemove) {
    const pkgPath = path.join(process.cwd(), 'node_modules', pkg);
    try {
      await fs.rm(pkgPath, { recursive: true, force: true });
      console.log(`[Cleanup] ✅ Removed ${pkg}`);
    } catch (error) {
      // Ignore if package doesn't exist
      console.log(`[Cleanup] ⊘ ${pkg} not found (already removed or not installed)`);
    }
  }

  console.log('[Cleanup] ✅ Cleanup complete');
} catch (error) {
  console.error('[Cleanup] ❌ Cleanup failed:', error);
  // Don't fail the build if cleanup fails
  process.exit(0);
}
