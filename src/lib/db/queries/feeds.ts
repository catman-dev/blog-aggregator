import { asc, eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { feeds, users } from "../schema.js";

export async function createFeed(name: string, url: string, userId: string) {
  const [feed] = await db.insert(feeds).values({
    name,
    url,
    userId,
  }).returning();

  return feed;
}

export async function getFeedByUrl(url: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.url, url));
  return feed;
}

export async function getFeeds() {
  return await db
    .select({
      feedName: feeds.name,
      feedUrl: feeds.url,
      userName: users.name,
    })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
}

export async function markFeedFetched(feedId: string) {
  const [feed] = await db
    .update(feeds)
    .set({
      lastFetchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(feeds.id, feedId))
    .returning();

  return feed;
}

export async function getNextFeedToFetch() {
  const [feed] = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} NULLS FIRST`, asc(feeds.id))
    .limit(1);

  return feed;
}
