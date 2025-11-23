import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Initialize database connection
// Note: This will throw if DATABASE_URL is missing, but that's intentional
// as the app cannot function without a database. The error will be caught
// during initialization and returned as a proper HTTP error response.
if (!process.env.DATABASE_URL) {
  console.error("[db] DATABASE_URL is not set. Database operations will fail.");
  // Don't throw here - let it fail when actually used so we can return proper errors
}

export const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null as any; // Type assertion to allow import, but will fail at runtime if used

export const db = pool ? drizzle({ client: pool, schema }) : null as any;
