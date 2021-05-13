if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV not set");
}

require("dotenv").config();

module.exports = {
  testing: {
    client: "mysql",
    debug: false,
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: `${process.env.DB_DATABASE}_testing`,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    migrations: {
      directory: "./src/database/migrations",
    },
    seeds: {
      directory: "./src/database/seeds",
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
  },
  production: {
    client: "mysql",
    debug: false,
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: `${process.env.DB_DATABASE}_production`,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    migrations: {
      directory: "./src/database/migrations",
    },
  },
};