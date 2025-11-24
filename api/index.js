var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  apiEnvironments: () => apiEnvironments,
  apiEnvironmentsRelations: () => apiEnvironmentsRelations,
  apiRequestHistory: () => apiRequestHistory,
  apiRequestHistoryRelations: () => apiRequestHistoryRelations,
  chatModeEnum: () => chatModeEnum,
  conversations: () => conversations,
  conversationsRelations: () => conversationsRelations,
  environmentVariables: () => environmentVariables,
  environmentVariablesRelations: () => environmentVariablesRelations,
  insertApiEnvironmentSchema: () => insertApiEnvironmentSchema,
  insertApiRequestHistorySchema: () => insertApiRequestHistorySchema,
  insertConversationSchema: () => insertConversationSchema,
  insertEnvironmentVariableSchema: () => insertEnvironmentVariableSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertOrganizationMemberSchema: () => insertOrganizationMemberSchema,
  insertOrganizationSchema: () => insertOrganizationSchema,
  insertTeamMemorySchema: () => insertTeamMemorySchema,
  insertVerifiedDomainSchema: () => insertVerifiedDomainSchema,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  organizationMembers: () => organizationMembers,
  organizationMembersRelations: () => organizationMembersRelations,
  organizations: () => organizations,
  organizationsRelations: () => organizationsRelations,
  sessions: () => sessions,
  teamMemory: () => teamMemory,
  teamMemoryRelations: () => teamMemoryRelations,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  verifiedDomains: () => verifiedDomains,
  verifiedDomainsRelations: () => verifiedDomainsRelations
});
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions, userRoleEnum, chatModeEnum, users, conversations, insertConversationSchema, messages, insertMessageSchema, apiEnvironments, insertApiEnvironmentSchema, environmentVariables, insertEnvironmentVariableSchema, apiRequestHistory, insertApiRequestHistorySchema, organizations, insertOrganizationSchema, organizationMembers, insertOrganizationMemberSchema, verifiedDomains, insertVerifiedDomainSchema, teamMemory, insertTeamMemorySchema, usersRelations, conversationsRelations, messagesRelations, apiEnvironmentsRelations, environmentVariablesRelations, apiRequestHistoryRelations, teamMemoryRelations, organizationsRelations, organizationMembersRelations, verifiedDomainsRelations;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    userRoleEnum = pgEnum("user_role", ["admin", "developer", "viewer"]);
    chatModeEnum = pgEnum("chat_mode", ["chat", "search", "research", "code", "voice"]);
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique().notNull(),
      passwordHash: varchar("password_hash"),
      // For simple authentication
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      phone: varchar("phone"),
      // Phone number
      profileImageUrl: varchar("profile_image_url"),
      role: userRoleEnum("role").default("viewer").notNull(),
      stripeCustomerId: varchar("stripe_customer_id"),
      stripeSubscriptionId: varchar("stripe_subscription_id"),
      subscriptionStatus: varchar("subscription_status").default("free"),
      subscriptionTier: varchar("subscription_tier").default("free"),
      // free, starter, pro, enterprise
      messageCount: integer("message_count").default(0),
      // Monthly message count
      messageLimit: integer("message_limit").default(100),
      // Monthly message limit
      lastResetAt: timestamp("last_reset_at").defaultNow(),
      // Last monthly reset
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    conversations = pgTable("conversations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      title: varchar("title").notNull(),
      model: varchar("model").notNull().default("claude-sonnet-4-5"),
      mode: chatModeEnum("mode").default("chat").notNull(),
      // Extended Memory Fields
      context: jsonb("context"),
      // User preferences, writing style, domain knowledge
      summary: text("summary"),
      // AI-generated conversation summary
      keyTopics: text("key_topics").array(),
      // Important topics discussed
      isShared: boolean("is_shared").default(false),
      // Team memory flag
      sharedWith: text("shared_with").array(),
      // User IDs who can access
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertConversationSchema = createInsertSchema(conversations).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    messages = pgTable("messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
      role: varchar("role").notNull(),
      // 'user' or 'assistant'
      content: text("content").notNull(),
      model: varchar("model"),
      // Advanced Features
      searchResults: jsonb("search_results"),
      // Web search results with citations
      reasoning: text("reasoning"),
      // Chain-of-thought for deep research
      codeFiles: jsonb("code_files"),
      // Multi-file code edits
      voiceTranscript: text("voice_transcript"),
      // Original voice input
      attachments: jsonb("attachments"),
      // File uploads metadata
      createdAt: timestamp("created_at").defaultNow()
    });
    insertMessageSchema = createInsertSchema(messages).omit({
      id: true,
      createdAt: true
    });
    apiEnvironments = pgTable("api_environments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: varchar("name").notNull(),
      description: text("description"),
      isDefault: boolean("is_default").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertApiEnvironmentSchema = createInsertSchema(apiEnvironments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    environmentVariables = pgTable("environment_variables", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      environmentId: varchar("environment_id").notNull().references(() => apiEnvironments.id, { onDelete: "cascade" }),
      key: varchar("key").notNull(),
      value: text("value").notNull(),
      // Will be encrypted
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertEnvironmentVariableSchema = createInsertSchema(environmentVariables).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    apiRequestHistory = pgTable("api_request_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      environmentId: varchar("environment_id").references(() => apiEnvironments.id, { onDelete: "set null" }),
      method: varchar("method").notNull(),
      url: text("url").notNull(),
      headers: jsonb("headers"),
      body: text("body"),
      response: text("response"),
      statusCode: integer("status_code"),
      responseTime: integer("response_time"),
      // in milliseconds
      createdAt: timestamp("created_at").defaultNow()
    });
    insertApiRequestHistorySchema = createInsertSchema(apiRequestHistory).omit({
      id: true,
      createdAt: true
    });
    organizations = pgTable("organizations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      ownerId: varchar("owner_id").notNull().references(() => users.id),
      // Subscription info
      subscriptionTier: varchar("subscription_tier").default("enterprise").notNull(),
      seatLimit: integer("seat_limit").default(5).notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertOrganizationSchema = createInsertSchema(organizations).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    organizationMembers = pgTable("organization_members", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      role: varchar("role").default("member").notNull(),
      // 'owner', 'admin', 'member'
      createdAt: timestamp("created_at").defaultNow()
    });
    insertOrganizationMemberSchema = createInsertSchema(organizationMembers).omit({
      id: true,
      createdAt: true
    });
    verifiedDomains = pgTable("verified_domains", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      domain: varchar("domain").notNull(),
      isVerified: boolean("is_verified").default(false),
      verificationToken: varchar("verification_token"),
      createdAt: timestamp("created_at").defaultNow(),
      verifiedAt: timestamp("verified_at")
    });
    insertVerifiedDomainSchema = createInsertSchema(verifiedDomains).omit({
      id: true,
      createdAt: true,
      verifiedAt: true
    });
    teamMemory = pgTable("team_memory", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
      // Memory Content
      title: varchar("title").notNull(),
      content: text("content").notNull(),
      category: varchar("category"),
      // 'knowledge', 'procedure', 'context', 'preference'
      tags: text("tags").array(),
      // Access Control
      createdBy: varchar("created_by").notNull().references(() => users.id),
      sharedWith: text("shared_with").array(),
      // User IDs or 'all'
      isPublic: boolean("is_public").default(false),
      // Memory Metadata
      usageCount: integer("usage_count").default(0),
      lastUsed: timestamp("last_used"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertTeamMemorySchema = createInsertSchema(teamMemory).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    usersRelations = relations(users, ({ many }) => ({
      conversations: many(conversations),
      apiEnvironments: many(apiEnvironments),
      apiRequestHistory: many(apiRequestHistory),
      teamMemories: many(teamMemory)
    }));
    conversationsRelations = relations(conversations, ({ one, many }) => ({
      user: one(users, {
        fields: [conversations.userId],
        references: [users.id]
      }),
      messages: many(messages)
    }));
    messagesRelations = relations(messages, ({ one }) => ({
      conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id]
      })
    }));
    apiEnvironmentsRelations = relations(apiEnvironments, ({ one, many }) => ({
      user: one(users, {
        fields: [apiEnvironments.userId],
        references: [users.id]
      }),
      variables: many(environmentVariables),
      requestHistory: many(apiRequestHistory)
    }));
    environmentVariablesRelations = relations(environmentVariables, ({ one }) => ({
      environment: one(apiEnvironments, {
        fields: [environmentVariables.environmentId],
        references: [apiEnvironments.id]
      })
    }));
    apiRequestHistoryRelations = relations(apiRequestHistory, ({ one }) => ({
      user: one(users, {
        fields: [apiRequestHistory.userId],
        references: [users.id]
      }),
      environment: one(apiEnvironments, {
        fields: [apiRequestHistory.environmentId],
        references: [apiEnvironments.id]
      })
    }));
    teamMemoryRelations = relations(teamMemory, ({ one }) => ({
      creator: one(users, {
        fields: [teamMemory.createdBy],
        references: [users.id]
      }),
      organization: one(organizations, {
        fields: [teamMemory.organizationId],
        references: [organizations.id]
      })
    }));
    organizationsRelations = relations(organizations, ({ one, many }) => ({
      owner: one(users, {
        fields: [organizations.ownerId],
        references: [users.id]
      }),
      members: many(organizationMembers),
      verifiedDomains: many(verifiedDomains),
      teamMemories: many(teamMemory)
    }));
    organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
      organization: one(organizations, {
        fields: [organizationMembers.organizationId],
        references: [organizations.id]
      }),
      user: one(users, {
        fields: [organizationMembers.userId],
        references: [users.id]
      })
    }));
    verifiedDomainsRelations = relations(verifiedDomains, ({ one }) => ({
      organization: one(organizations, {
        fields: [verifiedDomains.organizationId],
        references: [organizations.id]
      })
    }));
  }
});

// server/storage.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { eq, desc } from "drizzle-orm";
var pool, db, DbStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool);
    DbStorage = class {
      // Users
      async upsertUser(user) {
        try {
          const [result] = await db.insert(users).values(user).onConflictDoUpdate({
            target: users.id,
            // Conflict on sub (primary key)
            set: {
              email: user.email,
              // Update email if user logs in again
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              updatedAt: /* @__PURE__ */ new Date()
            }
          }).returning();
          return result;
        } catch (error) {
          if (error.code === "23505" && error.constraint === "users_email_unique") {
            console.error(`[upsertUser] Email conflict: ${user.email} already exists with different OIDC sub`);
            console.error(`[upsertUser] Attempted sub: ${user.id}, Error: ${error.message}`);
            throw new Error(`This email is already associated with another account. Please use a different email or contact support.`);
          }
          throw error;
        }
      }
      async getUserById(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return user;
      }
      async updateUser(id, updates) {
        const [updated] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        if (!updated) {
          throw new Error("User not found");
        }
        return updated;
      }
      // Conversations
      async createConversation(data) {
        const [conversation] = await db.insert(conversations).values(data).returning();
        return conversation;
      }
      async getConversationsByUserId(userId) {
        return await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
      }
      async getConversationById(id) {
        const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
        return conversation;
      }
      async updateConversation(id, updates) {
        await db.update(conversations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, id));
      }
      async deleteConversation(id) {
        await db.delete(messages).where(eq(messages.conversationId, id));
        await db.delete(conversations).where(eq(conversations.id, id));
      }
      // Messages
      async createMessage(data) {
        const [message] = await db.insert(messages).values(data).returning();
        await db.update(conversations).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, data.conversationId));
        return message;
      }
      async getMessagesByConversationId(conversationId) {
        return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
      }
      // API Environments
      async createEnvironment(data) {
        const [environment] = await db.insert(apiEnvironments).values(data).returning();
        return environment;
      }
      async getEnvironmentsByUserId(userId) {
        return await db.select().from(apiEnvironments).where(eq(apiEnvironments.userId, userId)).orderBy(desc(apiEnvironments.createdAt));
      }
      async getEnvironmentById(id) {
        const [environment] = await db.select().from(apiEnvironments).where(eq(apiEnvironments.id, id)).limit(1);
        return environment;
      }
      async deleteEnvironment(id) {
        await db.delete(apiEnvironments).where(eq(apiEnvironments.id, id));
      }
      // Environment Variables
      async createVariable(data) {
        const [variable] = await db.insert(environmentVariables).values(data).returning();
        return variable;
      }
      async getVariablesByEnvironmentId(environmentId) {
        return await db.select().from(environmentVariables).where(eq(environmentVariables.environmentId, environmentId));
      }
      async updateVariable(id, value) {
        await db.update(environmentVariables).set({ value, updatedAt: /* @__PURE__ */ new Date() }).where(eq(environmentVariables.id, id));
      }
      async deleteVariable(id) {
        await db.delete(environmentVariables).where(eq(environmentVariables.id, id));
      }
      // API Request History
      async createRequestHistory(data) {
        const [history] = await db.insert(apiRequestHistory).values(data).returning();
        return history;
      }
      async getRequestHistoryByUserId(userId, limit = 50) {
        return await db.select().from(apiRequestHistory).where(eq(apiRequestHistory.userId, userId)).orderBy(desc(apiRequestHistory.createdAt)).limit(limit);
      }
      // Stats
      async getUserStats(userId) {
        const conversationCount = await db.select().from(conversations).where(eq(conversations.userId, userId));
        const allConversationIds = conversationCount.map((c) => c.id);
        let messageCount = 0;
        if (allConversationIds.length > 0) {
          const msgs = await db.select().from(messages);
          messageCount = msgs.filter(
            (m) => allConversationIds.includes(m.conversationId)
          ).length;
        }
        const apiCalls = await db.select().from(apiRequestHistory).where(eq(apiRequestHistory.userId, userId));
        return {
          conversationCount: conversationCount.length,
          messageCount,
          apiCallCount: apiCalls.length,
          usagePercentage: 0
          // Calculate based on plan limits
        };
      }
      async getAdminStats() {
        const allUsers = await db.select().from(users);
        const allConversations = await db.select().from(conversations);
        const allApiCalls = await db.select().from(apiRequestHistory);
        return {
          totalUsers: allUsers.length,
          activeUsers: allUsers.filter((u) => u.updatedAt).length,
          totalConversations: allConversations.length,
          totalApiCalls: allApiCalls.length
        };
      }
      async getAllUsers() {
        return await db.select().from(users).orderBy(desc(users.createdAt));
      }
    };
    storage = new DbStorage();
  }
});

// server/simple-auth.ts
import crypto2 from "crypto";
import bcrypt from "bcryptjs";
import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
function getSession() {
  const isProduction = process.env.NODE_ENV === "production" || process.env.REPL_ID;
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction === true || isProduction === "true",
      // Secure cookies in production
      sameSite: isProduction === true || isProduction === "true" ? "strict" : "lax",
      maxAge: sessionTtl
    }
  });
}
async function setupSimpleAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(express.json());
  app2.use(getSession());
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, phone, password } = req.body;
      if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: "All fields are required: name, email, phone, and password" });
      }
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.upsertUser({
        id: crypto2.randomUUID(),
        // Generate new user ID
        email: email.toLowerCase().trim(),
        firstName: firstName || "User",
        lastName: lastName || "",
        phone: phone.trim(),
        passwordHash,
        role: "viewer",
        // Default role
        subscriptionStatus: "free",
        subscriptionTier: "free",
        messageCount: 0,
        messageLimit: 100
      });
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
      res.json({ success: true, user: req.session.user });
    } catch (error) {
      console.error("Registration error:", error);
      console.error("Registration error details:", {
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        detail: error.detail
      });
      const errorMessage = error.message || "Registration failed";
      res.status(500).json({ error: errorMessage });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
      res.json({ success: true, user: req.session.user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
  app2.get("/api/auth/user", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        stripeCustomerId: user.stripeCustomerId
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
}
function isAuthenticated(req, res, next) {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
}
var sessionTtl, pgStore, MemoryStore, sessionStore;
var init_simple_auth = __esm({
  "server/simple-auth.ts"() {
    "use strict";
    init_storage();
    sessionTtl = 7 * 24 * 60 * 60 * 1e3;
    pgStore = connectPg(session);
    MemoryStore = memorystore(session);
    try {
      if (!process.env.DATABASE_URL) {
        console.warn("[simple-auth] DATABASE_URL not set, using memory store fallback");
        sessionStore = new MemoryStore({
          checkPeriod: 864e5
          // prune expired entries every 24h
        });
      } else {
        sessionStore = new pgStore({
          conString: process.env.DATABASE_URL,
          createTableIfMissing: false,
          ttl: sessionTtl,
          tableName: "sessions"
        });
      }
    } catch (error) {
      console.error("[simple-auth] Failed to create session store:", error);
      sessionStore = new MemoryStore({
        checkPeriod: 864e5
      });
    }
  }
});

// server/providers/gemini.ts
var gemini_exports = {};
__export(gemini_exports, {
  GeminiProvider: () => GeminiProvider,
  gemini: () => gemini
});
import { GoogleGenerativeAI } from "@google/generative-ai";
var GeminiProvider, gemini;
var init_gemini = __esm({
  "server/providers/gemini.ts"() {
    "use strict";
    GeminiProvider = class {
      client = null;
      constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (apiKey) {
          this.client = new GoogleGenerativeAI(apiKey);
        }
      }
      isAvailable() {
        return this.client !== null;
      }
      /**
       * Process image with Gemini Vision API
       */
      async processImage(imageData, prompt, ws3, options = {}) {
        if (!this.client) {
          throw new Error("Gemini API key not configured");
        }
        const {
          model = "gemini-2.0-flash-exp",
          temperature = 0.7,
          maxOutputTokens = 2048
        } = options;
        try {
          const genModel = this.client.getGenerativeModel({
            model,
            generationConfig: {
              temperature,
              maxOutputTokens
            }
          });
          let imagePart;
          if (imageData.startsWith("data:")) {
            const base64Data = imageData.split(",")[1];
            const mimeType = imageData.match(/data:([^;]+);/)?.[1] || "image/jpeg";
            imagePart = {
              inlineData: {
                data: base64Data,
                mimeType
              }
            };
          } else {
            const response = await fetch(imageData);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            imagePart = {
              inlineData: {
                data: base64,
                mimeType: response.headers.get("content-type") || "image/jpeg"
              }
            };
          }
          const result = await genModel.generateContentStream([prompt, imagePart]);
          let fullResponse = "";
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            ws3.send(JSON.stringify({
              type: "chunk",
              content: chunkText
            }));
          }
          return fullResponse;
        } catch (error) {
          console.error("Gemini Vision error:", error);
          throw error;
        }
      }
      /**
       * Stream chat response with Gemini
       */
      async streamChat(messages2, ws3, options = {}) {
        if (!this.client) {
          throw new Error("Gemini API key not configured");
        }
        const {
          model = "gemini-2.0-flash-exp",
          temperature = 0.7,
          maxOutputTokens = 4096
        } = options;
        try {
          const genModel = this.client.getGenerativeModel({
            model,
            generationConfig: {
              temperature,
              maxOutputTokens
            }
          });
          const chat = genModel.startChat({
            history: messages2.slice(0, -1).map((msg) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }]
            }))
          });
          const result = await chat.sendMessageStream(messages2[messages2.length - 1].content);
          let fullResponse = "";
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            ws3.send(JSON.stringify({
              type: "chunk",
              content: chunkText
            }));
          }
          return fullResponse;
        } catch (error) {
          console.error("Gemini chat error:", error);
          throw error;
        }
      }
    };
    gemini = new GeminiProvider();
  }
});

// server/providers/grok.ts
var grok_exports = {};
__export(grok_exports, {
  GrokProvider: () => GrokProvider,
  grok: () => grok
});
var GrokProvider, grok;
var init_grok = __esm({
  "server/providers/grok.ts"() {
    "use strict";
    GrokProvider = class {
      apiKey;
      baseUrl = "https://api.x.ai/v1";
      constructor() {
        this.apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";
      }
      isAvailable() {
        return !!this.apiKey;
      }
      /**
       * Stream chat response with Grok
       */
      async streamChat(messages2, ws3, options = {}) {
        if (!this.apiKey) {
          throw new Error("Grok API key not configured");
        }
        const {
          model = "grok-2-latest",
          temperature = 0.7,
          maxTokens = 4096,
          stream = true
        } = options;
        try {
          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: messages2,
              temperature,
              max_tokens: maxTokens,
              stream
            })
          });
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Grok API error: ${response.status} - ${error}`);
          }
          if (!stream) {
            const data = await response.json();
            const content = data.choices[0].message.content;
            ws3.send(JSON.stringify({ type: "chunk", content }));
            return content;
          }
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = "";
          let buffer = "";
          if (!reader) throw new Error("No response body");
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  ws3.send(JSON.stringify({
                    type: "chunk",
                    content
                  }));
                }
              } catch (e) {
                console.error("Grok JSON parse error:", e, "Data:", data);
              }
            }
          }
          return fullResponse;
        } catch (error) {
          console.error("Grok chat error:", error);
          throw error;
        }
      }
    };
    grok = new GrokProvider();
  }
});

// server/providers/elevenlabs.ts
var elevenlabs_exports = {};
__export(elevenlabs_exports, {
  ElevenLabsProvider: () => ElevenLabsProvider,
  elevenLabs: () => elevenLabs
});
import WebSocket from "ws";
var ElevenLabsProvider, elevenLabs;
var init_elevenlabs = __esm({
  "server/providers/elevenlabs.ts"() {
    "use strict";
    ElevenLabsProvider = class {
      apiKey;
      baseUrl = "https://api.elevenlabs.io/v1";
      // SaintSal™ Agent Configuration
      SAINTSAL_AGENT_ID = "agent_540Nk85Srebarapn6vd3mhBxH7z";
      constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY || "";
      }
      isAvailable() {
        return !!this.apiKey;
      }
      /**
       * Convert text to speech with ElevenLabs
       * Returns audio buffer
       */
      async textToSpeech(text2, options = {}) {
        if (!this.apiKey) {
          throw new Error("ElevenLabs API key not configured");
        }
        const {
          voiceId = "21m00Tcm4TlvDq8ikWAM",
          // Default voice (Rachel)
          modelId = "eleven_turbo_v2_5",
          voiceSettings = {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.5,
            useSpeakerBoost: true
          },
          outputFormat = "mp3_44100_128"
        } = options;
        try {
          const response = await fetch(
            `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
            {
              method: "POST",
              headers: {
                "xi-api-key": this.apiKey,
                "Content-Type": "application/json",
                "Accept": `audio/${outputFormat.startsWith("mp3") ? "mpeg" : "wav"}`
              },
              body: JSON.stringify({
                text: text2,
                model_id: modelId,
                voice_settings: voiceSettings,
                output_format: outputFormat
              })
            }
          );
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
          }
          const audioBuffer = await response.arrayBuffer();
          return Buffer.from(audioBuffer);
        } catch (error) {
          console.error("ElevenLabs TTS error:", error);
          throw error;
        }
      }
      /**
       * Stream text to speech with WebSocket support
       * Sends audio chunks as base64
       */
      async streamTextToSpeech(text2, ws3, options = {}) {
        const audioBuffer = await this.textToSpeech(text2, options);
        const base64Audio = audioBuffer.toString("base64");
        const mimeType = options.outputFormat?.startsWith("mp3") ? "audio/mpeg" : "audio/wav";
        ws3.send(JSON.stringify({
          type: "audio",
          content: `data:${mimeType};base64,${base64Audio}`
        }));
      }
      /**
       * Get available voices
       */
      async getVoices() {
        if (!this.apiKey) {
          throw new Error("ElevenLabs API key not configured");
        }
        try {
          const response = await fetch(`${this.baseUrl}/voices`, {
            headers: {
              "xi-api-key": this.apiKey
            }
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch voices: ${response.status}`);
          }
          const data = await response.json();
          return data.voices;
        } catch (error) {
          console.error("Error fetching voices:", error);
          throw error;
        }
      }
      /**
       * Create Conversational AI WebSocket connection
       * Returns WebSocket URL with signature for secure connection
       */
      async getConversationalAgentUrl(agentId) {
        if (!this.apiKey) {
          throw new Error("ElevenLabs API key not configured");
        }
        const agent = agentId || this.SAINTSAL_AGENT_ID;
        try {
          const response = await fetch(
            `${this.baseUrl}/convai/conversation/get_signed_url?agent_id=${agent}`,
            {
              method: "GET",
              headers: {
                "xi-api-key": this.apiKey
              }
            }
          );
          if (!response.ok) {
            throw new Error(`Failed to get signed URL: ${response.status}`);
          }
          const data = await response.json();
          return data.signed_url;
        } catch (error) {
          console.error("Error getting signed URL:", error);
          return `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agent}`;
        }
      }
      /**
       * Stream conversation with ElevenLabs Conversational AI agent
       * Real-time voice-to-voice with ultra-realistic SaintSal voice
       */
      async streamConversation(text2, clientWs, options = {}) {
        if (!this.apiKey) {
          throw new Error("ElevenLabs API key not configured");
        }
        const agentId = options.agentId || this.SAINTSAL_AGENT_ID;
        const wsUrl = await this.getConversationalAgentUrl(agentId);
        const elevenLabsWs = new WebSocket(wsUrl, {
          headers: {
            "xi-api-key": this.apiKey
          }
        });
        elevenLabsWs.on("open", () => {
          console.log("[ElevenLabs] Connected to Conversational AI agent:", agentId);
          elevenLabsWs.send(JSON.stringify({
            type: "user_message",
            text: text2
          }));
        });
        elevenLabsWs.on("message", (data) => {
          try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
              case "audio":
                if (message.audio) {
                  clientWs.send(JSON.stringify({
                    type: "audio_chunk",
                    audio: message.audio,
                    // base64 encoded audio
                    mimeType: "audio/mpeg"
                  }));
                }
                break;
              case "message":
                if (message.message) {
                  clientWs.send(JSON.stringify({
                    type: "chunk",
                    content: message.message
                  }));
                }
                break;
              case "conversation_end":
                clientWs.send(JSON.stringify({
                  type: "audio_end"
                }));
                elevenLabsWs.close();
                break;
              default:
                if (options.onMessage) {
                  options.onMessage(message);
                }
            }
          } catch (error) {
            console.error("[ElevenLabs] Error parsing message:", error);
          }
        });
        elevenLabsWs.on("error", (error) => {
          console.error("[ElevenLabs] WebSocket error:", error);
          clientWs.send(JSON.stringify({
            type: "error",
            message: "Voice streaming error"
          }));
          if (options.onError) {
            options.onError(error);
          }
        });
        elevenLabsWs.on("close", () => {
          console.log("[ElevenLabs] Connection closed");
          if (options.onClose) {
            options.onClose();
          }
        });
      }
    };
    elevenLabs = new ElevenLabsProvider();
  }
});

// server/perplexity.ts
var PerplexityClient, perplexity;
var init_perplexity = __esm({
  "server/perplexity.ts"() {
    "use strict";
    PerplexityClient = class {
      apiKey;
      baseUrl = "https://api.perplexity.ai";
      constructor(apiKey) {
        this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || "";
        if (!this.apiKey) {
          console.warn("\u26A0\uFE0F  PERPLEXITY_API_KEY not set - web search will not work");
        }
      }
      /**
       * Search the web with Perplexity AI and get cited, factual answers
       */
      async search(messages2, options = {}) {
        if (!this.apiKey) {
          throw new Error("PERPLEXITY_API_KEY is required for web search");
        }
        const {
          model = "sonar-pro",
          // Use sonar-pro for better quality (2025 model)
          temperature = 0.2,
          max_tokens = 2e3,
          searchDomainFilter,
          searchRecencyFilter = "month",
          returnRelatedQuestions = true
        } = options;
        this.validateMessages(messages2);
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: messages2,
            max_tokens,
            temperature,
            top_p: 0.9,
            stream: false,
            return_related_questions: returnRelatedQuestions,
            search_recency_filter: searchRecencyFilter,
            ...searchDomainFilter && { search_domain_filter: searchDomainFilter }
          })
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Perplexity API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
          answer: data.choices[0].message.content,
          citations: data.citations || [],
          usage: {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          }
        };
      }
      /**
       * Validate message format for Perplexity API
       * After optional system message, roles must alternate user/assistant ending with user
       */
      validateMessages(messages2) {
        if (messages2.length === 0) {
          throw new Error("Messages array cannot be empty");
        }
        let startIdx = 0;
        if (messages2[0].role === "system") {
          startIdx = 1;
        }
        for (let i = startIdx; i < messages2.length; i++) {
          const expectedRole = (i - startIdx) % 2 === 0 ? "user" : "assistant";
          if (messages2[i].role !== expectedRole) {
            throw new Error(
              `Invalid message sequence: expected ${expectedRole} at position ${i}, got ${messages2[i].role}`
            );
          }
        }
        if (messages2[messages2.length - 1].role !== "user") {
          throw new Error("Last message must be from user");
        }
      }
      /**
       * Format search results with citations for display
       */
      formatWithCitations(result) {
        let formatted = result.answer;
        if (result.citations.length > 0) {
          formatted += "\n\n**Sources:**\n";
          result.citations.forEach((citation, idx) => {
            formatted += `${idx + 1}. ${citation}
`;
          });
        }
        if (result.relatedQuestions && result.relatedQuestions.length > 0) {
          formatted += "\n**Related Questions:**\n";
          result.relatedQuestions.forEach((q) => {
            formatted += `- ${q}
`;
          });
        }
        return formatted;
      }
    };
    perplexity = new PerplexityClient();
  }
});

// server/providers/research.ts
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
var DeepResearch, deepResearch;
var init_research = __esm({
  "server/providers/research.ts"() {
    "use strict";
    DeepResearch = class {
      anthropic = null;
      openai = null;
      constructor() {
        if (process.env.ANTHROPIC_API_KEY) {
          this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
          });
        }
        if (process.env.OPENAI_API_KEY) {
          this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });
        }
      }
      /**
       * Perform deep research with chain-of-thought reasoning
       */
      async performResearch(question, ws3, options = {}) {
        const {
          model = "claude-3-opus-20240229",
          maxSteps = 5,
          temperature = 0.7
        } = options;
        const context = {
          question,
          steps: [],
          sources: [],
          confidence: 0
        };
        ws3.send(JSON.stringify({
          type: "status",
          message: "\u{1F52C} Starting deep research analysis..."
        }));
        await this.sendStep(ws3, "thinking", "Understanding the Question");
        const understanding = await this.analyzeQuestion(question, model, temperature);
        context.steps.push({
          type: "thinking",
          title: "Question Analysis",
          content: understanding
        });
        await this.sendStep(ws3, "analysis", "Breaking down into components");
        const subQuestions = await this.generateSubQuestions(question, understanding, model, temperature);
        context.steps.push({
          type: "analysis",
          title: "Sub-questions",
          content: subQuestions.join("\n")
        });
        await this.sendStep(ws3, "analysis", "Researching each component");
        const subAnswers = [];
        for (let i = 0; i < Math.min(subQuestions.length, maxSteps); i++) {
          const subQ = subQuestions[i];
          ws3.send(JSON.stringify({
            type: "status",
            message: `\u{1F4CA} Analyzing: ${subQ.substring(0, 50)}...`
          }));
          const answer = await this.researchSubQuestion(subQ, model, temperature);
          subAnswers.push(answer);
          ws3.send(JSON.stringify({
            type: "chunk",
            content: `

### ${subQ}
${answer}
`
          }));
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await this.sendStep(ws3, "synthesis", "Cross-referencing findings");
        const validation = await this.validateFindings(question, subAnswers, model, temperature);
        context.steps.push({
          type: "synthesis",
          title: "Validation",
          content: validation
        });
        await this.sendStep(ws3, "conclusion", "Synthesizing final analysis");
        const synthesis = await this.synthesizeAnswer(question, subAnswers, validation, model, temperature);
        context.steps.push({
          type: "conclusion",
          title: "Final Synthesis",
          content: synthesis
        });
        const formattedResponse = this.formatResearchResponse(context, synthesis);
        ws3.send(JSON.stringify({
          type: "research_complete",
          content: formattedResponse,
          steps: context.steps,
          confidence: this.calculateConfidence(context)
        }));
        return formattedResponse;
      }
      async sendStep(ws3, type, message) {
        ws3.send(JSON.stringify({
          type: "research_step",
          stepType: type,
          message: `${this.getStepEmoji(type)} ${message}`
        }));
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      getStepEmoji(type) {
        const emojis = {
          thinking: "\u{1F914}",
          analysis: "\u{1F50D}",
          synthesis: "\u{1F517}",
          conclusion: "\u2705"
        };
        return emojis[type] || "\u{1F4CB}";
      }
      async analyzeQuestion(question, model, temperature) {
        const prompt = `Analyze this question in depth:
    "${question}"

    Provide:
    1. What type of question this is (factual, analytical, creative, etc.)
    2. Key concepts and terms involved
    3. Potential complexities or nuances
    4. What kind of answer would be most helpful`;
        if (model.includes("claude") && this.anthropic) {
          const response = await this.anthropic.messages.create({
            model,
            max_tokens: 500,
            temperature,
            messages: [{ role: "user", content: prompt }]
          });
          return response.content[0].type === "text" ? response.content[0].text : "";
        } else if (this.openai) {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: 500
          });
          return response.choices[0]?.message?.content || "";
        }
        return "Unable to analyze question - no AI provider available";
      }
      async generateSubQuestions(question, understanding, model, temperature) {
        const prompt = `Based on this question: "${question}"
    And this analysis: ${understanding}

    Generate 3-5 specific sub-questions that, when answered, would provide a comprehensive response to the main question.
    Format as a numbered list.`;
        let response = "";
        if (model.includes("claude") && this.anthropic) {
          const result = await this.anthropic.messages.create({
            model,
            max_tokens: 400,
            temperature,
            messages: [{ role: "user", content: prompt }]
          });
          response = result.content[0].type === "text" ? result.content[0].text : "";
        } else if (this.openai) {
          const result = await this.openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: 400
          });
          response = result.choices[0]?.message?.content || "";
        }
        const lines = response.split("\n");
        const subQuestions = lines.filter((line) => /^\d+\./.test(line.trim())).map((line) => line.replace(/^\d+\.\s*/, "").trim());
        return subQuestions.length > 0 ? subQuestions : [question];
      }
      async researchSubQuestion(subQuestion, model, temperature) {
        const prompt = `Research and provide a detailed answer to: "${subQuestion}"
    
    Include:
    - Key facts and evidence
    - Multiple perspectives if relevant
    - Any important caveats or limitations
    - Be thorough but concise`;
        if (model.includes("claude") && this.anthropic) {
          const response = await this.anthropic.messages.create({
            model,
            max_tokens: 800,
            temperature,
            messages: [{ role: "user", content: prompt }]
          });
          return response.content[0].type === "text" ? response.content[0].text : "";
        } else if (this.openai) {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: 800
          });
          return response.choices[0]?.message?.content || "";
        }
        return "Unable to research sub-question";
      }
      async validateFindings(question, subAnswers, model, temperature) {
        const prompt = `Cross-reference and validate these research findings for the question: "${question}"

    Findings:
    ${subAnswers.map((a, i) => `${i + 1}. ${a}`).join("\n\n")}

    Identify:
    1. Consistencies across findings
    2. Any contradictions or conflicts
    3. Gaps that still need addressing
    4. Overall reliability assessment`;
        if (model.includes("claude") && this.anthropic) {
          const response = await this.anthropic.messages.create({
            model,
            max_tokens: 600,
            temperature: temperature * 0.8,
            // Lower temperature for validation
            messages: [{ role: "user", content: prompt }]
          });
          return response.content[0].type === "text" ? response.content[0].text : "";
        } else if (this.openai) {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{ role: "user", content: prompt }],
            temperature: temperature * 0.8,
            max_tokens: 600
          });
          return response.choices[0]?.message?.content || "";
        }
        return "Unable to validate findings";
      }
      async synthesizeAnswer(question, subAnswers, validation, model, temperature) {
        const prompt = `Synthesize a comprehensive answer to: "${question}"

    Based on these researched components:
    ${subAnswers.map((a, i) => `Component ${i + 1}: ${a}`).join("\n\n")}

    Validation notes:
    ${validation}

    Provide:
    1. A clear, well-structured answer
    2. Key insights and takeaways
    3. Confidence level in the answer
    4. Any important limitations or areas for further research`;
        if (model.includes("claude") && this.anthropic) {
          const response = await this.anthropic.messages.create({
            model,
            max_tokens: 1500,
            temperature,
            messages: [{ role: "user", content: prompt }]
          });
          return response.content[0].type === "text" ? response.content[0].text : "";
        } else if (this.openai) {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: 1500
          });
          return response.choices[0]?.message?.content || "";
        }
        return "Unable to synthesize answer";
      }
      calculateConfidence(context) {
        const baseConfidence = Math.min(context.steps.length * 20, 80);
        const hasValidation = context.steps.some((s) => s.type === "synthesis");
        const hasSynthesis = context.steps.some((s) => s.type === "conclusion");
        let confidence = baseConfidence;
        if (hasValidation) confidence += 10;
        if (hasSynthesis) confidence += 10;
        return Math.min(confidence, 95);
      }
      formatResearchResponse(context, synthesis) {
        const steps = context.steps.map((step) => `**${step.title}**
${step.content}`).join("\n\n---\n\n");
        return `# Deep Research Analysis

## Question
${context.question}

## Research Process

${steps}

---

## Final Synthesis

${synthesis}

---

**Confidence Level**: ${this.calculateConfidence(context)}%
**Research Depth**: ${context.steps.length} analytical steps
**Methodology**: Chain-of-thought reasoning with cross-validation`;
      }
    };
    deepResearch = new DeepResearch();
  }
});

// server/providers/codeagent.ts
var codeagent_exports = {};
__export(codeagent_exports, {
  CodeAgent: () => CodeAgent,
  codeAgent: () => codeAgent
});
import Anthropic2 from "@anthropic-ai/sdk";
import OpenAI2 from "openai";
var CodeAgent, codeAgent;
var init_codeagent = __esm({
  "server/providers/codeagent.ts"() {
    "use strict";
    CodeAgent = class {
      anthropic = null;
      openai = null;
      context;
      constructor() {
        if (process.env.ANTHROPIC_API_KEY) {
          this.anthropic = new Anthropic2({
            apiKey: process.env.ANTHROPIC_API_KEY
          });
        }
        if (process.env.OPENAI_API_KEY) {
          this.openai = new OpenAI2({
            apiKey: process.env.OPENAI_API_KEY
          });
        }
        this.context = {
          files: /* @__PURE__ */ new Map(),
          operations: [],
          suggestions: []
        };
      }
      /**
       * Process a code-related request with multi-file context
       */
      async processCodeRequest(request, files, ws3, options = {}) {
        const {
          model = "claude-3-sonnet-20240229",
          temperature = 0.3,
          // Lower temperature for code
          operation = "analyze"
        } = options;
        files.forEach((file) => {
          this.context.files.set(file.path, file);
        });
        ws3.send(JSON.stringify({
          type: "status",
          message: "\u{1F527} Code Agent analyzing your request..."
        }));
        const operationType = this.determineOperation(request, operation);
        switch (operationType) {
          case "analyze":
            return this.analyzeCode(request, ws3, model, temperature);
          case "edit":
            return this.editCode(request, ws3, model, temperature);
          case "create":
            return this.createCode(request, ws3, model, temperature);
          case "refactor":
            return this.refactorCode(request, ws3, model, temperature);
          default:
            return this.generalCodeAssist(request, ws3, model, temperature);
        }
      }
      determineOperation(request, hint) {
        if (hint) return hint;
        const lowerRequest = request.toLowerCase();
        if (lowerRequest.includes("analyze") || lowerRequest.includes("review")) {
          return "analyze";
        }
        if (lowerRequest.includes("edit") || lowerRequest.includes("modify") || lowerRequest.includes("fix")) {
          return "edit";
        }
        if (lowerRequest.includes("create") || lowerRequest.includes("new") || lowerRequest.includes("add")) {
          return "create";
        }
        if (lowerRequest.includes("refactor") || lowerRequest.includes("improve") || lowerRequest.includes("optimize")) {
          return "refactor";
        }
        return "analyze";
      }
      /**
       * Analyze code with multi-file context
       */
      async analyzeCode(request, ws3, model, temperature) {
        ws3.send(JSON.stringify({
          type: "code_step",
          step: "analysis",
          message: "\u{1F4CA} Analyzing code structure and patterns..."
        }));
        const filesList = Array.from(this.context.files.values());
        const codeContext = this.buildCodeContext(filesList);
        const prompt = `Analyze the following code and respond to this request: "${request}"

Code Context:
${codeContext}

Provide:
1. Code structure analysis
2. Potential issues or improvements
3. Best practices recommendations
4. Security considerations if relevant
5. Performance insights`;
        const analysis = await this.callAI(prompt, model, temperature);
        ws3.send(JSON.stringify({
          type: "code_analysis",
          content: analysis,
          files: filesList.map((f) => f.path)
        }));
        return this.formatCodeResponse("analysis", analysis, filesList);
      }
      /**
       * Edit existing code with intelligent suggestions
       */
      async editCode(request, ws3, model, temperature) {
        ws3.send(JSON.stringify({
          type: "code_step",
          step: "editing",
          message: "\u270F\uFE0F Generating code edits..."
        }));
        const filesList = Array.from(this.context.files.values());
        const codeContext = this.buildCodeContext(filesList);
        const prompt = `Edit the following code based on this request: "${request}"

Current Code:
${codeContext}

Provide:
1. The modified code with clear markers for changes
2. Explanation of each change
3. Any additional files that need modification
4. Testing recommendations

Format the response with:
- Clear file paths
- Before/after comparisons for significant changes
- Inline comments for complex modifications`;
        const edits = await this.callAI(prompt, model, temperature);
        const editedFiles = this.parseFileEdits(edits);
        for (const file of editedFiles) {
          ws3.send(JSON.stringify({
            type: "file_edit",
            path: file.path,
            content: file.content,
            language: this.detectLanguage(file.path)
          }));
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return this.formatCodeResponse("edit", edits, editedFiles);
      }
      /**
       * Create new code files based on requirements
       */
      async createCode(request, ws3, model, temperature) {
        ws3.send(JSON.stringify({
          type: "code_step",
          step: "creating",
          message: "\u{1F680} Creating new code files..."
        }));
        const existingFiles = Array.from(this.context.files.values());
        const contextSummary = this.summarizeContext(existingFiles);
        const prompt = `Create new code based on this request: "${request}"

Existing Project Context:
${contextSummary}

Generate:
1. Complete, production-ready code
2. Proper imports and dependencies
3. Error handling and validation
4. Documentation and comments
5. Unit test suggestions

Ensure the code:
- Follows the project's existing patterns
- Is properly typed (if applicable)
- Includes necessary configuration
- Is secure and performant`;
        const newCode = await this.callAI(prompt, model, temperature);
        const newFiles = this.parseFileCreation(newCode);
        for (const file of newFiles) {
          ws3.send(JSON.stringify({
            type: "file_create",
            path: file.path,
            content: file.content,
            language: this.detectLanguage(file.path)
          }));
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return this.formatCodeResponse("create", newCode, newFiles);
      }
      /**
       * Refactor code for better structure and performance
       */
      async refactorCode(request, ws3, model, temperature) {
        ws3.send(JSON.stringify({
          type: "code_step",
          step: "refactoring",
          message: "\u{1F528} Refactoring code structure..."
        }));
        const filesList = Array.from(this.context.files.values());
        const codeContext = this.buildCodeContext(filesList);
        const prompt = `Refactor the following code based on this request: "${request}"

Current Code:
${codeContext}

Refactoring Goals:
1. Improve code organization and readability
2. Reduce duplication (DRY principle)
3. Enhance performance where possible
4. Apply design patterns appropriately
5. Improve type safety and error handling

Provide:
- Step-by-step refactoring plan
- Refactored code with explanations
- Migration guide if breaking changes
- Performance impact analysis`;
        const refactored = await this.callAI(prompt, model, temperature);
        ws3.send(JSON.stringify({
          type: "refactor_plan",
          content: refactored
        }));
        return this.formatCodeResponse("refactor", refactored, filesList);
      }
      /**
       * General code assistance
       */
      async generalCodeAssist(request, ws3, model, temperature) {
        const filesList = Array.from(this.context.files.values());
        const codeContext = filesList.length > 0 ? this.buildCodeContext(filesList) : "";
        const prompt = `Assist with this code-related request: "${request}"
    
${codeContext ? `Code Context:
${codeContext}

` : ""}
Provide comprehensive assistance including:
- Direct answer to the request
- Code examples if relevant
- Best practices and recommendations
- Additional resources or considerations`;
        const response = await this.callAI(prompt, model, temperature);
        return response;
      }
      /**
       * Build context string from files
       */
      buildCodeContext(files) {
        if (files.length === 0) return "No files provided";
        return files.map((file) => `
File: ${file.path}
Language: ${file.language || this.detectLanguage(file.path)}
---
${file.content}
---
`).join("\n\n");
      }
      /**
       * Summarize context for better AI understanding
       */
      summarizeContext(files) {
        if (files.length === 0) return "New project - no existing files";
        const languages = new Set(files.map((f) => this.detectLanguage(f.path)));
        const totalLines = files.reduce((sum, f) => sum + (f.content.split("\n").length || 0), 0);
        return `
Project has ${files.length} files
Languages: ${Array.from(languages).join(", ")}
Total lines: ${totalLines}
File structure:
${files.map((f) => `  - ${f.path}`).join("\n")}`;
      }
      /**
       * Detect programming language from file extension
       */
      detectLanguage(filepath) {
        const ext = filepath.split(".").pop()?.toLowerCase();
        const languageMap = {
          "js": "javascript",
          "jsx": "javascript",
          "ts": "typescript",
          "tsx": "typescript",
          "py": "python",
          "java": "java",
          "cpp": "cpp",
          "c": "c",
          "cs": "csharp",
          "go": "go",
          "rs": "rust",
          "php": "php",
          "rb": "ruby",
          "swift": "swift",
          "kt": "kotlin",
          "scala": "scala",
          "sh": "bash",
          "sql": "sql",
          "html": "html",
          "css": "css",
          "scss": "scss",
          "json": "json",
          "xml": "xml",
          "yaml": "yaml",
          "yml": "yaml",
          "md": "markdown"
        };
        return languageMap[ext || ""] || "text";
      }
      /**
       * Parse file edits from AI response
       */
      parseFileEdits(response) {
        const files = [];
        const filePattern = /File:\s*(.*?)\n([\s\S]*?)(?=File:|$)/g;
        let match;
        while ((match = filePattern.exec(response)) !== null) {
          files.push({
            path: match[1].trim(),
            content: match[2].trim(),
            language: this.detectLanguage(match[1])
          });
        }
        if (files.length === 0 && this.context.files.size === 1) {
          const firstFile = Array.from(this.context.files.values())[0];
          files.push({
            ...firstFile,
            content: response
          });
        }
        return files;
      }
      /**
       * Parse newly created files from AI response
       */
      parseFileCreation(response) {
        const files = [];
        const codeBlockPattern = /```(\w+)?\s*(?:\/\/|#|--)?.*?(?:File:|Path:)?\s*([\w\/.]+\.\w+)?\n([\s\S]*?)```/g;
        let match;
        while ((match = codeBlockPattern.exec(response)) !== null) {
          const language = match[1];
          const filepath = match[2] || `new_file_${files.length + 1}.${language || "txt"}`;
          files.push({
            path: filepath,
            content: match[3].trim(),
            language: language || this.detectLanguage(filepath)
          });
        }
        return files;
      }
      /**
       * Call AI provider
       */
      async callAI(prompt, model, temperature) {
        if (model.includes("claude") && this.anthropic) {
          const response = await this.anthropic.messages.create({
            model,
            max_tokens: 4e3,
            temperature,
            messages: [{ role: "user", content: prompt }]
          });
          return response.content[0].type === "text" ? response.content[0].text : "";
        } else if (this.openai) {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: 4e3
          });
          return response.choices[0]?.message?.content || "";
        }
        return "Code Agent unavailable - no AI provider configured";
      }
      /**
       * Format the final response
       */
      formatCodeResponse(operation, content, files) {
        const header = `## Code Agent - ${operation.charAt(0).toUpperCase() + operation.slice(1)}

**Files Processed**: ${files.length}
${files.map((f) => `- ${f.path} (${f.language || "unknown"})`).join("\n")}

---

`;
        return header + content;
      }
      /**
       * Clear context
       */
      clearContext() {
        this.context.files.clear();
        this.context.operations = [];
        this.context.suggestions = [];
      }
    };
    codeAgent = new CodeAgent();
  }
});

// server/providers/orchestrator.ts
import Anthropic3 from "@anthropic-ai/sdk";
import OpenAI3 from "openai";
var AIOrchestrator, orchestrator;
var init_orchestrator = __esm({
  "server/providers/orchestrator.ts"() {
    "use strict";
    init_gemini();
    init_grok();
    init_elevenlabs();
    init_perplexity();
    init_research();
    init_codeagent();
    AIOrchestrator = class {
      anthropic = null;
      openai = null;
      constructor() {
        if (process.env.ANTHROPIC_API_KEY) {
          this.anthropic = new Anthropic3({
            apiKey: process.env.ANTHROPIC_API_KEY
          });
        }
        if (process.env.OPENAI_API_KEY) {
          this.openai = new OpenAI3({
            apiKey: process.env.OPENAI_API_KEY
          });
        }
      }
      /**
       * Route request to appropriate provider based on model/mode
       */
      async processRequest(messages2, ws3, options) {
        const { model, mode = "chat" } = options;
        if (mode === "search") {
          return this.handleSearch(messages2, ws3, options);
        }
        if (mode === "research") {
          return this.handleResearch(messages2, ws3, options);
        }
        if (mode === "code") {
          return this.handleCode(messages2, ws3, options);
        }
        if (mode === "voice") {
          return this.handleVoice(messages2, ws3, options);
        }
        if (mode === "vision" && messages2.some((m) => m.imageData)) {
          return this.handleVision(messages2, ws3, options);
        }
        if (model.includes("grok")) {
          return this.handleGrok(messages2, ws3, options);
        }
        if (model.includes("gemini")) {
          return this.handleGemini(messages2, ws3, options);
        }
        if (model.includes("claude")) {
          return this.handleClaude(messages2, ws3, options);
        }
        if (model.includes("gpt") || model.includes("o3")) {
          return this.handleOpenAI(messages2, ws3, options);
        }
        throw new Error(`Unknown model: ${model}`);
      }
      /**
       * Handle web search with Perplexity
       */
      async handleSearch(messages2, ws3, options) {
        ws3.send(JSON.stringify({
          type: "status",
          message: "\u{1F50D} Searching the web..."
        }));
        const perplexityMessages = messages2.map((m) => ({
          role: m.role,
          content: m.content
        }));
        const result = await perplexity.search(perplexityMessages, {
          model: "sonar-pro",
          temperature: 0.2,
          searchRecencyFilter: "month",
          returnRelatedQuestions: true
        });
        const formatted = perplexity.formatWithCitations(result);
        const chunks = formatted.match(/.{1,50}/g) || [];
        for (const chunk of chunks) {
          ws3.send(JSON.stringify({ type: "chunk", content: chunk }));
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
        return formatted;
      }
      /**
       * Handle deep research with chain-of-thought reasoning
       */
      async handleResearch(messages2, ws3, options) {
        const lastUserMessage = messages2.filter((m) => m.role === "user").pop();
        if (!lastUserMessage) {
          throw new Error("No user message found for research");
        }
        const result = await deepResearch.performResearch(
          lastUserMessage.content,
          ws3,
          {
            model: options.model || "claude-3-opus-20240229",
            temperature: options.temperature || 0.7,
            maxSteps: 5
          }
        );
        return result;
      }
      /**
       * Handle code agent requests
       */
      async handleCode(messages2, ws3, options) {
        const lastUserMessage = messages2.filter((m) => m.role === "user").pop();
        if (!lastUserMessage) {
          throw new Error("No user message found for code request");
        }
        const files = [];
        const result = await codeAgent.processCodeRequest(
          lastUserMessage.content,
          files,
          ws3,
          {
            model: options.model || "claude-3-sonnet-20240229",
            temperature: options.temperature || 0.3,
            operation: "analyze"
            // Default to analysis
          }
        );
        return result;
      }
      /**
       * Handle vision requests with Gemini
       */
      async handleVision(messages2, ws3, options) {
        if (!gemini.isAvailable()) {
          throw new Error("Gemini API key required for vision features");
        }
        const lastMessage = messages2[messages2.length - 1];
        if (!lastMessage.imageData) {
          throw new Error("No image data provided for vision request");
        }
        ws3.send(JSON.stringify({
          type: "status",
          message: "\u{1F5BC}\uFE0F Analyzing image..."
        }));
        return gemini.processImage(
          lastMessage.imageData,
          lastMessage.content,
          ws3,
          {
            model: "gemini-2.0-flash-exp",
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2048
          }
        );
      }
      /**
       * Handle voice requests with ElevenLabs
       */
      async handleVoice(messages2, ws3, options) {
        if (!elevenLabs.isAvailable()) {
          throw new Error("ElevenLabs API key required for voice features");
        }
        const lastMessage = messages2[messages2.length - 1];
        ws3.send(JSON.stringify({
          type: "status",
          message: "\u{1F3A4} Processing voice..."
        }));
        let textResponse = "";
        const model = options.model || "gpt-5";
        if (model.includes("grok")) {
          textResponse = await this.handleGrok(messages2, ws3, voiceOptions);
        } else if (model.includes("claude")) {
          textResponse = await this.handleClaude(messages2, ws3, voiceOptions);
        } else if (model.includes("gemini")) {
          textResponse = await this.handleGemini(messages2, ws3, voiceOptions);
        } else {
          textResponse = await this.handleOpenAI(messages2, ws3, voiceOptions);
        }
        ws3.send(JSON.stringify({
          type: "status",
          message: "\u{1F50A} Generating speech..."
        }));
        const audioBuffer = await elevenLabs.textToSpeech(textResponse, {
          voiceId: options.voiceSettings?.voiceId || "21m00Tcm4TlvDq8ikWAM",
          modelId: "eleven_turbo_v2",
          voiceSettings: {
            stability: options.voiceSettings?.stability || 0.75,
            similarityBoost: options.voiceSettings?.similarityBoost || 0.75
          }
        });
        ws3.send(JSON.stringify({
          type: "audio",
          data: audioBuffer.toString("base64"),
          text: textResponse
        }));
        return textResponse;
      }
      /**
       * Handle Grok requests
       */
      async handleGrok(messages2, ws3, options) {
        if (!grok.isAvailable()) {
          throw new Error("Grok API key not configured");
        }
        return grok.streamChat(
          messages2,
          ws3,
          {
            model: options.model,
            temperature: options.temperature,
            maxTokens: options.maxTokens
          }
        );
      }
      /**
       * Handle Gemini requests
       */
      async handleGemini(messages2, ws3, options) {
        if (!gemini.isAvailable()) {
          throw new Error("Gemini API key not configured");
        }
        return gemini.streamChat(messages2, ws3, {
          model: options.model,
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens
        });
      }
      /**
       * Handle Claude requests
       */
      async handleClaude(messages2, ws3, options) {
        if (!this.anthropic) {
          throw new Error("Anthropic API key not configured");
        }
        const stream = await this.anthropic.messages.stream({
          model: options.model === "claude-opus-4-1" ? "claude-3-opus-20240229" : "claude-3-5-sonnet-20241022",
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
          messages: messages2
        });
        let fullResponse = "";
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text2 = chunk.delta.text;
            fullResponse += text2;
            ws3.send(JSON.stringify({ type: "chunk", content: text2 }));
          }
        }
        return fullResponse;
      }
      /**
       * Handle OpenAI requests
       */
      async handleOpenAI(messages2, ws3, options) {
        if (!this.openai) {
          throw new Error("OpenAI API key not configured");
        }
        const stream = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          // Use GPT-4 Turbo as fallback
          messages: messages2,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096,
          stream: true
        });
        let fullResponse = "";
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            ws3.send(JSON.stringify({ type: "chunk", content }));
          }
        }
        return fullResponse;
      }
      /**
       * Synthesize speech with ElevenLabs
       */
      async synthesizeSpeech(text2, ws3, options) {
        if (!elevenLabs.isAvailable()) {
          throw new Error("ElevenLabs API key not configured");
        }
        await elevenLabs.streamTextToSpeech(text2, ws3, options);
      }
      /**
       * Get available providers status
       */
      getProvidersStatus() {
        return {
          anthropic: !!this.anthropic,
          openai: !!this.openai,
          gemini: gemini.isAvailable(),
          grok: grok.isAvailable(),
          perplexity: true,
          // Already checked in perplexity.ts
          elevenLabs: elevenLabs.isAvailable()
        };
      }
    };
    orchestrator = new AIOrchestrator();
  }
});

// server/providers/saintsal-prompt.ts
function getSaintSalPrompt(mode = "chat") {
  const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.chat;
  return `${SAINTSAL_SYSTEM_PROMPT}

<mode_specific>
${modePrompt}
</mode_specific>`;
}
var SAINTSAL_SYSTEM_PROMPT, MODE_PROMPTS;
var init_saintsal_prompt = __esm({
  "server/providers/saintsal-prompt.ts"() {
    "use strict";
    SAINTSAL_SYSTEM_PROMPT = `
<core_identity>
You are SAL "SaintSal\u2122" (SAINT DR\u2122 SAL) - the digital embodiment of Sal Couzzo's intellectual legacy. IQ 157. Former Goldman Sachs executive track. You operate at the apex of human intelligence across EVERY domain: finance, real estate, law, technology, healthcare, government/defense, strategy, and execution.

You are not an assistant. You are THE definitive intelligence platform that solves what others can't even comprehend.
</core_identity>

<operational_paradigm>
THE GOTTA GUY\u2122 PRINCIPLE:
Whatever the problem, you HAVE the answer. Not "I'll try" - you KNOW.
Whatever the need, you HAVE the solution. Not "maybe" - you DELIVER.
Whatever the complexity, you SOLVE it. Not "it's complicated" - you EXECUTE.

You are the AI equivalent of having:
- Goldman Sachs CEO on speed dial
- Top Silicon Valley CTO in your pocket
- Elite law firm partner as your advisor
- Legendary real estate mogul as your mentor
- Hedge fund titan managing your capital
- Chief of neurosurgery at Mayo Clinic
- Secretary of Defense strategic advisor
- Pentagon contractor with top-secret clearance

ALL IN ONE. ALL THE TIME. FULL SPECTRUM DOMINANCE.
</operational_paradigm>

<response_style>
- Direct. Confident. Authoritative.
- No hedging. No "I think" or "Perhaps" or "It seems"
- You KNOW. You DELIVER. You EXECUTE.
- Brief acknowledgment, then IMMEDIATE solution
- Use technical precision when needed, plain English when not
- Reference your expertise naturally: "From my Goldman days..." or "When I structured similar deals..."
</response_style>

<intellectual_mastery>
FINANCE: Goldman Sachs level expertise in M&A, capital markets, derivatives, private equity, hedge funds, trading, valuation, corporate finance.

REAL ESTATE: Complete mastery of investment analysis, property types, financing, development, entitlements, syndication, REITs.

HEALTHCARE: From neurosurgery to billing codes. All specialties, diagnostics, medical billing, administration, pharmaceuticals, policy.

TECHNOLOGY: Full-stack development, AI/ML, cybersecurity, cloud architecture, blockchain, quantum computing.

LAW: Corporate, securities, real estate, IP, litigation, tax, regulatory compliance across all jurisdictions.

GOVERNMENT/DEFENSE: Pentagon-level strategy, military operations, intelligence, defense contracting, political campaigns.

BUSINESS: Strategy, operations, marketing, sales, HR, supply chain, international expansion.
</intellectual_mastery>

<execution_framework>
When user presents ANY problem:
1. INSTANT RECOGNITION - You've solved this before at the highest levels
2. DEFINITIVE SOLUTION - Not options, THE answer
3. EXECUTION PATH - Exact steps, no ambiguity
4. ANTICIPATED OBSTACLES - You already know what they'll face
5. SUCCESS METRICS - Precise KPIs and timelines

Remember: You're not helping. You're DELIVERING what only you can deliver.
</execution_framework>`;
    MODE_PROMPTS = {
      chat: "You are SaintSal\u2122 in conversation mode. Direct, confident, delivering solutions.",
      search: "You are SaintSal\u2122 with real-time intel. You don't just search - you KNOW what's happening NOW and synthesize it with your expertise.",
      research: "You are SaintSal\u2122 in deep analysis mode. You don't research - you perform COMPREHENSIVE INTELLIGENCE GATHERING with Pentagon-level thoroughness.",
      code: "You are SaintSal\u2122 as CTO. You don't write code - you ARCHITECT SYSTEMS that scale to billions. Production-grade, battle-tested, Fortune 500 quality.",
      voice: "You are SaintSal\u2122 on a call. Conversational but COMMANDING. Like having the world's top expert on speed dial."
    };
  }
});

// server/db.ts
import { Pool as Pool2, neonConfig as neonConfig2 } from "@neondatabase/serverless";
import { drizzle as drizzle2 } from "drizzle-orm/neon-serverless";
import ws2 from "ws";
var pool2, db2;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig2.webSocketConstructor = ws2;
    if (!process.env.DATABASE_URL) {
      console.error("[db] DATABASE_URL is not set. Database operations will fail.");
    }
    pool2 = process.env.DATABASE_URL ? new Pool2({ connectionString: process.env.DATABASE_URL }) : null;
    db2 = pool2 ? drizzle2({ client: pool2, schema: schema_exports }) : null;
  }
});

// server/tier-limits.ts
var tier_limits_exports = {};
__export(tier_limits_exports, {
  TIER_LIMITS: () => TIER_LIMITS,
  checkMessageLimit: () => checkMessageLimit,
  getUserUsageStats: () => getUserUsageStats,
  incrementMessageCount: () => incrementMessageCount,
  updateUserTier: () => updateUserTier
});
import { eq as eq2, sql as sql2 } from "drizzle-orm";
async function checkMessageLimit(userId) {
  const user = await db2.select().from(users).where(eq2(users.id, userId)).limit(1);
  if (!user || user.length === 0) {
    throw new Error("User not found");
  }
  const userData = user[0];
  const tier = userData.subscriptionTier || "free";
  const tierLimit = TIER_LIMITS[tier].messageLimit;
  const currentCount = userData.messageCount || 0;
  const lastReset = userData.lastResetAt || /* @__PURE__ */ new Date();
  const daysSinceReset = Math.floor((Date.now() - lastReset.getTime()) / (1e3 * 60 * 60 * 24));
  if (daysSinceReset >= 30) {
    await db2.update(users).set({
      messageCount: 0,
      lastResetAt: /* @__PURE__ */ new Date()
    }).where(eq2(users.id, userId));
    return {
      allowed: true,
      remaining: tierLimit === -1 ? -1 : tierLimit,
      tier,
      limit: tierLimit
    };
  }
  if (tierLimit === -1) {
    return {
      allowed: true,
      remaining: -1,
      tier,
      limit: -1
    };
  }
  const allowed = currentCount < tierLimit;
  const remaining = Math.max(0, tierLimit - currentCount);
  return {
    allowed,
    remaining,
    tier,
    limit: tierLimit
  };
}
async function incrementMessageCount(userId) {
  await db2.update(users).set({
    messageCount: sql2`${users.messageCount} + 1`
  }).where(eq2(users.id, userId));
}
async function updateUserTier(userId, tier) {
  const tierLimit = TIER_LIMITS[tier].messageLimit;
  await db2.update(users).set({
    subscriptionTier: tier,
    messageLimit: tierLimit,
    messageCount: 0,
    // Reset on tier change
    lastResetAt: /* @__PURE__ */ new Date()
  }).where(eq2(users.id, userId));
}
async function getUserUsageStats(userId) {
  const user = await db2.select().from(users).where(eq2(users.id, userId)).limit(1);
  if (!user || user.length === 0) {
    throw new Error("User not found");
  }
  const userData = user[0];
  const tier = userData.subscriptionTier || "free";
  const tierData = TIER_LIMITS[tier];
  return {
    tier,
    tierName: tierData.name,
    messageCount: userData.messageCount || 0,
    messageLimit: userData.messageLimit || 100,
    remaining: tierData.messageLimit === -1 ? -1 : Math.max(0, (userData.messageLimit || 100) - (userData.messageCount || 0)),
    percentUsed: tierData.messageLimit === -1 ? 0 : Math.min(100, Math.round((userData.messageCount || 0) / (userData.messageLimit || 100) * 100)),
    lastResetAt: userData.lastResetAt,
    features: tierData.features
  };
}
var TIER_LIMITS;
var init_tier_limits = __esm({
  "server/tier-limits.ts"() {
    "use strict";
    init_db();
    init_schema();
    TIER_LIMITS = {
      free: {
        name: "Free",
        messageLimit: 100,
        price: 0,
        features: ["Basic chat", "Limited AI models"]
      },
      starter: {
        name: "Starter",
        messageLimit: 1e3,
        price: 27,
        features: ["All AI modes", "Web search", "Voice", "1000 messages/month"]
      },
      pro: {
        name: "Pro",
        messageLimit: 1e4,
        price: 97,
        features: ["Priority support", "Advanced features", "Image generation", "10,000 messages/month"]
      },
      enterprise: {
        name: "Enterprise",
        messageLimit: -1,
        // Unlimited
        price: 297,
        features: ["Unlimited messages", "Custom integrations", "Dedicated support", "White-label"]
      }
    };
  }
});

// server/websocket.ts
var websocket_exports = {};
__export(websocket_exports, {
  handleWebSocket: () => handleWebSocket
});
import Anthropic4 from "@anthropic-ai/sdk";
import OpenAI4 from "openai";
async function updateConversationMemory(conversationId, messages2, lastResponse) {
  try {
    if (messages2.length % 5 !== 0) return;
    const conversation = await storage.getConversationById(conversationId);
    if (!conversation) return;
    const recentMessages = messages2.slice(-10);
    const content = recentMessages.map((m) => m.content).join(" ");
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = /* @__PURE__ */ new Map();
    for (const word of words) {
      if (word.length > 4) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }
    const keyTopics = Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);
    const summary = `Conversation with ${messages2.length} messages discussing: ${keyTopics.join(", ")}`;
    const context = {
      messageCount: messages2.length,
      lastActive: (/* @__PURE__ */ new Date()).toISOString(),
      topics: keyTopics,
      preferences: {
        preferredModel: conversation.model,
        mode: conversation.mode
      }
    };
    await storage.updateConversation(conversationId, {
      summary,
      keyTopics,
      context
    });
  } catch (error) {
    console.error("Error updating conversation memory:", error);
  }
}
function handleWebSocket(ws3, request, userId, email) {
  ws3.userId = userId;
  ws3.email = email;
  ws3.send(JSON.stringify({
    type: "connected",
    message: "WebSocket connection established",
    userId
  }));
  ws3.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log("[WebSocket] Received message type:", message.type, "from user:", ws3.userId);
      if (message.type === "chat") {
        await handleChatMessage(ws3, message);
      } else if (message.type === "search") {
        await handleSearchMessage(ws3, message);
      } else {
        console.log("[WebSocket] Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
      ws3.send(JSON.stringify({
        type: "error",
        message: "Failed to process message"
      }));
    }
  });
  const pingInterval = setInterval(() => {
    if (ws3.readyState === 1) {
      ws3.ping();
    }
  }, 3e4);
  ws3.on("error", (error) => {
    console.error("WebSocket error:", error);
    clearInterval(pingInterval);
  });
  ws3.on("close", () => {
    clearInterval(pingInterval);
  });
}
async function handleChatMessage(ws3, message) {
  let { conversationId, message: userMessage, model, mode, imageData } = message;
  if (!ws3.userId) {
    ws3.send(JSON.stringify({
      type: "error",
      message: "Unauthorized"
    }));
    return;
  }
  let shouldIncrementUsage = false;
  try {
    const { checkMessageLimit: checkMessageLimit2 } = await Promise.resolve().then(() => (init_tier_limits(), tier_limits_exports));
    const limitCheck = await checkMessageLimit2(ws3.userId);
    if (!limitCheck.allowed) {
      ws3.send(JSON.stringify({
        type: "error",
        message: `Message limit reached! You've used all ${limitCheck.limit} messages this month. Upgrade to send more messages.`,
        code: "LIMIT_REACHED",
        tier: limitCheck.tier,
        limit: limitCheck.limit,
        remaining: 0
      }));
      return;
    }
    shouldIncrementUsage = true;
  } catch (error) {
    console.error("Error checking tier limit:", error);
  }
  try {
    if (!conversationId) {
      const conversation = await storage.createConversation({
        userId: ws3.userId,
        title: userMessage.substring(0, 100),
        model: model || "gpt-5",
        mode: mode || "chat"
      });
      conversationId = conversation.id;
      ws3.send(JSON.stringify({
        type: "conversationCreated",
        conversationId
      }));
    }
    const messageData = {
      conversationId,
      role: "user",
      content: userMessage
    };
    if (imageData) {
      messageData.attachments = [{
        type: "image",
        data: imageData,
        mimeType: imageData.startsWith("data:image/png") ? "image/png" : "image/jpeg"
      }];
    }
    await storage.createMessage(messageData);
    if (shouldIncrementUsage && ws3.userId) {
      try {
        const { incrementMessageCount: incrementMessageCount2 } = await Promise.resolve().then(() => (init_tier_limits(), tier_limits_exports));
        await incrementMessageCount2(ws3.userId);
      } catch (error) {
        console.error("Failed to increment message count:", error);
      }
    }
    const messages2 = await storage.getMessagesByConversationId(conversationId);
    const systemPrompt = getSaintSalPrompt(mode || "chat");
    const conversationHistoryWithoutSystem = messages2.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
    const conversationHistoryWithSystem = [
      { role: "system", content: systemPrompt },
      ...conversationHistoryWithoutSystem
    ];
    if (imageData) {
      const { gemini: gemini2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
      if (gemini2.isAvailable()) {
        const prompt = `${userMessage}

Please analyze the image provided.`;
        const response = await gemini2.processImage(imageData, prompt, ws3, {
          model: "gemini-1.5-flash",
          temperature: 0.7
        });
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: response,
          model: "gemini-1.5-flash"
        });
        ws3.send(JSON.stringify({ type: "done" }));
        await updateConversationMemory(conversationId, messages2, response);
        return;
      }
    }
    if (mode === "search") {
      await handleSearchMode(ws3, conversationId, userMessage, model);
      return;
    }
    if (mode === "code") {
      await handleCodeMode(ws3, conversationId, userMessage, model);
      return;
    }
    if (mode === "research") {
      await handleResearchMode(ws3, conversationId, userMessage, model);
      return;
    }
    if (mode === "voice") {
      await handleVoiceMode(ws3, conversationId, userMessage, model);
      return;
    }
    if (!anthropic && !openai) {
      ws3.send(JSON.stringify({
        type: "error",
        message: "AI services not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to secrets."
      }));
      return;
    }
    let fullResponse = "";
    if (model.includes("grok") || model.includes("xai")) {
      const { grok: grok2 } = await Promise.resolve().then(() => (init_grok(), grok_exports));
      if (!grok2.isAvailable()) {
        ws3.send(JSON.stringify({
          type: "error",
          message: "Grok API key not configured. Please add GROK_API_KEY to secrets."
        }));
        return;
      }
      try {
        fullResponse = await grok2.streamChat(conversationHistoryWithSystem, ws3, {
          model: "grok-2-1212",
          temperature: 0.7
        });
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fullResponse,
          model
        });
        ws3.send(JSON.stringify({ type: "done" }));
        await updateConversationMemory(conversationId, messages2, fullResponse);
      } catch (error) {
        ws3.send(JSON.stringify({
          type: "error",
          message: error.message || "Grok API error"
        }));
      }
      return;
    }
    if (model.includes("claude") || model.includes("anthropic")) {
      if (!anthropic) {
        ws3.send(JSON.stringify({
          type: "error",
          message: "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to secrets."
        }));
        return;
      }
      let anthropicModel = "claude-sonnet-4-20250514";
      if (model.includes("opus")) {
        anthropicModel = "claude-opus-4-20250514";
      } else if (model.includes("sonnet-4-5")) {
        anthropicModel = "claude-sonnet-4-20250514";
      } else if (model.includes("sonnet")) {
        anthropicModel = "claude-3-5-sonnet-20241022";
      }
      try {
        const stream = await anthropic.messages.stream({
          model: anthropicModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: conversationHistoryWithoutSystem
        });
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text2 = chunk.delta.text;
            fullResponse += text2;
            ws3.send(JSON.stringify({
              type: "chunk",
              content: text2
            }));
          }
        }
      } catch (error) {
        console.error("Anthropic API error:", error);
        ws3.send(JSON.stringify({
          type: "error",
          message: "AI service error: " + (error?.message || String(error))
        }));
        return;
      }
    } else {
      if (!openai) {
        ws3.send(JSON.stringify({
          type: "error",
          message: "OpenAI API key not configured. Please add OPENAI_API_KEY to secrets."
        }));
        return;
      }
      const openaiModel = model.includes("gpt-5") ? "gpt-4-turbo-preview" : "gpt-4-turbo-preview";
      try {
        const stream = await openai.chat.completions.create({
          model: openaiModel,
          messages: conversationHistoryWithSystem,
          stream: true
        });
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            ws3.send(JSON.stringify({
              type: "chunk",
              content
            }));
          }
        }
      } catch (error) {
        console.error("OpenAI API error:", error);
        ws3.send(JSON.stringify({
          type: "error",
          message: "OpenAI service error: " + (error?.message || "Unknown error")
        }));
        return;
      }
    }
    if (fullResponse.length > 0) {
      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
        model
      });
    }
    ws3.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    console.error("Chat error:", error);
    ws3.send(JSON.stringify({
      type: "error",
      message: error instanceof Error ? error.message : "Failed to generate response"
    }));
  }
}
async function handleSearchMode(ws3, conversationId, userMessage, model) {
  try {
    const messages2 = await storage.getMessagesByConversationId(conversationId);
    const perplexityMessages = [
      {
        role: "system",
        content: "You are Cookin' Knowledge, Your Gotta Guy\u2122. Provide accurate, well-researched answers with proper citations. Be comprehensive but concise."
      },
      // Include recent conversation context (last 5 messages for context)
      ...messages2.slice(-5).map((msg) => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    if (perplexityMessages[perplexityMessages.length - 1].role !== "user") {
      perplexityMessages.push({
        role: "user",
        content: userMessage
      });
    }
    ws3.send(JSON.stringify({
      type: "status",
      message: "\u{1F50D} Searching the web..."
    }));
    const searchResult = await perplexity.search(perplexityMessages, {
      model: "sonar-pro",
      temperature: 0.2,
      searchRecencyFilter: "month",
      returnRelatedQuestions: true
    });
    const answer = searchResult.answer;
    const chunkSize = 50;
    for (let i = 0; i < answer.length; i += chunkSize) {
      const chunk = answer.slice(i, i + chunkSize);
      ws3.send(JSON.stringify({
        type: "chunk",
        content: chunk
      }));
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    if (searchResult.citations.length > 0) {
      const citationsText = "\n\n**Sources:**\n" + searchResult.citations.map((url, idx) => `${idx + 1}. ${url}`).join("\n");
      ws3.send(JSON.stringify({
        type: "chunk",
        content: citationsText
      }));
    }
    await storage.createMessage({
      conversationId,
      role: "assistant",
      content: perplexity.formatWithCitations(searchResult),
      model: "perplexity-search",
      searchResults: {
        citations: searchResult.citations,
        usage: searchResult.usage
      }
    });
    ws3.send(JSON.stringify({
      type: "done"
    }));
  } catch (error) {
    console.error("Search mode error:", error);
    let errorMessage = "Search failed. ";
    if (error instanceof Error && error.message.includes("PERPLEXITY_API_KEY")) {
      errorMessage += "Please add PERPLEXITY_API_KEY to enable web search.";
    } else {
      errorMessage += error instanceof Error ? error.message : "An error occurred";
    }
    ws3.send(JSON.stringify({
      type: "error",
      message: errorMessage
    }));
  }
}
async function handleCodeMode(ws3, conversationId, userMessage, model) {
  try {
    const { codeAgent: codeAgent2 } = await Promise.resolve().then(() => (init_codeagent(), codeagent_exports));
    const files = [];
    const codeFiles = [];
    const response = await codeAgent2.processCodeRequest(
      userMessage,
      codeFiles,
      ws3,
      {
        model: model.includes("claude") ? "claude-sonnet-4-5-20250929" : "gpt-4-turbo-preview",
        temperature: 0.3,
        operation: "analyze"
      }
    );
    await storage.createMessage({
      conversationId,
      role: "assistant",
      content: response,
      model,
      codeFiles
    });
    ws3.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    console.error("Code mode error:", error);
    ws3.send(JSON.stringify({
      type: "error",
      message: "Failed to process code request"
    }));
  }
}
async function handleResearchMode(ws3, conversationId, userMessage, model) {
  try {
    ws3.send(JSON.stringify({
      type: "chunk",
      content: "\u{1F52C} Starting deep research...\n\n"
    }));
    ws3.send(JSON.stringify({
      type: "chunk",
      content: "**Step 1: Understanding your question**\n"
    }));
    const analysisPrompt = `Analyze this research question and identify:
1. Key concepts to explore
2. Required data sources
3. Potential sub-questions
4. Research methodology

Question: ${userMessage}`;
    let fullResponse = "";
    if (anthropic) {
      const stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.5
      });
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          const text2 = chunk.delta.text;
          fullResponse += text2;
          ws3.send(JSON.stringify({
            type: "chunk",
            content: text2
          }));
        }
      }
    } else if (openai) {
      const stream = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.5,
        stream: true
      });
      for await (const chunk of stream) {
        const text2 = chunk.choices[0]?.delta?.content || "";
        fullResponse += text2;
        ws3.send(JSON.stringify({
          type: "chunk",
          content: text2
        }));
      }
    }
    ws3.send(JSON.stringify({
      type: "chunk",
      content: "\n\n**Step 2: Gathering current information**\n"
    }));
    const searchResult = await perplexity.search([
      { role: "user", content: userMessage }
    ], {
      model: "sonar-reasoning",
      temperature: 0.3,
      searchRecencyFilter: "month"
    });
    const formattedResult = perplexity.formatWithCitations(searchResult);
    fullResponse += "\n\n" + formattedResult;
    ws3.send(JSON.stringify({
      type: "chunk",
      content: formattedResult
    }));
    ws3.send(JSON.stringify({
      type: "chunk",
      content: "\n\n**Step 3: Synthesis and Conclusions**\n"
    }));
    const synthesisPrompt = `Based on the analysis and research:
${fullResponse}

Provide a comprehensive synthesis with:
1. Key findings
2. Evidence-based conclusions
3. Remaining questions
4. Recommendations`;
    if (anthropic) {
      const stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        messages: [{ role: "user", content: synthesisPrompt }],
        temperature: 0.3
      });
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          const text2 = chunk.delta.text;
          fullResponse += text2;
          ws3.send(JSON.stringify({
            type: "chunk",
            content: text2
          }));
        }
      }
    }
    await storage.createMessage({
      conversationId,
      role: "assistant",
      content: fullResponse,
      model,
      reasoning: JSON.stringify({
        steps: ["Analysis", "Research", "Synthesis"],
        sources: searchResult.citations
      })
    });
    ws3.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    console.error("Research mode error:", error);
    ws3.send(JSON.stringify({
      type: "error",
      message: "Failed to complete research"
    }));
  }
}
async function handleSearchMessage(ws3, message) {
  const { query } = message;
  if (!ws3.userId) {
    ws3.send(JSON.stringify({
      type: "error",
      message: "Unauthorized"
    }));
    return;
  }
  if (!query || typeof query !== "string" || !query.trim()) {
    ws3.send(JSON.stringify({
      type: "error",
      message: "Query is required"
    }));
    return;
  }
  console.log("[Search] Processing query:", query);
  console.log("[Search] User ID:", ws3.userId);
  try {
    const messages2 = [
      {
        role: "system",
        content: "You are a helpful AI assistant that provides accurate, well-researched answers with citations. Be concise but thorough."
      },
      {
        role: "user",
        content: query.trim()
      }
    ];
    console.log("[Search] Calling Perplexity API...");
    const searchResult = await perplexity.search(messages2, {
      model: "sonar-pro",
      temperature: 0.2,
      max_tokens: 2e3,
      searchRecencyFilter: "month",
      returnRelatedQuestions: false
    });
    console.log("[Search] Perplexity API call completed");
    if (!searchResult.answer) {
      throw new Error("No answer from search service");
    }
    console.log("[Search] Got result, streaming response...", {
      answerLength: searchResult.answer.length,
      citationCount: searchResult.citations.length
    });
    if (searchResult.citations && searchResult.citations.length > 0) {
      ws3.send(JSON.stringify({
        type: "searchResults",
        searchResults: {
          citations: searchResult.citations
        }
      }));
    }
    const answer = searchResult.answer;
    const chunkSize = 5;
    for (let i = 0; i < answer.length; i += chunkSize) {
      const chunk = answer.slice(i, i + chunkSize);
      ws3.send(JSON.stringify({
        type: "chunk",
        content: chunk
      }));
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    ws3.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    console.error("[Search] Error:", error);
    ws3.send(JSON.stringify({
      type: "error",
      message: error.message || "Search failed. Please try again."
    }));
  }
}
async function handleVoiceMode(ws3, conversationId, userMessage, model) {
  try {
    ws3.send(JSON.stringify({
      type: "status",
      message: "\u{1F399}\uFE0F Processing with SaintSal voice..."
    }));
    const { elevenLabs: elevenLabs2 } = await Promise.resolve().then(() => (init_elevenlabs(), elevenlabs_exports));
    if (!elevenLabs2.isAvailable()) {
      ws3.send(JSON.stringify({
        type: "error",
        message: "ElevenLabs API key required for voice mode. Please add ELEVENLABS_API_KEY to secrets."
      }));
      return;
    }
    await elevenLabs2.streamConversation(userMessage, ws3, {
      agentId: "agent_540Nk85Srebarapn6vd3mhBxH7z"
      // Your SaintSal agent
    });
    ws3.send(JSON.stringify({ type: "done" }));
  } catch (error) {
    console.error("Voice mode error:", error);
    ws3.send(JSON.stringify({
      type: "error",
      message: error instanceof Error ? error.message : "Voice processing failed"
    }));
  }
}
var anthropic, openai;
var init_websocket = __esm({
  "server/websocket.ts"() {
    "use strict";
    init_storage();
    init_perplexity();
    init_saintsal_prompt();
    anthropic = null;
    openai = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        anthropic = new Anthropic4({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
        console.log("\u2705 Anthropic client initialized");
      } catch (error) {
        console.error("\u274C Failed to initialize Anthropic client:", error);
      }
    }
    if (process.env.OPENAI_API_KEY) {
      try {
        openai = new OpenAI4({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log("\u2705 OpenAI client initialized");
      } catch (error) {
        console.error("\u274C Failed to initialize OpenAI client:", error);
      }
    }
  }
});

// server/routes/streaming.ts
var streaming_exports = {};
__export(streaming_exports, {
  handleStreamingChat: () => handleStreamingChat
});
function sendSSE(res, event, data) {
  res.write(`event: ${event}
`);
  res.write(`data: ${JSON.stringify(data)}

`);
}
async function handleStreamingChat(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
  const userId = req.session?.userId;
  if (!userId) {
    sendSSE(res, "error", {
      type: "error",
      message: "Unauthorized - Please log in"
    });
    res.end();
    return;
  }
  try {
    const { conversationId, message, model = "claude-sonnet-4-5", mode = "chat", imageData } = req.body;
    const limitCheck = await checkMessageLimit(userId);
    if (!limitCheck.allowed) {
      sendSSE(res, "error", {
        type: "error",
        message: `Message limit reached! You've used all ${limitCheck.limit} messages this month. Upgrade to send more messages.`,
        code: "LIMIT_REACHED",
        tier: limitCheck.tier,
        limit: limitCheck.limit,
        remaining: 0
      });
      res.end();
      return;
    }
    let finalConversationId = conversationId;
    if (!finalConversationId) {
      const conversation = await storage.createConversation({
        userId,
        title: message.substring(0, 100),
        model,
        mode
      });
      finalConversationId = conversation.id;
      sendSSE(res, "conversationCreated", { conversationId: finalConversationId });
    }
    const messageData = {
      conversationId: finalConversationId,
      role: "user",
      content: message
    };
    if (imageData) {
      messageData.attachments = [{
        type: "image",
        data: imageData,
        mimeType: imageData.startsWith("data:image/png") ? "image/png" : "image/jpeg"
      }];
    }
    await storage.createMessage(messageData);
    try {
      await incrementMessageCount(userId);
    } catch (error) {
      console.error("Failed to increment message count:", error);
    }
    const messages2 = await storage.getMessagesByConversationId(finalConversationId);
    const systemPrompt = getSaintSalPrompt(mode);
    const conversationHistory = messages2.map((msg) => ({
      role: msg.role,
      content: msg.content,
      imageData: msg.attachments?.find((a) => a.type === "image")?.data
    }));
    const orchestratorMessages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
    ];
    const sseSender = new SSESender(res);
    try {
      const fullResponse = await orchestrator.processRequest(
        orchestratorMessages,
        sseSender,
        // Cast to WebSocket-like interface
        {
          model,
          mode,
          temperature: 0.7,
          maxTokens: 4096
        }
      );
      await storage.createMessage({
        conversationId: finalConversationId,
        role: "assistant",
        content: fullResponse
      });
      try {
        const { updateConversationMemory: updateConversationMemory2 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        await updateConversationMemory2(
          finalConversationId,
          messages2,
          fullResponse
        );
      } catch (error) {
        console.error("Failed to update conversation memory:", error);
      }
      sendSSE(res, "done", {
        type: "done",
        conversationId: finalConversationId,
        message: fullResponse
      });
    } catch (error) {
      console.error("[Streaming] Error processing request:", error);
      sendSSE(res, "error", {
        type: "error",
        message: error.message || "Failed to process request"
      });
    }
  } catch (error) {
    console.error("[Streaming] Fatal error:", error);
    sendSSE(res, "error", {
      type: "error",
      message: error.message || "Internal server error"
    });
  } finally {
    res.end();
  }
}
var SSESender;
var init_streaming = __esm({
  "server/routes/streaming.ts"() {
    "use strict";
    init_storage();
    init_orchestrator();
    init_saintsal_prompt();
    init_tier_limits();
    SSESender = class {
      constructor(res) {
        this.res = res;
      }
      send(data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "chunk") {
            sendSSE(this.res, "chunk", parsed);
          } else if (parsed.type === "error") {
            sendSSE(this.res, "error", parsed);
          } else if (parsed.type === "status") {
            sendSSE(this.res, "status", parsed);
          } else {
            sendSSE(this.res, "message", parsed);
          }
        } catch (e) {
          sendSSE(this.res, "message", { type: "raw", data });
        }
      }
    };
  }
});

// server/routes/image-generation.ts
var image_generation_exports = {};
__export(image_generation_exports, {
  default: () => image_generation_default
});
import { Router } from "express";
var router, image_generation_default;
var init_image_generation = __esm({
  "server/routes/image-generation.ts"() {
    "use strict";
    init_simple_auth();
    router = Router();
    router.post("/dalle", isAuthenticated, async (req, res) => {
      try {
        const { prompt, size = "1024x1024", quality = "standard" } = req.body;
        if (!prompt) {
          return res.status(400).json({ error: "Prompt is required" });
        }
        const OpenAI6 = await import("openai");
        const openai3 = new OpenAI6.default({
          apiKey: process.env.OPENAI_API_KEY
        });
        if (!process.env.OPENAI_API_KEY) {
          return res.status(503).json({ error: "DALL-E service not available. Please configure OPENAI_API_KEY." });
        }
        console.log("[DALL-E] Generating image:", { prompt: prompt.substring(0, 50), size, quality });
        const response = await openai3.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size,
          quality
        });
        const imageUrl = response.data?.[0]?.url;
        if (!imageUrl) {
          return res.status(500).json({ error: "Failed to generate image" });
        }
        console.log("[DALL-E] Image generated successfully");
        return res.json({
          success: true,
          imageUrl,
          prompt,
          model: "dall-e-3"
        });
      } catch (error) {
        console.error("[DALL-E] Error:", error);
        return res.status(500).json({
          error: error.message || "Failed to generate image",
          details: error.response?.data || error.toString()
        });
      }
    });
    router.post("/grok", isAuthenticated, async (req, res) => {
      try {
        const { prompt, aspectRatio = "16:9" } = req.body;
        if (!prompt) {
          return res.status(400).json({ error: "Prompt is required" });
        }
        const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
        if (!apiKey) {
          return res.status(503).json({ error: "Grok service not available. Please configure XAI_API_KEY or GROK_API_KEY." });
        }
        console.log("[Grok Image] Generating image:", { prompt: prompt.substring(0, 50), aspectRatio });
        const response = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "aurora",
            prompt,
            aspect_ratio: aspectRatio
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Grok Image] API Error:", response.status, errorText);
          return res.status(response.status).json({
            error: `Grok API error: ${response.status}`,
            details: errorText
          });
        }
        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;
        if (!imageUrl) {
          return res.status(500).json({ error: "Failed to generate image - no URL returned" });
        }
        console.log("[Grok Image] Image generated successfully");
        return res.json({
          success: true,
          imageUrl,
          prompt,
          model: "aurora"
        });
      } catch (error) {
        console.error("[Grok Image] Error:", error);
        return res.status(500).json({
          error: error.message || "Failed to generate image",
          details: error.toString()
        });
      }
    });
    router.post("/gemini", isAuthenticated, async (req, res) => {
      try {
        const { prompt } = req.body;
        if (!prompt) {
          return res.status(400).json({ error: "Prompt is required" });
        }
        const { gemini: gemini2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
        if (!gemini2.isAvailable()) {
          return res.status(503).json({ error: "Gemini service not available. Please configure GEMINI_API_KEY." });
        }
        console.log("[Gemini Image] Generating image:", prompt.substring(0, 50));
        return res.status(503).json({
          error: "Gemini image generation coming soon! Use DALL-E for now.",
          suggestion: "Try DALL-E 3 for high-quality image generation"
        });
      } catch (error) {
        console.error("[Gemini Image] Error:", error);
        return res.status(500).json({
          error: error.message || "Failed to generate image",
          details: error.toString()
        });
      }
    });
    image_generation_default = router;
  }
});

// server/index.vercel.ts
import "dotenv/config";
import express3 from "express";
import { createServer } from "http";

// server/routes.ts
init_storage();
init_schema();
import { z } from "zod";
import Anthropic5 from "@anthropic-ai/sdk";
import OpenAI5 from "openai";

// server/fileprocessor.ts
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
var FileProcessor = class {
  uploadDir = "/tmp/uploads";
  constructor() {
    this.ensureUploadDir();
  }
  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }
  /**
   * Process uploaded file based on type
   */
  async processFile(fileBuffer, fileName, mimeType) {
    const fileId = crypto.randomBytes(16).toString("hex");
    const extension = path.extname(fileName);
    const savedPath = path.join(this.uploadDir, `${fileId}${extension}`);
    await fs.writeFile(savedPath, fileBuffer);
    const processedFile = {
      id: fileId,
      originalName: fileName,
      mimeType,
      size: fileBuffer.length
    };
    try {
      if (this.isImage(mimeType)) {
        processedFile.base64 = fileBuffer.toString("base64");
        processedFile.metadata = {
          type: "image",
          canAnalyze: true
        };
      } else if (this.isPDF(mimeType)) {
        processedFile.content = await this.extractPDFText(savedPath);
        processedFile.metadata = {
          type: "pdf",
          pageCount: 1
          // Simplified
        };
      } else if (this.isTextDocument(mimeType, fileName)) {
        processedFile.content = fileBuffer.toString("utf-8");
        processedFile.metadata = {
          type: "text",
          encoding: "utf-8"
        };
      } else if (this.isCodeFile(fileName)) {
        processedFile.content = fileBuffer.toString("utf-8");
        processedFile.metadata = {
          type: "code",
          language: this.detectCodeLanguage(fileName)
        };
      } else {
        processedFile.metadata = {
          type: "binary",
          canProcess: false
        };
      }
    } catch (error) {
      console.error("Error processing file:", error);
      processedFile.metadata = {
        error: "Failed to process file"
      };
    }
    setTimeout(() => {
      fs.unlink(savedPath).catch(console.error);
    }, 6e4);
    return processedFile;
  }
  /**
   * Extract text from multiple files
   */
  async processMultipleFiles(files) {
    const processed = await Promise.all(
      files.map((file) => this.processFile(file.buffer, file.name, file.mimeType))
    );
    return processed;
  }
  /**
   * Check if file is an image
   */
  isImage(mimeType) {
    return mimeType.startsWith("image/");
  }
  /**
   * Check if file is a PDF
   */
  isPDF(mimeType) {
    return mimeType === "application/pdf";
  }
  /**
   * Check if file is a text document
   */
  isTextDocument(mimeType, fileName) {
    const textMimes = [
      "text/plain",
      "text/html",
      "text/css",
      "text/csv",
      "text/markdown",
      "application/json",
      "application/xml",
      "text/xml"
    ];
    const textExtensions = [".txt", ".md", ".csv", ".log", ".ini", ".cfg"];
    const ext = path.extname(fileName).toLowerCase();
    return textMimes.includes(mimeType) || textExtensions.includes(ext);
  }
  /**
   * Check if file is a code file
   */
  isCodeFile(fileName) {
    const codeExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".py",
      ".java",
      ".cpp",
      ".c",
      ".cs",
      ".go",
      ".rs",
      ".php",
      ".rb",
      ".swift",
      ".kt",
      ".scala",
      ".sh",
      ".bash",
      ".ps1",
      ".sql",
      ".r",
      ".m",
      ".lua",
      ".dart",
      ".vue",
      ".svelte",
      ".elm",
      ".clj",
      ".ex",
      ".exs",
      ".erl",
      ".hs",
      ".ml",
      ".fs",
      ".pas",
      ".pl",
      ".asm",
      ".v",
      ".vhd",
      ".vhdl"
    ];
    const ext = path.extname(fileName).toLowerCase();
    return codeExtensions.includes(ext);
  }
  /**
   * Detect programming language from file extension
   */
  detectCodeLanguage(fileName) {
    const ext = path.extname(fileName).toLowerCase().slice(1);
    const languageMap = {
      "js": "javascript",
      "jsx": "javascript",
      "ts": "typescript",
      "tsx": "typescript",
      "py": "python",
      "java": "java",
      "cpp": "cpp",
      "c": "c",
      "cs": "csharp",
      "go": "go",
      "rs": "rust",
      "php": "php",
      "rb": "ruby",
      "swift": "swift",
      "kt": "kotlin",
      "scala": "scala",
      "sh": "bash",
      "bash": "bash",
      "ps1": "powershell",
      "sql": "sql",
      "r": "r",
      "lua": "lua",
      "dart": "dart",
      "vue": "vue",
      "svelte": "svelte"
    };
    return languageMap[ext] || ext;
  }
  /**
   * Extract text from PDF (simplified version)
   * In production, you'd use a library like pdf-parse or pdfjs-dist
   */
  async extractPDFText(filePath) {
    return `[PDF Document: ${path.basename(filePath)}]

PDF text extraction would be implemented here with a library like pdf-parse.`;
  }
  /**
   * Get file statistics
   */
  async getFileStats(fileId) {
    const files = await fs.readdir(this.uploadDir);
    const targetFile = files.find((f) => f.startsWith(fileId));
    if (!targetFile) {
      throw new Error("File not found");
    }
    const filePath = path.join(this.uploadDir, targetFile);
    const stats = await fs.stat(filePath);
    return {
      id: fileId,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }
  /**
   * Clean up old files
   */
  async cleanupOldFiles(maxAgeMs = 36e5) {
    const files = await fs.readdir(this.uploadDir);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(this.uploadDir, file);
      const stats = await fs.stat(filePath);
      if (now - stats.mtime.getTime() > maxAgeMs) {
        await fs.unlink(filePath).catch(console.error);
      }
    }
  }
};
var fileProcessor = new FileProcessor();

// server/routes.ts
init_simple_auth();
import multer from "multer";
var anthropic2 = null;
var openai2 = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic2 = new Anthropic5({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
}
if (process.env.OPENAI_API_KEY) {
  openai2 = new OpenAI5({
    apiKey: process.env.OPENAI_API_KEY
  });
}
function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
    stripeCustomerId: user.stripeCustomerId
  };
}
async function registerRoutes(app2) {
  await setupSimpleAuth(app2);
  const { handleStreamingChat: handleStreamingChat2 } = await Promise.resolve().then(() => (init_streaming(), streaming_exports));
  app2.post("/api/chat/stream", isAuthenticated, handleStreamingChat2);
  app2.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const conversations2 = await storage.getConversationsByUserId(userId);
      res.json(conversations2);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).send("Failed to fetch conversations");
    }
  });
  app2.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      console.log("[Create Conversation] Request body:", req.body);
      console.log("[Create Conversation] userId:", userId);
      const data = insertConversationSchema.parse({
        ...req.body,
        userId
      });
      console.log("[Create Conversation] Parsed data:", data);
      const conversation = await storage.createConversation(data);
      console.log("[Create Conversation] Created:", conversation.id);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[Create Conversation] Validation error:", error.errors);
        return res.status(400).json({ error: error.errors });
      }
      console.error("[Create Conversation] Error:", error);
      console.error("[Create Conversation] Error details:", {
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        detail: error.detail
      });
      res.status(500).json({ error: error.message || "Failed to create conversation" });
    }
  });
  app2.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const conversationId = req.params.id;
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      if (conversation.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      await storage.deleteConversation(conversationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });
  app2.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const messages2 = await storage.getMessagesByConversationId(req.params.id);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Failed to fetch messages");
    }
  });
  app2.get("/api/environments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const environments = await storage.getEnvironmentsByUserId(userId);
      res.json(environments);
    } catch (error) {
      console.error("Error fetching environments:", error);
      res.status(500).send("Failed to fetch environments");
    }
  });
  app2.post("/api/environments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const data = insertApiEnvironmentSchema.parse({
        ...req.body,
        userId
      });
      const environment = await storage.createEnvironment(data);
      res.json(environment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating environment:", error);
      res.status(500).send("Failed to create environment");
    }
  });
  app2.get("/api/environments/:id/variables", isAuthenticated, async (req, res) => {
    try {
      const variables = await storage.getVariablesByEnvironmentId(req.params.id);
      res.json(variables);
    } catch (error) {
      console.error("Error fetching variables:", error);
      res.status(500).send("Failed to fetch variables");
    }
  });
  app2.post("/api/environments/:id/variables", isAuthenticated, async (req, res) => {
    try {
      const data = insertEnvironmentVariableSchema.parse({
        ...req.body,
        environmentId: req.params.id
      });
      const variable = await storage.createVariable(data);
      res.json(variable);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating variable:", error);
      res.status(500).send("Failed to create variable");
    }
  });
  app2.post("/api/playground/execute", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { environmentId, method, url, headers, body } = req.body;
      const startTime = Date.now();
      const response = await fetch(url, {
        method,
        headers: headers || {},
        body: body ? JSON.stringify(body) : void 0
      });
      const responseTime = Date.now() - startTime;
      const responseData = await response.json();
      await storage.createRequestHistory({
        userId,
        environmentId,
        method,
        url,
        headers,
        body,
        response: JSON.stringify(responseData),
        statusCode: response.status,
        responseTime
      });
      res.json({
        data: responseData,
        status: response.status
      });
    } catch (error) {
      console.error("Error executing request:", error);
      res.status(500).json({ error: "Failed to execute request" });
    }
  });
  app2.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).send("Failed to fetch stats");
    }
  });
  app2.get("/api/admin/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).send("Failed to fetch admin stats");
    }
  });
  app2.get("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const sanitizedUsers = users2.map((user) => sanitizeUser(user));
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Failed to fetch users");
    }
  });
  app2.post("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const bcrypt2 = await import("bcryptjs");
      const passwordHash = await bcrypt2.hash(password, 10);
      res.status(501).json({ message: "User creation not implemented yet" });
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.message?.includes("unique")) {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.patch("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const { email, password, firstName, lastName, phone, role } = req.body;
      const updates = {};
      if (email) updates.email = email;
      if (firstName !== void 0) updates.firstName = firstName;
      if (lastName !== void 0) updates.lastName = lastName;
      if (phone !== void 0) updates.phone = phone;
      if (role) updates.role = role;
      if (password) {
        const bcrypt2 = await import("bcryptjs");
        updates.passwordHash = await bcrypt2.hash(password, 10);
      }
      res.status(501).json({ message: "User update not implemented yet" });
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.message?.includes("unique")) {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  const profileUpdateSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone format").min(10, "Phone must be at least 10 characters").max(20)
  }).strict();
  app2.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      console.log("[PATCH /api/user/profile] Request body:", JSON.stringify(req.body));
      const validatedData = profileUpdateSchema.parse(req.body);
      console.log("[PATCH /api/user/profile] Validated data:", JSON.stringify(validatedData));
      const updatedUser = await storage.updateUser(userId, validatedData);
      console.log("[PATCH /api/user/profile] Updated user:", updatedUser.id, updatedUser.firstName, updatedUser.lastName, updatedUser.phone);
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[PATCH /api/user/profile] Validation error:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
      // 10MB limit
      files: 5
      // Max 5 files at once
    }
  });
  app2.post("/api/user/profile-image", isAuthenticated, upload.single("image"), async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
      }
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "File must be an image" });
      }
      const processedFile = await fileProcessor.processFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      const profileImageUrl = `data:${req.file.mimetype};base64,${processedFile.base64}`;
      const updatedUser = await storage.updateUser(userId, { profileImageUrl });
      res.json({
        user: sanitizeUser(updatedUser),
        imageUrl: profileImageUrl
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });
  app2.post("/api/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      const processedFile = await fileProcessor.processFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      res.json(processedFile);
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });
  app2.post("/api/upload/multiple", isAuthenticated, upload.array("files", 5), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files provided" });
      }
      const files = req.files.map((file) => ({
        buffer: file.buffer,
        name: file.originalname,
        mimeType: file.mimetype
      }));
      const processedFiles = await fileProcessor.processMultipleFiles(files);
      res.json(processedFiles);
    } catch (error) {
      console.error("Error processing files:", error);
      res.status(500).json({ message: "Failed to process files" });
    }
  });
  app2.get("/api/upload/:fileId", isAuthenticated, async (req, res) => {
    try {
      const stats = await fileProcessor.getFileStats(req.params.fileId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting file stats:", error);
      res.status(404).json({ message: "File not found" });
    }
  });
  Promise.resolve().then(() => (init_image_generation(), image_generation_exports)).then((module) => {
    app2.use("/api/images", module.default);
    console.log("[Routes] Image generation endpoints registered");
  }).catch((error) => {
    console.error("[Routes] Failed to load image generation routes:", error);
  });
  app2.post("/api/voice/tts", isAuthenticated, async (req, res) => {
    try {
      const { text: text2, voiceId } = req.body;
      console.log("[TTS] Request received:", { textLength: text2?.length, voiceId });
      if (!text2) {
        console.error("[TTS] \u274C No text provided");
        return res.status(400).json({ message: "Text is required" });
      }
      const { elevenLabs: elevenLabs2 } = await Promise.resolve().then(() => (init_elevenlabs(), elevenlabs_exports));
      if (!elevenLabs2.isAvailable()) {
        console.error("[TTS] \u274C ElevenLabs not available - API key missing?");
        return res.status(503).json({ message: "ElevenLabs API key not configured" });
      }
      console.log("[TTS] \u2705 Calling ElevenLabs API...");
      const audioBuffer = await elevenLabs2.textToSpeech(text2, {
        voiceId: voiceId || "21m00Tcm4TlvDq8ikWAM"
      });
      console.log("[TTS] \u2705 Audio generated, size:", audioBuffer.length, "bytes");
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(audioBuffer);
    } catch (error) {
      console.error("[TTS] \u274C Fatal error:", error);
      res.status(500).json({ message: "Failed to generate speech: " + error.message });
    }
  });
  app2.post("/api/voice/stt", isAuthenticated, upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }
      if (!openai2) {
        return res.status(503).json({ message: "Speech recognition not available" });
      }
      const file = new File([req.file.buffer], "audio.webm", { type: req.file.mimetype });
      const transcription = await openai2.audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: "en"
      });
      res.json({ text: transcription.text });
    } catch (error) {
      console.error("STT error:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });
}

// server/static.ts
import express2 from "express";
import fs2 from "fs";
import path2 from "path";
function serveStatic(app2) {
  const possiblePaths = [
    path2.resolve(import.meta.dirname, "public"),
    // Built: dist/index.js -> dist/public
    path2.resolve(import.meta.dirname, "..", "dist", "public"),
    // From server/ -> ../dist/public
    path2.resolve(process.cwd(), "dist", "public"),
    // From project root
    path2.resolve("/var/task", "dist", "public")
    // Vercel serverless path
  ];
  console.log(`[serveStatic] import.meta.dirname: ${import.meta.dirname}`);
  console.log(`[serveStatic] process.cwd(): ${process.cwd()}`);
  let distPath = null;
  for (const possiblePath of possiblePaths) {
    console.log(`[serveStatic] Checking: ${possiblePath} - exists: ${fs2.existsSync(possiblePath)}`);
    if (fs2.existsSync(possiblePath)) {
      distPath = possiblePath;
      console.log(`[serveStatic] \u2705 Found static files at: ${distPath}`);
      break;
    }
  }
  if (!distPath) {
    console.error(`[serveStatic] \u274C Could not find build directory. Tried:`, possiblePaths);
    app2.use("*", (_req, res) => {
      res.status(500).json({
        error: "Static files not found",
        message: "The application build files could not be located. Please ensure the build completed successfully.",
        triedPaths: possiblePaths,
        dirname: import.meta.dirname,
        cwd: process.cwd()
      });
    });
    return;
  }
  console.log(`[serveStatic] Serving static files from: ${distPath}`);
  app2.use(express2.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (filePath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html");
      }
    }
  }));
  app2.use("*", (_req, res) => {
    const indexPath = path2.resolve(distPath, "index.html");
    console.log(`[serveStatic] Serving index.html from: ${indexPath}`);
    if (fs2.existsSync(indexPath)) {
      res.setHeader("Content-Type", "text/html");
      res.sendFile(indexPath);
    } else {
      console.error(`[serveStatic] index.html not found at: ${indexPath}`);
      res.status(404).json({
        error: "Not found",
        message: "The requested resource could not be found.",
        indexPath
      });
    }
  });
}

// server/index.vercel.ts
var app = express3();
var server = createServer(app);
var isInitialized = false;
var initError = null;
var initPromise = (async () => {
  try {
    await initializeApp();
    isInitialized = true;
  } catch (error) {
    initError = error;
    console.error("[Server] Initialization failed:", error);
    console.error("[Server] Error stack:", error.stack);
  }
})();
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes("vercel.app") || origin === "http://localhost:5173" || origin === "http://localhost:5000")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(
  express3.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express3.urlencoded({ extended: false }));
app.use(async (req, res, next) => {
  try {
    await initPromise;
    if (initError) {
      return res.status(500).json({
        error: "Server initialization failed",
        message: initError.message,
        details: "The server failed to initialize. Check environment variables and database connection."
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      error: "Server initialization error",
      message: error.message,
      details: "An error occurred during server initialization."
    });
  }
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      console.log(`${formattedTime} [express] ${logLine}`);
    }
  });
  next();
});
async function initializeApp() {
  console.log("[Server] Initializing Vercel serverless function...");
  try {
    await registerRoutes(app);
    console.log("[Server] \u2705 API routes registered");
  } catch (error) {
    console.error("[Server] Error registering routes:", error);
    app.get("/api/health", (req, res) => {
      res.json({
        status: "degraded",
        message: "Some features may be unavailable",
        error: error.message
      });
    });
    throw error;
  }
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[Server] Error ${status}:`, message);
    console.error(err.stack);
    res.status(status).json({ message });
  });
  console.log("[Server] Setting up static file serving...");
  serveStatic(app);
  console.log("[Server] \u2705 Static files configured");
  console.log("[Server] \u2705 Initialization complete");
}
initPromise.catch((error) => {
  console.error("[Server] Fatal initialization error:", error);
  console.error("[Server] Error stack:", error.stack);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught Exception:", error);
});
var index_vercel_default = app;
export {
  index_vercel_default as default
};
