# Favicon Update Instructions

## Your New Logo
Based on your description, you have a beautiful golden robot logo with:
- **Text**: "Sv." and "Cookin'Knowledge."
- **Style**: 3D metallic gold/bronze design
- **Robot**: Pointing forward with dark visor

## Steps to Update

### 1. Prepare Your Logo Image
- **Format**: PNG (recommended) or ICO
- **Size**: At least 512x512px (for best quality)
- **Background**: Transparent or solid color
- **File name**: `favicon.png`

### 2. Replace the Favicon File
1. Save your logo image as `favicon.png`
2. Replace the existing file at: `client/public/favicon.png`
3. The file will automatically be copied to `dist/public/` during build

### 3. Optional: Create Multiple Sizes
For best browser/app support, you can create multiple sizes:
- `favicon.png` - 512x512px (main favicon)
- `favicon.ico` - 32x32px or 16x16px (for older browsers)
- `icon-192x192.png` - For PWA manifest
- `icon-512x512.png` - For PWA manifest

### 4. Build and Deploy
After replacing the file:
```bash
npm run build
git add client/public/favicon.png
git commit -m "Update favicon with new logo"
git push
```

## Current Configuration
- ✅ HTML references `/favicon.png` and `/favicon.ico`
- ✅ Manifest.json references various icon sizes
- ✅ Apple touch icon configured
- ✅ Theme color: #f59e0b (gold)

## Quick Copy Command
If you have your logo file ready:
```bash
# Replace this path with your actual logo file location
cp /path/to/your/logo.png client/public/favicon.png
```

The favicon will automatically appear after the next deployment!

