import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';
import { users } from './shared/schema.ts';
import crypto from 'crypto';

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function createTestUser() {
  const passwordHash = await bcrypt.hash('ar404345', 10);
  
  try {
    const [user] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email: 'arafat@email.com',
      passwordHash: passwordHash,
      firstName: 'Arafat',
      lastName: 'User',
      phone: '1234567890',
      role: 'admin',
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash: passwordHash,
      }
    }).returning();
    
    console.log(' Test user created:', user.email);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error(' Error:', error);
    await pool.end();
    process.exit(1);
  }
}

createTestUser();
