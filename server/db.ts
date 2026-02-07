import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  InsertUser,
  users,
  products,
  InsertProduct,
  Product,
  productCards,
  InsertProductCard,
  ProductCard,
  cardLayers,
  InsertCardLayer,
  CardLayer,
  processingJobs,
  InsertProcessingJob,
  ProcessingJob,
  processingLogs,
  InsertProcessingLog,
  ProcessingLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _connectionAttempted = false;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL && !_connectionAttempted) {
    _connectionAttempted = true;
    try {
      console.log("[Database] Attempting to connect...");
      _db = drizzle(process.env.DATABASE_URL);
      // Test the connection
      await _db.execute(sql`SELECT 1`);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      console.error("[Database] Connection string:", process.env.DATABASE_URL);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER OPERATIONS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    // Remove reference to ENV.ownerOpenId since it doesn't exist
    // } else if (user.openId === ENV.ownerOpenId) {
    //   values.role = "admin";
    //   updateSet.role = "admin";
    // }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== PRODUCT OPERATIONS ====================

export async function createProduct(product: InsertProduct): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(product).returning({ id: products.id });
  const insertId = result[0].id;
  const created = await db.select().from(products).where(eq(products.id, insertId)).limit(1);
  return created[0];
}

export async function createProducts(productList: InsertProduct[]): Promise<Product[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (productList.length === 0) return [];

  await db.insert(products).values(productList);
  
  // Get the most recently created products for this user
  const userId = productList[0].userId;
  const created = await db
    .select()
    .from(products)
    .where(eq(products.userId, userId))
    .orderBy(desc(products.createdAt))
    .limit(productList.length);
  
  return created.reverse();
}

export async function getProductsByUserId(userId: number): Promise<Product[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt));
}

export async function getProductById(productId: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result[0];
}

export async function updateProduct(productId: number, updates: Partial<InsertProduct>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(products).set(updates).where(eq(products.id, productId));
}

export async function deleteProduct(productId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(products).where(eq(products.id, productId));
}

// ==================== PRODUCT CARD OPERATIONS ====================

export async function createProductCard(card: InsertProductCard): Promise<ProductCard> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(productCards).values(card).returning({ id: productCards.id });
  const insertId = result[0].id;
  const created = await db.select().from(productCards).where(eq(productCards.id, insertId)).limit(1);
  return created[0];
}

export async function getCardsByUserId(userId: number): Promise<ProductCard[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(productCards).where(eq(productCards.userId, userId)).orderBy(desc(productCards.createdAt));
}

export async function getCardById(cardId: number): Promise<ProductCard | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(productCards).where(eq(productCards.id, cardId)).limit(1);
  return result[0];
}

export async function getCardByProductId(productId: number): Promise<ProductCard | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(productCards).where(eq(productCards.productId, productId)).limit(1);
  return result[0];
}

export async function updateProductCard(cardId: number, updates: Partial<InsertProductCard>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(productCards).set(updates).where(eq(productCards.id, cardId));
}

export async function deleteProductCard(cardId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete associated layers first
  await db.delete(cardLayers).where(eq(cardLayers.cardId, cardId));
  await db.delete(productCards).where(eq(productCards.id, cardId));
}

// ==================== CARD LAYER OPERATIONS ====================

export async function createCardLayer(layer: InsertCardLayer): Promise<CardLayer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cardLayers).values(layer).returning({ id: cardLayers.id });
  const insertId = result[0].id;
  const created = await db.select().from(cardLayers).where(eq(cardLayers.id, insertId)).limit(1);
  return created[0];
}

export async function getLayersByCardId(cardId: number): Promise<CardLayer[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(cardLayers).where(eq(cardLayers.cardId, cardId)).orderBy(cardLayers.layerOrder);
}

export async function updateCardLayer(layerId: number, updates: Partial<InsertCardLayer>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(cardLayers).set(updates).where(eq(cardLayers.id, layerId));
}

export async function deleteCardLayer(layerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(cardLayers).where(eq(cardLayers.id, layerId));
}

// ==================== PROCESSING JOB OPERATIONS ====================

export async function createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(processingJobs).values(job).returning({ id: processingJobs.id });
  const insertId = result[0].id;
  const created = await db.select().from(processingJobs).where(eq(processingJobs.id, insertId)).limit(1);
  return created[0];
}

export async function getJobsByUserId(userId: number): Promise<ProcessingJob[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(processingJobs).where(eq(processingJobs.userId, userId)).orderBy(desc(processingJobs.createdAt));
}

export async function getJobById(jobId: number): Promise<ProcessingJob | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(processingJobs).where(eq(processingJobs.id, jobId)).limit(1);
  return result[0];
}

export async function updateProcessingJob(jobId: number, updates: Partial<InsertProcessingJob>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(processingJobs).set(updates).where(eq(processingJobs.id, jobId));
}

// ==================== PROCESSING LOG OPERATIONS ====================

export async function createProcessingLog(log: InsertProcessingLog): Promise<ProcessingLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(processingLogs).values(log).returning({ id: processingLogs.id });
  const insertId = result[0].id;
  const created = await db.select().from(processingLogs).where(eq(processingLogs.id, insertId)).limit(1);
  return created[0];
}

export async function getLogsByJobId(jobId: number): Promise<ProcessingLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(processingLogs).where(eq(processingLogs.jobId, jobId)).orderBy(processingLogs.createdAt);
}

export async function updateProcessingLog(logId: number, updates: Partial<InsertProcessingLog>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(processingLogs).set(updates).where(eq(processingLogs.id, logId));
}
