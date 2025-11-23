# 🚀 Production Deployment Strategy - Split Architecture

## The Problem

Vercel serverless functions **cannot** maintain persistent WebSocket connections. This is a fundamental limitation of serverless architecture.

## The Solution: Split Frontend & Backend

### Architecture Overview

```
┌─────────────────────┐         ┌─────────────────────┐
│   Frontend (Vercel) │  ──────▶│  Backend (Render)  │
│                     │         │                     │
│  - React App        │  HTTP   │  - Express API     │
│  - Static Assets    │         │  - WebSocket (/ws)  │
│  - CDN Delivery     │  WS     │  - Database         │
└─────────────────────┘         └─────────────────────┘
```

### Why This Works

1. **Vercel** = Perfect for static frontend (CDN, edge caching, instant deploys)
2. **Render/Railway** = Perfect for backend (persistent connections, WebSockets, full Node.js)
3. **Best of Both Worlds** = Fast frontend + Real-time backend

---

## Option 1: Render.com (Recommended)

### Backend on Render

**Why Render:**
- ✅ Full WebSocket support
- ✅ Free tier available
- ✅ Auto-deploy from GitHub
- ✅ PostgreSQL included
- ✅ Easy scaling

**Setup:**
1. Create account at [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Build Command:** `npm run build && node scripts/build-vercel.js`
   - **Start Command:** `node api/index.js` (or `npm start`)
   - **Environment:** Node 18
5. Add environment variables
6. Deploy!

**Cost:** Free tier (with limitations) or $7/month for better performance

### Frontend on Vercel

1. Keep frontend deployment on Vercel
2. Update API URLs to point to Render backend
3. Deploy frontend separately

---

## Option 2: Railway.app

**Why Railway:**
- ✅ Excellent WebSocket support
- ✅ Simple deployment
- ✅ $5/month starter plan
- ✅ Great developer experience

**Setup:**
1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add PostgreSQL service
4. Deploy!

---

## Option 3: Fly.io

**Why Fly:**
- ✅ Global edge deployment
- ✅ WebSocket support
- ✅ Great for scaling
- ✅ Free tier available

**Setup:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. `fly launch`
3. Deploy!

---

## Implementation Steps

### Step 1: Separate Backend

Create `server/` as standalone backend:
- Express server
- WebSocket server
- API routes
- Database connection

### Step 2: Update Frontend

Update API endpoints in frontend:
```typescript
// client/src/lib/config.ts
export const API_URL = process.env.VITE_API_URL || 'https://your-backend.onrender.com';
export const WS_URL = process.env.VITE_WS_URL || 'wss://your-backend.onrender.com';
```

### Step 3: CORS Configuration

Backend must allow frontend origin:
```typescript
app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

### Step 4: Deploy

1. **Backend:** Deploy to Render/Railway/Fly
2. **Frontend:** Deploy to Vercel (pointing to backend)
3. **Test:** Verify WebSocket connections work

---

## Recommended: Render.com Setup

### Backend Deployment

1. **Create Render Service:**
   - Type: Web Service
   - Name: `saintsal-backend`
   - Environment: Node
   - Build Command: `npm install && npm run build && node scripts/build-vercel.js`
   - Start Command: `node api/index.js`
   - Plan: Free (or Starter $7/mo)

2. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://...
   SESSION_SECRET=...
   ANTHROPIC_API_KEY=...
   OPENAI_API_KEY=...
   NODE_ENV=production
   PORT=10000
   ```

3. **Custom Domain (Optional):**
   - Add `api.saintsal.ai` subdomain
   - Point DNS to Render

### Frontend Deployment

1. **Update Vercel Environment Variables:**
   ```
   VITE_API_URL=https://saintsal-backend.onrender.com
   VITE_WS_URL=wss://saintsal-backend.onrender.com
   ```

2. **Deploy to Vercel:**
   - Frontend builds automatically
   - Points to Render backend
   - WebSockets work perfectly!

---

## Benefits of Split Architecture

1. ✅ **WebSockets Work** - Full persistent connections
2. ✅ **Better Performance** - Frontend on CDN, backend optimized
3. ✅ **Easier Scaling** - Scale frontend and backend independently
4. ✅ **Cost Effective** - Use free tiers where possible
5. ✅ **Production Ready** - Industry standard architecture

---

## Migration Checklist

- [ ] Create Render/Railway account
- [ ] Deploy backend to Render
- [ ] Update frontend API URLs
- [ ] Configure CORS on backend
- [ ] Test WebSocket connections
- [ ] Update environment variables
- [ ] Deploy frontend to Vercel
- [ ] Test end-to-end
- [ ] Monitor both services

---

## Next Steps

1. **Choose platform** (Render recommended)
2. **Deploy backend** first
3. **Update frontend** to point to backend
4. **Test thoroughly**
5. **Deploy frontend**

This architecture will give you **production-ready, scalable WebSocket streaming**! 🚀

