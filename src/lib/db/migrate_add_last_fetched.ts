import { sql } from "drizzle-orm";
import { db } from "./index.js";

export async function addLastFetchedAt() {
  await db.execute(sql`ALTER TABLE feeds ADD COLUMN IF NOT EXISTS last_fetched_at TIMESTAMP;`);
}
