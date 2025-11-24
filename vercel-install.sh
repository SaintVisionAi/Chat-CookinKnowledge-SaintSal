#!/bin/bash
# Vercel install script - installs all deps for build, then prunes for runtime

echo "Installing all dependencies for build..."
npm ci

echo "Build complete, pruning devDependencies..."
npm prune --production

echo "Verifying vite is removed..."
if [ -d "node_modules/vite" ]; then
  echo "WARNING: vite still present, removing manually"
  rm -rf node_modules/vite
  rm -rf node_modules/@vitejs
  rm -rf node_modules/rollup
  rm -rf node_modules/@rollup
fi

echo "Install complete - devDependencies removed"
