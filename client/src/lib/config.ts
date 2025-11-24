// API Configuration - supports split frontend/backend architecture
// Frontend can be on Vercel, backend on Render/Railway/Fly.io

// Backend API URL (defaults to same origin for monolith, or separate for split)
export const API_URL = import.meta.env.VITE_API_URL || '';
export const WS_URL = import.meta.env.VITE_WS_URL || '';

// Helper to get full API endpoint
export function getApiUrl(path: string): string {
  if (API_URL) {
    // Split architecture - use configured backend URL
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }
  // Monolith - use same origin
  return path.startsWith('/') ? path : `/${path}`;
}

// Helper to get WebSocket URL
export function getWebSocketUrl(path: string = '/ws'): string {
  if (WS_URL) {
    // Split architecture - use configured WebSocket URL
    return `${WS_URL}${path}`;
  }
  // Monolith - use same origin with ws/wss protocol
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}

// Check if we're in split architecture mode
export const isSplitArchitecture = !!(API_URL || WS_URL);

