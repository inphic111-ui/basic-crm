import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      _db = drizzle(pool, { schema });
    } catch (error) {
      console.warn('[Database] Failed to connect:', error);
      _db = null;
    }
  }
  return _db;
}

// 用戶操作
export async function upsertUser(user: schema.InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error('User openId is required for upsert');
  }

  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot upsert user: database not available');
    return;
  }

  try {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.openId, user.openId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.users)
        .set({
          ...user,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.openId, user.openId));
    } else {
      await db.insert(schema.users).values(user);
    }
  } catch (error) {
    console.error('[Database] Failed to upsert user:', error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot get user: database not available');
    return undefined;
  }

  const result = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// 客戶操作
export async function listCustomers(page: number = 1, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot list customers: database not available');
    return { customers: [], total: 0 };
  }

  try {
    const offset = (page - 1) * limit;
    const [customers, countResult] = await Promise.all([
      db.select().from(schema.customers).limit(limit).offset(offset),
      db.select({ count: schema.customers.id }).from(schema.customers),
    ]);

    const total = countResult[0]?.count || 0;
    return { customers, total };
  } catch (error) {
    console.error('[Database] Failed to list customers:', error);
    return { customers: [], total: 0 };
  }
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot get customer: database not available');
    return undefined;
  }

  const result = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomer(customer: schema.InsertCustomer) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.insert(schema.customers).values(customer).returning();
  return result[0];
}

export async function updateCustomer(id: number, customer: Partial<schema.InsertCustomer>) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db
    .update(schema.customers)
    .set({
      ...customer,
      updatedAt: new Date(),
    })
    .where(eq(schema.customers.id, id))
    .returning();

  return result[0];
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  await db.delete(schema.customers).where(eq(schema.customers.id, id));
}

// 種植預設客戶
export async function seedCustomers() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const defaultCustomers = [
    {
      name: '台灣科技公司',
      email: 'info@techcorp.tw',
      phone: '02-1234-5678',
      company: 'TechCorp Taiwan',
      notes: '重點客戶，確認待收款',
    },
    {
      name: '創意設計工作室',
      email: 'contact@creativestudio.tw',
      phone: '02-8765-4321',
      company: 'Creative Studio',
      notes: '優質客戶，需要定期跟進',
    },
    {
      name: '綠色環保公司',
      email: 'hello@greeneco.tw',
      phone: '03-5555-6666',
      company: 'Green Eco',
      notes: '普通客戶，持續跟進',
    },
    {
      name: '王小明',
      email: 'wang.xiaoming@email.com',
      phone: '0912-345-678',
      company: '個人',
      notes: '個人客戶，需要培養',
    },
    {
      name: '李美麗',
      email: 'li.meili@email.com',
      phone: '0913-456-789',
      company: '個人',
      notes: '個人客戶，有購買潛力',
    },
  ];

  try {
    await db.insert(schema.customers).values(defaultCustomers);
    console.log('[Database] Successfully seeded 5 default customers');
  } catch (error) {
    console.warn('[Database] Customers may already exist:', error);
  }
}
