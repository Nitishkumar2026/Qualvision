import { type User, type InsertUser, type Inspection, type InsertInspection, inspections } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

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
    const [result] = await db.insert(inspections).values(inspection).returning();
    return result;
  }

  async getInspectionHistory(limit: number = 50): Promise<Inspection[]> {
    return await db
      .select()
      .from(inspections)
      .orderBy(desc(inspections.createdAt))
      .limit(limit);
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    const [result] = await db
      .select()
      .from(inspections)
      .where(eq(inspections.id, id))
      .limit(1);
    return result;
  }
}

export const storage = new DatabaseStorage();
