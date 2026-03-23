import { and, eq } from "drizzle-orm";
import { db } from "../index.js";
import { feedFollows, feeds, users } from "../schema.js";

export async function createFeedFollow(userId: string, feedId: string) {
  const [feedFollow] = await db.insert(feedFollows).values({
    userId,
    feedId,
  }).returning();

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, feedId));

  if (!user) throw new Error("user not found");
  if (!feed) throw new Error("feed not found");

  return {
    ...feedFollow,
    userName: user.name,
    feedName: feed.name,
  };
}

export async function getFeedFollowsForUser(userId: string) {
  const follows = await db.select().from(feedFollows).where(eq(feedFollows.userId, userId));
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error("user not found");

  const results = [];

  for (const f of follows) {
    const [feed] = await db.select().from(feeds).where(eq(feeds.id, f.feedId));
    if (!feed) continue;

    results.push({
      ...f,
      userName: user.name,
      feedName: feed.name,
    });
  }

  return results;
}

export async function deleteFeedFollow(userId: string, feedUrl: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.url, feedUrl));
  if (!feed) {
    throw new Error("feed not found");
  }

  await db
    .delete(feedFollows)
    .where(and(eq(feedFollows.userId, userId), eq(feedFollows.feedId, feed.id)));
}
