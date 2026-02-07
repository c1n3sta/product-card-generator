import { integer, pgTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 10 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - stores imported product data from CSV
 */
export const products = pgTable("products", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  sku: varchar("sku", { length: 100 }),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 200 }),
  price: text("price"),
  originalImageUrl: text("originalimageurl"),
  processedImageUrl: text("processedimageurl"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product Cards table - stores generated card metadata
 */
export const productCards = pgTable("product_cards", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  productId: integer("productId").notNull(),
  userId: integer("userId").notNull(),
  accentColor: varchar("accentcolor", { length: 20 }).default("#3B82F6"),
  marketingCopy: text("marketingcopy"),
  backgroundPrompt: text("backgroundprompt"),
  canvasData: json("canvasdata"),
  finalImageUrl: text("finalimageurl"),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  processingJobId: integer("processingjobid"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProductCard = typeof productCards.$inferSelect;
export type InsertProductCard = typeof productCards.$inferInsert;

/**
 * Card Layers table - stores individual layers for each card
 */
export const cardLayers = pgTable("card_layers", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  cardId: integer("cardId").notNull(),
  layerType: varchar("layerType", { length: 20 }).notNull(),
  layerOrder: integer("layerOrder").default(0),
  imageUrl: text("imageUrl"),
  textContent: text("textContent"),
  positionX: integer("positionX").default(0),
  positionY: integer("positionY").default(0),
  width: integer("width"),
  height: integer("height"),
  rotation: integer("rotation").default(0),
  opacity: decimal("opacity", { precision: 3, scale: 2 }).default("1.00"),
  fontFamily: varchar("fontFamily", { length: 100 }),
  fontSize: integer("fontSize"),
  fontColor: varchar("fontColor", { length: 20 }),
  fontWeight: varchar("fontWeight", { length: 20 }),
  textAlign: varchar("textAlign", { length: 20 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CardLayer = typeof cardLayers.$inferSelect;
export type InsertCardLayer = typeof cardLayers.$inferInsert;

/**
 * Processing Jobs table - tracks bulk generation jobs
 */
export const processingJobs = pgTable("processing_jobs", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  jobName: varchar("jobName", { length: 200 }),
  totalProducts: integer("totalProducts").default(0),
  processedProducts: integer("processedProducts").default(0),
  failedProducts: integer("failedProducts").default(0),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  accentColor: varchar("accentColor", { length: 20 }),
  targetMarketplace: varchar("targetMarketplace", { length: 100 }),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = typeof processingJobs.$inferInsert;

/**
 * Processing Logs table - detailed logs for each processing step
 */
export const processingLogs = pgTable("processing_logs", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  jobId: integer("jobId").notNull(),
  productId: integer("productId"),
  step: varchar("step", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  message: text("message"),
  errorDetails: text("errorDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProcessingLog = typeof processingLogs.$inferSelect;
export type InsertProcessingLog = typeof processingLogs.$inferInsert;
