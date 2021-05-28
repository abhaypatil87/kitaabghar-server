const path = require("path");
if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV not set");
}

require("dotenv").config();

const MIGRATIONS_PATH = path.resolve(__dirname, "src/database/migrations");
const SEEDS_PATH = path.resolve(__dirname, "src/database/seeds");

module.exports = {
  testing: {
    client: "mysql",
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
      level: "info",
    },
  },
  production: {
    client: "mysql",
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
