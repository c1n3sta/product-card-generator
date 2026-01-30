import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
 * Products table - stores imported product data from CSV
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sku: varchar("sku", { length: 100 }),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 200 }),
  price: text("price"),
  originalImageUrl: text("originalImageUrl"),
  processedImageUrl: text("processedImageUrl"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product Cards table - stores generated card metadata
 */
export const productCards = mysqlTable("product_cards", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  accentColor: varchar("accentColor", { length: 20 }).default("#3B82F6"),
  marketingCopy: text("marketingCopy"),
  backgroundPrompt: text("backgroundPrompt"),
  canvasData: json("canvasData"),
  finalImageUrl: text("finalImageUrl"),
  status: mysqlEnum("status", ["draft", "processing", "completed", "failed"]).default("draft").notNull(),
  processingJobId: int("processingJobId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductCard = typeof productCards.$inferSelect;
export type InsertProductCard = typeof productCards.$inferInsert;

/**
 * Card Layers table - stores individual layers for each card
 */
export const cardLayers = mysqlTable("card_layers", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(),
  layerType: mysqlEnum("layerType", ["background", "product_image", "text_title", "text_description", "custom"]).notNull(),
  layerOrder: int("layerOrder").default(0),
  imageUrl: text("imageUrl"),
  textContent: text("textContent"),
  positionX: int("positionX").default(0),
  positionY: int("positionY").default(0),
  width: int("width"),
  height: int("height"),
  rotation: int("rotation").default(0),
  opacity: decimal("opacity", { precision: 3, scale: 2 }).default("1.00"),
  fontFamily: varchar("fontFamily", { length: 100 }),
  fontSize: int("fontSize"),
  fontColor: varchar("fontColor", { length: 20 }),
  fontWeight: varchar("fontWeight", { length: 20 }),
  textAlign: varchar("textAlign", { length: 20 }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CardLayer = typeof cardLayers.$inferSelect;
export type InsertCardLayer = typeof cardLayers.$inferInsert;

/**
 * Processing Jobs table - tracks bulk generation jobs
 */
export const processingJobs = mysqlTable("processing_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobName: varchar("jobName", { length: 200 }),
  totalProducts: int("totalProducts").default(0),
  processedProducts: int("processedProducts").default(0),
  failedProducts: int("failedProducts").default(0),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending").notNull(),
  accentColor: varchar("accentColor", { length: 20 }),
  targetMarketplace: varchar("targetMarketplace", { length: 100 }),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = typeof processingJobs.$inferInsert;

/**
 * Processing Logs table - detailed logs for each processing step
 */
export const processingLogs = mysqlTable("processing_logs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  productId: int("productId"),
  step: mysqlEnum("step", ["data_extraction", "image_discovery", "background_removal", "background_generation", "card_assembly"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  message: text("message"),
  errorDetails: text("errorDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcessingLog = typeof processingLogs.$inferSelect;
export type InsertProcessingLog = typeof processingLogs.$inferInsert;
