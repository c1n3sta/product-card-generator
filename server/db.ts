import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

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
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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

// Product queries
export async function createProduct(product: InsertProduct): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(products).values(product);
  const created = await db.select().from(products).where(eq(products.sku, product.sku)).limit(1);
  return created[0] as Product;
}

export async function getProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Product card queries
export async function createProductCard(card: InsertProductCard): Promise<ProductCard> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(productCards).values(card);
  const created = await db.select().from(productCards).where(eq(productCards.productId, card.productId)).limit(1);
  return created[0] as ProductCard;
}

export async function getCardsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productCards).where(eq(productCards.userId, userId));
}

export async function getCardByProductId(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productCards).where(eq(productCards.productId, productId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProductCard(id: number, updates: Partial<ProductCard>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productCards).set(updates).where(eq(productCards.id, id));
}

// Card layer queries
export async function createCardLayer(layer: InsertCardLayer): Promise<CardLayer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(cardLayers).values(layer);
  const created = await db.select().from(cardLayers).where(eq(cardLayers.cardId, layer.cardId)).limit(1);
  return created[0] as CardLayer;
}

export async function getLayersByCardId(cardId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cardLayers).where(eq(cardLayers.cardId, cardId));
}

export async function updateCardLayer(id: number, updates: Partial<CardLayer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cardLayers).set(updates).where(eq(cardLayers.id, id));
}

// Processing job queries
export async function createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(processingJobs).values(job);
  const created = await db.select().from(processingJobs).where(eq(processingJobs.userId, job.userId)).limit(1);
  return created[0] as ProcessingJob;
}

export async function getJobsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(processingJobs).where(eq(processingJobs.userId, userId));
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(processingJobs).where(eq(processingJobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProcessingJob(id: number, updates: Partial<ProcessingJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(processingJobs).set(updates).where(eq(processingJobs.id, id));
}

// Processing log queries
export async function createProcessingLog(log: InsertProcessingLog): Promise<ProcessingLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(processingLogs).values(log);
  const created = await db.select().from(processingLogs).where(eq(processingLogs.jobId, log.jobId)).limit(1);
  return created[0] as ProcessingLog;
}

export async function getLogsByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(processingLogs).where(eq(processingLogs.jobId, jobId));
}

export async function updateProcessingLog(id: number, updates: Partial<ProcessingLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(processingLogs).set(updates).where(eq(processingLogs.id, id));
}
