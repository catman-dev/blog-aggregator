import { readConfig, setUser } from "./config.js";
import { createFeedFollow, deleteFeedFollow, getFeedFollowsForUser } from "./lib/db/queries/feed_follows.js";
import { createFeed, getFeedByUrl, getFeeds } from "./lib/db/queries/feeds.js";
import { getPostsForUser } from "./lib/db/queries/posts.js";
import { deleteAllUsers } from "./lib/db/queries/reset.js";
import { createUser, getUserByName, getUsers } from "./lib/db/queries/users.js";
import { Feed, User } from "./lib/db/schema.js";
import { scrapeFeeds } from "./lib/scraper.js";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

type CommandsRegistry = {
  [key: string]: CommandHandler;
};

function printFeed(feed: Feed, user: User): void {
  console.log(`id: ${feed.id}`);
  console.log(`createdAt: ${feed.createdAt}`);
  console.log(`updatedAt: ${feed.updatedAt}`);
  console.log(`name: ${feed.name}`);
  console.log(`url: ${feed.url}`);
  console.log(`userId: ${feed.userId}`);
  console.log(`userName: ${user.name}`);
}

function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const config = readConfig();
    if (!config.currentUserName) {
      throw new Error("no current user set");
    }

    const user = await getUserByName(config.currentUserName);
    if (!user) {
      throw new Error(`User ${config.currentUserName} not found`);
    }

    await handler(cmdName, user, ...args);
  };
}

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);
  if (!match) {
    throw new Error("invalid duration");
  }

  const value = Number(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
  };

  return value * multipliers[unit];
}

async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const username = args[0];
  const user = await getUserByName(username);
  if (!user) {
    throw new Error("user does not exist");
  }

  setUser(username);
  console.log(`User set to ${username}`);
}

async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const username = args[0];
  const existing = await getUserByName(username);
  if (existing) {
    throw new Error("user already exists");
  }

  const user = await createUser(username);
  setUser(username);
  console.log("User created:", user);
}

async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
  await deleteAllUsers();
  console.log("Users deleted successfully");
}

async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
  const config = readConfig();
  const users = await getUsers();

  for (const user of users) {
    if (user.name === config.currentUserName) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}

async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length < 1) {
    throw new Error("duration required");
  }

  const timeBetweenRequests = parseDuration(args[0]);
  console.log(`Collecting feeds every ${args[0]}`);

  await scrapeFeeds();

  const interval = setInterval(() => {
    scrapeFeeds().catch(console.error);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

async function handlerAddFeed(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length < 2) {
    throw new Error("name and url are required");
  }

  const [name, url] = args;
  const feed = await createFeed(name, url, user.id);
  printFeed(feed, user);

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`${follow.userName} is now following ${follow.feedName}`);
}

async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
  const feeds = await getFeeds();
  for (const feed of feeds) {
    console.log(`name: ${feed.feedName}`);
    console.log(`url: ${feed.feedUrl}`);
    console.log(`user: ${feed.userName}`);
  }
}

async function handlerFollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length < 1) {
    throw new Error("url is required");
  }

  const [url] = args;
  const feed = await getFeedByUrl(url);
  if (!feed) {
    throw new Error("feed not found");
  }

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`${follow.userName} is now following ${follow.feedName}`);
}

async function handlerFollowing(cmdName: string, user: User, ...args: string[]): Promise<void> {
  const follows = await getFeedFollowsForUser(user.id);
  for (const follow of follows) {
    console.log(follow.feedName);
  }
}

async function handlerUnfollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length < 1) {
    throw new Error("url is required");
  }

  const [url] = args;
  await deleteFeedFollow(user.id, url);
  console.log(`Unfollowed ${url}`);
}

async function handlerBrowse(cmdName: string, user: User, ...args: string[]): Promise<void> {
  const limit = args[0] ? Number(args[0]) : 2;
  const posts = await getPostsForUser(user.id, limit);

  for (const post of posts) {
    console.log(post.title);
    console.log(post.url);
    if (post.description) {
      console.log(post.description);
    }
    if (post.feedName) {
      console.log(`from: ${post.feedName}`);
    }
    console.log("---");
  }
}

function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error(`unknown command: ${cmdName}`);
  }
  await handler(cmdName, ...args);
}

async function main(): Promise<void> {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));
  registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("not enough arguments provided");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
    process.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : "error");
    process.exit(1);
  }
}

main();
