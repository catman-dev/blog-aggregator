import { asc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { users } from "../schema.js";

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name }).returning();
  return result;
}

export async function getUserByName(name: string) {
  const [user] = await db.select().from(users).where(eq(users.name, name));
  return user;
}

export async function getUsers() {
  return await db.select().from(users).orderBy(asc(users.name));
}
