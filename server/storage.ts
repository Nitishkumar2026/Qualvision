import { type User, type InsertUser, type Inspection, type InsertInspection, inspections } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  getInspectionHistory(limit?: number): Promise<Inspection[]>;
  getInspection(id: string): Promise<Inspection | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error("Not implemented");
  }

  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const { db } = await import("./db");
    if (!db) throw new Error("Database not initialized");
    const [result] = await db.insert(inspections).values(inspection).returning();
    return result;
  }

  async getInspectionHistory(limit: number = 50): Promise<Inspection[]> {
    const { db } = await import("./db");
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(inspections)
      .orderBy(desc(inspections.createdAt))
      .limit(limit);
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    const { db } = await import("./db");
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .select()
      .from(inspections)
      .where(eq(inspections.id, id))
      .limit(1);
    return result;
  }
}

class MemoryStorage implements IStorage {
  users: User[] = [];
  inspections: Inspection[] = [];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const created: User = { id: randomUUID(), ...user };
    this.users.push(created);
    return created;
  }

  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const created: Inspection = {
      id: randomUUID(),
      createdAt: new Date(),
      ...inspection,
    } as Inspection;
    this.inspections.unshift(created);
    return created;
  }

  async getInspectionHistory(limit: number = 50): Promise<Inspection[]> {
    return this.inspections.slice(0, limit);
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    return this.inspections.find((i) => i.id === id);
  }
}

export const storage: IStorage =
  process.env.DATABASE_URL ? new DatabaseStorage() : new MemoryStorage();
