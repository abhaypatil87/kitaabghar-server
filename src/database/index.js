const pg = require("pg");
const path = require("path");
const fs = require("fs").promises;
const Logger = require("../utils/logger");

const environment = process.env.NODE_ENV || "development";
const { connection, migrations, seeds } = require("../../config")[environment];

const logger = Logger.child({ component: "database" });

const COMMIT = Symbol("COMMIT");
const ROLLBACK = Symbol("ROLLBACK");

class Database {
  pool;
  poolPromise;

  constructor() {
    this.pool = null;
    this.poolPromise = null;
  }

  async connect() {
    if (this.pool === null) {
      if (this.poolPromise === null) {
        this.poolPromise = this.connectAndInitialise();
      }

      await this.poolPromise;
      this.poolPromise = null;
      if (this.pool === null) {
        logger.fatal(
          "Database initialization passed but did not create a pool!"
        );
        throw new Error("Database pool failed to initialize!");
      }
    }

    return await this.pool.connect();
  }

  async query(text, values) {
    const conn = await this.connect();
    try {
      return await conn.query(text, values);
    } finally {
      conn.release();
    }
  }

  async runInTransaction(conn, callbackMethod) {
    let releaseConnection = false;
    if (conn === null) {
      conn = await this.connect();
      releaseConnection = true;
    }

    let doCommit = false;
    try {
      logger.trace("Starting transaction.");
      await conn.query("START TRANSACTION");
      const result = await callbackMethod(conn);
      logger.trace("Transaction completed without exception: %s", result);
      doCommit = result === COMMIT;
    } finally {
      const action = doCommit ? "COMMIT" : "ROLLBACK";
      try {
        await conn.query(action);
        logger.trace("Transaction %j succeeded", action);
      } catch (err) {
        logger.error(err, "Failed to %s transaction!", action);
        if (releaseConnection) {
          await conn.end();
          releaseConnection = false;
        }
      } finally {
        if (releaseConnection) {
          conn.release();
        }
      }
    }
  }

  async connectAndInitialise() {
    try {
      const conn = new pg.Client(connection);
      await conn.connect();
      //const conn = new Connection(client);
      await this.runInTransaction(conn, async () => {
        const result = await conn.query(
          `
            SELECT 1
            FROM information_schema.tables
            WHERE table_catalog = $1
              AND table_schema = 'public'
              AND table_name = 'database_version'
            LIMIT 1
        `,
          [connection.database]
        );

        if (result.rowCount === 0) {
          await initialiseDatabase(conn, connection.database);
        } else {
          /* Run only the necessary scripts */
          await migrateDatabase(conn);
        }

        if (seeds.seed) {
          await seedMigrations(conn);
        }
        return COMMIT;
      });
    } catch (e) {
      throw e;
    }

    this.pool = new pg.Pool(connection);
  }
}

/**
 * @description Read files asynchronously from a folder, with natural sorting
 * @param {String} dir Absolute path to directory
 * @returns {String[]} List of file names, sorted naturally
 */
const readFiles = async (dir) => {
  const sqlFiles = [];
  const files = await fs.readdir(dir);

  for (const file of files) {
    if (isSqlFile(file)) {
      sqlFiles.push(file);
    }
  }

  sqlFiles.sort((a, b) => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return sqlFiles;
};

const isSqlFile = (fileName) => {
  return fileName.toLowerCase().indexOf(".sql") !== -1;
};

/**
 * @description Executes SQL files in a given directory using the connection
 * @param dir
 * @param conn
 * @param options An Object holding the configuration, with below options
 * filter: An array of file names to omit
 */
const executeMultiSqlFilesInDir = async (dir, conn, options) => {
  let filesToFilter = [];
  if (typeof arguments[2] === "object") {
    for (const property in options) {
      if (property === "filter") {
        filesToFilter = [...options["filter"]];
      }
    }
  }

  const files = await readFiles(dir);
  for (const file of files) {
    if (!filesToFilter.includes(file)) {
      const queryFile = await fs.readFile(path.resolve(dir, file), {
        encoding: "utf8",
      });
      const queries = queryFile.split(/;;\n\s*/g).filter((q) => q.length > 0);
      for (const query of queries) {
        logger.info(`Executing query:\n ${query}`);
        await conn.query(query);
      }
    }
  }
};

const seedMigrations = async (connection) => {
  logger.info(`ACTIVITY: seedMigrations. START`);
  if (!seeds.seed) {
    logger.info(
      `ACTIVITY: seedMigrations. SKIPPED. REASON: seeds flag is set to FALSE`
    );
  } else {
    await executeMultiSqlFilesInDir(seeds.directory, connection);
  }
  logger.info(`ACTIVITY: seedMigrations. END`);
};

const migrateDatabase = async (conn) => {
  try {
    const result = await conn.query(
      `SELECT script_name
       FROM database_version
       ORDER BY script_name
      `
    );
    const fileNames = [];
    for (const row of result.rows) {
      const script = JSON.parse(JSON.stringify(row));
      fileNames.push(script.script_name);
    }

    await executeMultiSqlFilesInDir(migrations.directory, conn, {
      filter: fileNames,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const initialiseDatabase = async (conn, dbName) => {
  logger.info(
    `ACTIVITY: initialiseDatabase. START. Initialising a new database ${dbName} with full schema`
  );
  await executeMultiSqlFilesInDir(migrations.directory, conn);
  logger.info(`ACTIVITY: initialiseDatabase. END.`);
};

const database = new Database();
module.exports = {
  database: database,
};
