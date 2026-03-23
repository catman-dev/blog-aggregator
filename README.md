# Gator

Gator is a CLI RSS feed aggregator built with TypeScript, PostgreSQL, and Drizzle ORM.

## Requirements

To run Gator, you need:
- Node.js
- npm
- PostgreSQL
- a PostgreSQL database named `gator`

## Config

Create a config file in your home directory named:

```
~/.gatorconfig.json
```

Example config:

```json
{
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable",
  "current_user_name": "enzo"
}
```

## Setup

Install dependencies:

```bash
npm install
```

Run migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Make sure PostgreSQL is running before using the CLI.

## Running the CLI

Use commands like:

```bash
npm run start <command>
```

## Example commands

Register a user:

```bash
npm run start register enzo
```

Login:

```bash
npm run start login enzo
```

Add a feed:

```bash
npm run start addfeed "Boot.dev Blog" "https://www.boot.dev/blog/index.xml"
```

Follow a feed:

```bash
npm run start follow "https://hnrss.org/newest"
```

Unfollow a feed:

```bash
npm run start unfollow "https://hnrss.org/newest"
```

Show followed feeds:

```bash
npm run start following
```

Aggregate posts:

```bash
npm run start agg 10s
```

Browse posts:

```bash
npm run start browse
npm run start browse 5
```

Reset users and related data:

```bash
npm run start reset
```

## Notes

- `agg` runs continuously until stopped with `Ctrl + C`
- `browse` shows the latest posts from feeds followed by the current user
- PostgreSQL must be running while using the app

## Repository

https://github.com/catman-dev/blog-aggregator
