import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const res = await fetch(feedURL, {
    headers: { "User-Agent": "gator" },
  });

  if (!res.ok) throw new Error("failed to fetch feed");

  const xml = await res.text();

  const parser = new XMLParser();
  const data = parser.parse(xml);

  if (!data.rss || !data.rss.channel) {
    throw new Error("invalid RSS feed");
  }

  const channel = data.rss.channel;

  if (!channel.title || !channel.link || !channel.description) {
    throw new Error("invalid channel data");
  }

  let itemsRaw = channel.item ?? [];
  if (!Array.isArray(itemsRaw)) itemsRaw = [itemsRaw];

  const items: RSSItem[] = [];

  for (const it of itemsRaw) {
    if (!it.title || !it.link || !it.description || !it.pubDate) continue;

    items.push({
      title: it.title,
      link: it.link,
      description: it.description,
      pubDate: it.pubDate,
    });
  }

  return {
    channel: {
      title: channel.title,
      link: channel.link,
      description: channel.description,
      item: items,
    },
  };
}
