# GitHub Copilot Instructions for Cookin' Knowledge (SaintSal™)

This file provides context and guidelines for GitHub Copilot when working on the Cookin' Knowledge platform.

## Project Overview

**Cookin' Knowledge (SaintSal™)** is an enterprise-grade AI chat platform that combines multiple AI providers (Anthropic Claude, OpenAI GPT, Google Gemini, Perplexity, Grok) with extended memory capabilities. The platform offers five AI modes: Chat, Web Search, Deep Research, Code Agent, and Voice Mode.

### Key Features
- Multi-provider AI integration with WebSocket streaming
- Extended memory architecture (personal and team memory)
- Real-time conversation with token-by-token responses
- Voice interaction via ElevenLabs TTS
- API playground for testing and development
- Stripe subscription management
- Role-based access control (Admin, Developer, Viewer)
- Mobile-first PWA design optimized for 81% mobile users

### Patent Protection
Protected by **U.S. Patent #10,290,222** for escalation/de-escalation in virtual environments.

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Real-time**: WebSocket (ws library) for streaming
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: OpenID Connect (Replit Auth) with express-session
- **Session Store**: PostgreSQL via connect-pg-simple
- **Payments**: Stripe

### AI Providers
- **Anthropic SDK**: `@anthropic-ai/sdk` for Claude models
- **OpenAI SDK**: `openai` for GPT models
- **Google Generative AI**: `@google/generative-ai` for Gemini
- **Perplexity API**: Web search with citations
- **ElevenLabs**: Text-to-speech synthesis
- **Grok**: X.AI integration

## Project Structure

```
/
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/       # Main page components (Chat, Dashboard, Playground)
│   │   ├── components/  # Reusable UI components
│   │   ├── lib/         # Utilities and helpers
│   │   └── hooks/       # Custom React hooks
│   └── index.html
├── server/              # Express backend
│   ├── providers/       # AI provider integrations (anthropic.ts, openai.ts, etc.)
│   ├── routes/          # API route handlers
│   ├── routes.ts        # Main route definitions
│   ├── websocket.ts     # WebSocket streaming logic
│   ├── replitAuth.ts    # OIDC authentication
│   ├── storage.ts       # Database operations
│   └── index.ts         # Server entry point
├── shared/              # Shared code between client and server
│   └── schema.ts        # Drizzle ORM schema definitions
├── migrations/          # Database migrations
└── scripts/             # Build and utility scripts
```

## Coding Conventions

### TypeScript
- **Module System**: Use ESM imports (`import`/`export`)
- **Type Safety**: Prefer explicit types over `any`
- **Type Definitions**: Define interfaces for all data structures
- **Zod Schemas**: Use Zod for runtime validation and type inference
- **File Extensions**: Use `.ts` for TypeScript files, `.tsx` for React components

### React Components
- **Function Components**: Always use functional components with hooks
- **Component Structure**: 
  1. Imports
  2. Type/interface definitions
  3. Component function
  4. Export
- **Props**: Define explicit prop interfaces using TypeScript
- **Hooks**: Custom hooks should start with `use` prefix
- **Event Handlers**: Name handlers with `handle` prefix (e.g., `handleClick`)

### Styling
- **TailwindCSS**: Primary styling method using utility classes
- **Component Library**: Use Shadcn/ui components as base
- **Design System**: Follow the SaintSal™ aesthetic defined in `design_guidelines.md`
- **Colors**:
  - Deep charcoal black: `#0f0f0f`
  - Metallic gold: `#E6B325` 
  - Neon blue: `#4DA6FF`
- **Typography**: Space Grotesk font family (narrow, high-contrast)
- **Spacing**: Use Tailwind units: 2, 4, 6, 8, 12, 16, 20

### Database
- **ORM**: Drizzle ORM for type-safe queries
- **Schema**: Define in `shared/schema.ts`
- **Migrations**: Use `npm run db:push` for schema changes
- **Queries**: Use Drizzle's query builder, not raw SQL
- **Transactions**: Use `db.transaction()` for multi-step operations

### API Design
- **REST Routes**: Define in `server/routes.ts`
- **WebSocket**: Use for real-time streaming (see `server/websocket.ts`)
- **Error Handling**: Return consistent error responses with status codes
- **Authentication**: All routes should check session authentication
- **Rate Limiting**: Implement tier-based rate limits (see `server/tier-limits.ts`)

### AI Provider Integration
- **Pattern**: Each provider has its own file in `server/providers/`
- **Streaming**: All AI responses should support streaming via WebSocket
- **Error Handling**: Gracefully handle API errors and fallbacks
- **Token Counting**: Track usage for billing purposes
- **Memory Context**: Include conversation history in prompts

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run check

# Database schema push
npm run db:push
```

## Build Process
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles to `dist/index.js`
- Production: `npm run build` creates optimized bundles

## Testing
- Currently no automated test suite
- Manual testing via development server
- Test AI integrations in API Playground

## Security Guidelines

### Authentication
- **OIDC**: Use Replit's OpenID Connect for authentication
- **Sessions**: Store in PostgreSQL with `connect-pg-simple`
- **Session Secret**: Must be set via `SESSION_SECRET` environment variable
- **User Isolation**: Always filter queries by `userId`

### API Keys
- **Storage**: Store in environment variables, never commit to code
- **Access**: Use server-side only, never expose to client
- **Validation**: Check for required API keys at startup

### Data Privacy
- **User Data**: Isolate per user with proper database queries
- **Conversations**: Private by default unless explicitly shared to team
- **Audit Logs**: Track all administrative actions

## Environment Variables

Required environment variables:
```
# Core
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-here
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id

# AI Providers (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
GROK_API_KEY=xai-...

# Stripe (optional)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

## Common Patterns

### WebSocket Streaming
```typescript
// Server-side streaming
for await (const chunk of stream) {
  ws.send(JSON.stringify({ type: 'token', content: chunk }));
}
ws.send(JSON.stringify({ type: 'done' }));
```

### Database Queries
```typescript
// Always include userId for data isolation
const conversations = await db
  .select()
  .from(conversationsTable)
  .where(eq(conversationsTable.userId, userId));
```

### Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error('Operation failed:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

### React Components
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = async () => {
    setIsLoading(true);
    await onAction();
    setIsLoading(false);
  };

  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {title}
    </Button>
  );
}
```

## Key Files to Reference

- **Design System**: `design_guidelines.md` - Complete UI/UX guidelines
- **Database Schema**: `shared/schema.ts` - All table definitions
- **API Routes**: `server/routes.ts` - REST endpoint definitions
- **WebSocket Logic**: `server/websocket.ts` - Real-time streaming
- **Auth Configuration**: `server/replitAuth.ts` - OIDC setup
- **AI Providers**: `server/providers/` - Integration implementations
- **Deployment Guide**: `VERCEL_DEPLOYMENT.md` - Production setup

## Mobile-First Considerations

- 81% of users access via mobile devices
- Prominent walkie-talkie button for voice mode
- Touch-optimized controls (44px+ touch targets)
- Responsive layouts with breakpoints: <768px (mobile), 768-1024px (tablet), >1024px (desktop)
- Sticky input positioning for seamless interaction
- Collapsible sidebar on mobile

## Performance Guidelines

- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Optimize images before committing
- **Bundle Size**: Monitor and minimize JavaScript bundle size
- **Database Queries**: Use indexes and optimize N+1 queries
- **WebSocket**: Implement backpressure for streaming
- **Caching**: Cache static assets and API responses where appropriate

## Deployment

- **Platform**: Vercel (recommended) or Replit
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment**: Set all required environment variables in platform settings
- **Database**: Use Neon PostgreSQL for production
- **WebSocket**: Ensure platform supports WebSocket connections

## Additional Resources

- **README.md**: Complete project overview and setup
- **VERCEL_DEPLOYMENT.md**: Detailed deployment guide
- **VERCEL_ERROR_FIX_EXPLANATION.md**: Common deployment issues
- **FAVICON_UPDATE_INSTRUCTIONS.md**: Branding assets guide
- **replit.md**: Replit-specific deployment notes

## Working with Copilot

When generating code:
1. Follow the established project structure
2. Use TypeScript with proper types
3. Implement proper error handling
4. Include authentication checks
5. Follow the design system for UI components
6. Ensure mobile-responsive layouts
7. Use established AI provider patterns
8. Include proper data isolation by userId
9. Test WebSocket streaming for AI responses
10. Reference existing code patterns before creating new ones
