import { createPost } from "./db/queries/posts.js";
import { getNextFeedToFetch, markFeedFetched } from "./db/queries/feeds.js";
import { fetchFeed } from "./rss.js";

function parsePublishedAt(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export async function scrapeFeeds() {
  const feed = await getNextFeedToFetch();
  if (!feed) {
    console.log("No feeds to fetch");
    return;
  }

  console.log(`Fetching feed: ${feed.name}`);

  await markFeedFetched(feed.id);

  const rss = await fetchFeed(feed.url);

  for (const item of rss.channel.item) {
    const post = await createPost(
      item.title,
      item.link,
      item.description ?? null,
      parsePublishedAt(item.pubDate),
      feed.id
    );

    if (post) {
      console.log(`Saved post: ${post.title}`);
    }
  }
}
