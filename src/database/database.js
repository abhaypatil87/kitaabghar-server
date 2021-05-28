const mysql = require("promise-mysql");
const fs = require("fs").promises;
const path = require("path");

const environment = process.env.NODE_ENV || "development";
const { connection, migrations, seeds } =
  require("../../config.js")[environment];

/**
 * @description Read files asynchronously from a folder, with natural sorting
 * @param {String} dir Absolute path to directory
 * @returns {Object[]} List of object, each object represent a file
 * structured like so: `{ name, ext, stat }`
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
 * @param options
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
      const queries = queryFile.split(/;\n\s*/g).filter((q) => q.length > 0);

      console.log(`Executing ${queries.length} queries from ${file}`);
      for (const query of queries) {
        console.log(`Executing query:\n ${query}`);
        await conn.query(query);
      }
    }
  }
};

const initialiseDatabase = async (conn, dbName) => {
  console.log(`Initialising new database ${dbName} with full schema`);
  await executeMultiSqlFilesInDir(migrations.directory, conn);
  console.log(`Schema initialisation complete`);
};

const migrateDatabase = async (conn) => {
  try {
    const scriptNames = await conn.query(
      `SELECT script_name
          FROM database_version
       ORDER BY script_name ASC
      `
    );

    const fileNames = [];
    for (const scriptName of scriptNames) {
      const scriptFileName = JSON.parse(JSON.stringify(scriptName));
      fileNames.push(scriptFileName.script_name);
    }

    await executeMultiSqlFilesInDir(migrations.directory, conn, {
      filter: fileNames,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const runMigrations = async () => {
  console.log(`Running migrations scripts`);
  const conn = await pool();
  try {
    const result = await conn.query(
      `SELECT 1
          FROM information_schema.tables
          WHERE table_schema = ?
          AND table_name = 'database_version'
          LIMIT 1
        `,
      [connection.database]
    );

    /* Verify if we need to run migrations from scratch */
    if (result.length === 0) {
      await initialiseDatabase(conn, connection.database);
    } else {
      /* Run only the necessary scripts */
      await migrateDatabase(conn);
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const seedMigrations = async () => {
  console.log(`Running seed data scripts`);
  if (!seeds.seed) {
    console.log(`Seed flag is set to false. Skipping seeding`);
  } else {
    const conn = await pool();
    await executeMultiSqlFilesInDir(seeds.directory, conn);
  }
  console.log(`Seeding data scripts complete`);
};

const pool = async () => {
  try {
    let pool;
    let conn;
    if (pool) conn = pool.getConnection();
    else {
      pool = await mysql.createPool(connection);
      conn = pool.getConnection();
    }
    return conn;
  } catch (ex) {
    throw ex;
  }
};

module.exports = {
  pool: pool,
  runMigrations: runMigrations,
  seedMigrations: seedMigrations,
};
