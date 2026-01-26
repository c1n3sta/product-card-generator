import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table: Stores CSV-imported product data
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sku: varchar("sku", { length: 255 }).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 255 }),
  price: varchar("price", { length: 100 }),
  imageUrl: text("imageUrl"),
  rawData: text("rawData"), // Store original CSV row as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product cards table: Stores generated card state and metadata
 */
export const productCards = mysqlTable("product_cards", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  accentColor: varchar("accentColor", { length: 7 }).default("#0057B7"), // Hex color
  marketingCopy: text("marketingCopy"), // AI-generated marketing text
  backgroundPrompt: text("backgroundPrompt"), // Gemini-generated scene description
  cardImageUrl: text("cardImageUrl"), // Final exported card image
  fabricJson: text("fabricJson"), // Fabric.js canvas state as JSON
  status: mysqlEnum("status", ["draft", "processing", "completed", "failed"]).default("draft"),
  processingJobId: int("processingJobId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductCard = typeof productCards.$inferSelect;
export type InsertProductCard = typeof productCards.$inferInsert;

/**
 * Card layers table: Tracks individual layer data (product image, background, text)
 */
export const cardLayers = mysqlTable("card_layers", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(),
  layerType: mysqlEnum("layerType", ["product_image", "background", "text_title", "text_price", "text_description"]).notNull(),
  imageUrl: text("imageUrl"), // For image layers
  textContent: text("textContent"), // For text layers
  layerData: text("layerData"), // Fabric.js layer object as JSON
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CardLayer = typeof cardLayers.$inferSelect;
export type InsertCardLayer = typeof cardLayers.$inferInsert;

/**
 * Processing jobs table: Tracks bulk processing state
 */
export const processingJobs = mysqlTable("processing_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobName: varchar("jobName", { length: 255 }).notNull(),
  totalProducts: int("totalProducts").notNull(),
  processedProducts: int("processedProducts").default(0),
  failedProducts: int("failedProducts").default(0),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = typeof processingJobs.$inferInsert;

/**
 * Processing logs table: Detailed step-by-step processing logs
 */
export const processingLogs = mysqlTable("processing_logs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  productId: int("productId").notNull(),
  step: mysqlEnum("step", ["data_extraction", "image_discovery", "background_removal", "background_generation", "card_assembly"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  message: text("message"),
  errorDetails: text("errorDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcessingLog = typeof processingLogs.$inferSelect;
export type InsertProcessingLog = typeof processingLogs.$inferInsert;