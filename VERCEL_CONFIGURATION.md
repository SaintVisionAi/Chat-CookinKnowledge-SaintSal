# Vercel Configuration Guide

## ✅ Required Vercel Project Settings

To fix the "Configuration Settings mismatch" error, ensure your Vercel project settings match the following:

### Build & Development Settings

1. **Framework Preset**: `Other` (or leave blank)
2. **Build Command**: `npm run vercel-build`
3. **Output Directory**: `dist/public`
4. **Install Command**: `npm install` (or `yarn install`, `pnpm install`, `bun install`)

### Root Directory

- Leave **empty** (unless your code is in a subdirectory)
- ✅ Check: "Include files outside the root directory in the Build Step"

### Node.js Version

- Set to: **22.x** (or 20.x minimum)
- This is critical for ESM module support

### Important Notes

1. **Remove Production Overrides**: If you have Production Overrides set, they should match your Project Settings exactly, or remove them to use Project Settings.

2. **Build Command**: Must be `npm run vercel-build` (not `npm run build`)

3. **Output Directory**: Must be `dist/public` (this is where Vite builds the frontend)

## 🔍 Verifying Configuration

After updating settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **General**
3. Scroll to **Build & Development Settings**
4. Ensure all settings match the above
5. If you see **Production Overrides**, either:
   - Remove them (recommended), OR
   - Make them match Project Settings exactly

## 🚀 Deployment

Once settings are aligned:

1. The next deployment will use the correct build command
2. The serverless function will be built to `api/index.js`
3. Static files will be served from `dist/public`

## ⚠️ Common Issues

### Issue: "Configuration Settings mismatch"
**Solution**: Remove Production Overrides or make them match Project Settings

### Issue: "FUNCTION_INVOCATION_FAILED"
**Solution**: 
- Check Node.js version is 20.x or 22.x
- Verify build command is `npm run vercel-build`
- Check Vercel logs for specific error messages

### Issue: "Directory import errors"
**Solution**: Already fixed in code - ensure you're using the latest commit

## 📝 Current Configuration

Your `vercel.json` is configured as:
```json
{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist/public",
  "functions": {
    "api/index.js": {
      "includeFiles": "dist/public/**"
    }
  }
}
```

This should work with the Project Settings listed above.

