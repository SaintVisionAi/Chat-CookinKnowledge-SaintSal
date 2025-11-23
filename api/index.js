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
      organizationId: varchar("organization_id"),
      // For enterprise team members
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
      secure: isProduction,
      // Secure cookies in production
      sameSite: isProduction ? "strict" : "lax",
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
        email,
        firstName,
        lastName,
        phone,
        passwordHash,
        role: "viewer"
        // Default role
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
      res.status(500).json({ error: "Registration failed" });
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
      async processImage(imageData, prompt, ws2, options = {}) {
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
            ws2.send(JSON.stringify({
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
      async streamChat(messages2, ws2, options = {}) {
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
            ws2.send(JSON.stringify({
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
        const OpenAI2 = await import("openai");
        const openai2 = new OpenAI2.default({
          apiKey: process.env.OPENAI_API_KEY
        });
        if (!process.env.OPENAI_API_KEY) {
          return res.status(503).json({ error: "DALL-E service not available. Please configure OPENAI_API_KEY." });
        }
        console.log("[DALL-E] Generating image:", { prompt: prompt.substring(0, 50), size, quality });
        const response = await openai2.images.generate({
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
      async streamTextToSpeech(text2, ws2, options = {}) {
        const audioBuffer = await this.textToSpeech(text2, options);
        const base64Audio = audioBuffer.toString("base64");
        const mimeType = options.outputFormat?.startsWith("mp3") ? "audio/mpeg" : "audio/wav";
        ws2.send(JSON.stringify({
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

// server/index.vercel.ts
import "dotenv/config";
import express3 from "express";
import { createServer } from "http";

// server/routes.ts
init_storage();
init_schema();
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

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
var anthropic = null;
var openai = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
}
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
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
      const data = insertConversationSchema.parse({
        ...req.body,
        userId
      });
      const conversation = await storage.createConversation(data);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).send("Failed to create conversation");
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
      if (!openai) {
        return res.status(503).json({ message: "Speech recognition not available" });
      }
      const file = new File([req.file.buffer], "audio.webm", { type: req.file.mimetype });
      const transcription = await openai.audio.transcriptions.create({
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
