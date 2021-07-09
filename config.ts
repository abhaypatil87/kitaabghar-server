import { resolve } from "path";
import { config } from "dotenv";

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV not set");
}

config();
const MIGRATIONS_PATH = resolve(__dirname, "src/database/migrations");
const SEEDS_PATH = resolve(__dirname, "src/database/seeds");

const environment = {
  testing: {
    debug: false,
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: `test_${process.env.DB_DATABASE}`,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    migrations: {
      directory: MIGRATIONS_PATH,
    },
    seeds: {
      seed: false,
      directory: SEEDS_PATH,
    },
    logger: {
      name: "Library Server",
      level: "info",
    },
  },
  development: {
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    migrations: {
      directory: MIGRATIONS_PATH,
    },
    seeds: {
      seed: false,
      directory: SEEDS_PATH,
    },
    logger: {
      name: "Library Server",
      level: "trace",
    },
  },
  production: {
    debug: false,
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: `${process.env.DB_DATABASE}`,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    migrations: {
      directory: MIGRATIONS_PATH,
    },
    seeds: {
      seed: false,
      directory: SEEDS_PATH,
    },
    logger: {
      name: "Library Server",
      level: "info",
    },
  },
};

export default environment;
