import * as pg from "pg";
import * as path from "path";
import { promises as fs } from "fs";
import bunyanLogger from "../utils/logger";
import environment from "../../config";

const env = process.env.NODE_ENV || "development";
const connection = environment[env].connection;
const migrations = environment[env].migrations;
const seeds = environment[env].seeds;
const logger = bunyanLogger.child({ component: "database" });

const COMMIT = Symbol("COMMIT");
const ROLLBACK = Symbol("ROLLBACK");

interface QueryResult<ResultType = any> {
  results: ResultType[];
  fields: pg.FieldDef[];
}

class Connection {
  constructor(private conn: pg.PoolClient | pg.Client) {}

  async query<Result = any, Input = any>(
    text: string | pg.QueryConfig,
    values?: Input[]
  ): Promise<QueryResult<Result>> {
    let query: pg.QueryConfig<Input[]>;
    if (typeof text === "string") {
      query = { text, values };
    } else {
      query = text;
    }
    try {
      const { rows: results, fields } = await this.conn.query<Result>(query);
      return { results, fields };
    } catch (err) {
      logger.debug("Failed query: %s", query.text);
      throw err;
    }
  }

  async end() {
    await (this.conn as pg.Client).end();
  }

  release() {
    (this.conn as pg.PoolClient).release();
  }
}

class Database {
  private pool;
  private poolPromise;

  constructor() {
    this.pool = null;
    this.poolPromise = null;
  }

  async connect(): Promise<Connection> {
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

    const client = await this.pool.connect();
    return new Connection(client);
  }

  async query(query: string, values?: Array<any>) {
    const conn = await this.connect();
    try {
      return await conn.query(query, values);
    } finally {
      conn.release();
    }
  }

  async runInTransaction(conn: Connection, callbackMethod) {
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

  private async connectAndInitialise() {
    console.log("Inside connectAndInitialise");
    const isProduction = env === "production";
    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
    const connectionConfig = {
      connectionString: isProduction
        ? process.env.DATABASE_URL
        : connectionString,
      ssl: isProduction,
    };

    const client = new pg.Client(connectionConfig);
    await client.connect();
    const conn = new Connection(client);
    try {
      await this.runInTransaction(conn, async () => {
        const result = await client.query(
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
          await seedDatabase(conn);
        }
        return COMMIT;
      });
    } catch (e) {
      throw e;
    } finally {
      await conn.end();
    }

    this.pool = new pg.Pool(connectionConfig);
  }
}

/**
 * @description Read files asynchronously from a folder, with natural sorting
 * @param {String} dir Absolute path to directory
 * @returns {String[]} List of file names, sorted naturally
 */
async function readFiles(dir: string): Promise<string[]> {
  const sqlFiles = [] as Array<string>;
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
}

function isSqlFile(fileName: string) {
  return fileName.toLowerCase().indexOf(".sql") !== -1;
}

/**
 * @description Executes SQL files in a given directory using the connection
 * @param dir
 * @param conn
 * @param options An Object holding the configuration, with below options
 * filter: An array of file names to omit
 */
const executeMultiSqlFilesInDir = async (
  dir,
  conn: Connection,
  options?: object
) => {
  let filesToFilter = [] as Array<string>;
  if (typeof options === "object") {
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

const seedDatabase = async (conn: Connection) => {
  logger.info(`ACTIVITY: seedMigrations. START`);
  if (!seeds.seed) {
    logger.info(
      `ACTIVITY: seedDatabase. SKIPPED. REASON: seeds flag is set to FALSE`
    );
  } else {
    await executeMultiSqlFilesInDir(seeds.directory, conn);
  }
  logger.info(`ACTIVITY: seedMigrations. END`);
};

const migrateDatabase = async (conn: Connection) => {
  logger.info(`ACTIVITY: migrateDatabase. START`);
  try {
    const { results } = await conn.query(
      `SELECT script_name
       FROM database_version
       ORDER BY script_name
      `
    );
    const fileNames = [] as Array<string>;
    for (const row of results) {
      const script = JSON.parse(JSON.stringify(row));
      fileNames.push(script.script_name);
    }

    await executeMultiSqlFilesInDir(migrations.directory, conn, {
      filter: fileNames,
    });
  } catch (error) {
    throw new Error(error.message);
  } finally {
    logger.info(`ACTIVITY: migrateDatabase. END`);
  }
};

const initialiseDatabase = async (conn: Connection, dbName: string) => {
  logger.info(
    `ACTIVITY: initialiseDatabase. START. Initialising a new database ${dbName} with full schema`
  );
  await executeMultiSqlFilesInDir(migrations.directory, conn);
  logger.info(`ACTIVITY: initialiseDatabase. END.`);
};

const database = new Database();
export default database;
