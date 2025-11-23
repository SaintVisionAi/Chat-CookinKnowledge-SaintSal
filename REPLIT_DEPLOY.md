# 🚀 Replit Deployment Checklist

This document outlines what's needed to deploy this project on Replit.

## ✅ Essential Files (Already in Repo)

### Core Application
- ✅ `package.json` - Dependencies and scripts
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `vite.config.ts` - Vite build configuration
- ✅ `drizzle.config.ts` - Database ORM configuration
- ✅ `tailwind.config.ts` - Tailwind CSS configuration
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `components.json` - UI components configuration

### Replit Configuration
- ✅ `.replit` - Replit deployment settings (KEEP THIS!)
- ✅ `replit.md` - Replit documentation

### Source Code
- ✅ `client/` - React frontend
- ✅ `server/` - Express backend
- ✅ `shared/` - Shared TypeScript types
- ✅ `scripts/` - Database migration scripts

### Documentation
- ✅ `README.md` - Main documentation
- ✅ `LICENSE` - License file
- ✅ `.env.example` - Environment variables template

## 🚫 Excluded Files (in .gitignore)

### Never Commit
- ❌ `.env` - Contains API keys and secrets
- ❌ `node_modules/` - Installed dependencies (npm will reinstall)
- ❌ `dist/` - Build output (generated on deployment)
- ❌ `attached_assets/` - Screenshots and temporary files
- ❌ `*.log` - Log files
- ❌ `cookies.txt` - Testing files

### Development Only
- ❌ `test_ws.js`, `test_ws.mjs` - WebSocket test scripts
- ❌ `*.sql` - Database setup scripts (one-time use)
- ❌ `reset-database.ts` - Database reset script
- ❌ `*.png`, `*.jpg` - Screenshots

### IDE/OS Specific
- ❌ `.vscode/` - VS Code settings
- ❌ `.DS_Store` - macOS files
- ❌ `Thumbs.db` - Windows files

## 🔐 Required Environment Variables

Create these in Replit Secrets:

```env
# Database (Required)
DATABASE_URL=postgresql://...

# Session (Required)
SESSION_SECRET=your-random-secret-here

# AI Providers (At least one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
GROK_API_KEY=xai-...

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

## 📦 Deployment Steps on Replit

1. **Import from GitHub**
   - Connect your GitHub repository to Replit
   - Replit will detect the `.replit` configuration

2. **Set Environment Variables**
   - Go to Secrets tab
   - Add all required environment variables
   - Use `.env.example` as a template

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Push Database Schema**
   ```bash
   npm run db:push
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Deploy to Production**
   - Click "Deploy" button in Replit
   - Replit will run `npm run build` and `npm start`

## 🔍 What Gets Deployed

### Source Files
- All `client/` code (React app)
- All `server/` code (Express API)
- All `shared/` code (TypeScript types)
- Configuration files (tsconfig, vite, etc.)

### Generated on Deploy
- `node_modules/` (from package.json)
- `dist/` (from build command)
- Database tables (from drizzle schema)

### Not Deployed
- Development files
- Test scripts
- Screenshots
- Local environment files

## 💡 Tips

1. **Always use `.env.example`** - Never commit real API keys
2. **Keep `.replit` file** - Essential for Replit deployment
3. **Database migrations** - Use `npm run db:push` for schema changes
4. **Port configuration** - Replit uses port 5000 (set in .replit)
5. **WebSocket support** - Works automatically on Replit

## 🆘 Troubleshooting

### If deployment fails:
1. Check Replit console for errors
2. Verify all environment variables are set
3. Ensure DATABASE_URL is valid
4. Run `npm run db:push` to sync database

### If app won't start:
1. Check Node.js version (requires Node 18+)
2. Clear build cache and reinstall: `rm -rf node_modules && npm install`
3. Check port 5000 is not blocked

## 📚 Related Documentation

- [Main README](./README.md) - Full project documentation
- [Replit Guide](./replit.md) - Replit-specific information
- [Environment Variables](./.env.example) - Required secrets template
