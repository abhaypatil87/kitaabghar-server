const mysql = require("promise-mysql");
const fs = require("fs");
const path = require("path");

const environment = process.env.NODE_ENV || "development";
const { connection, migrations, seeds } =
  require("../../config.js")[environment];

/**
 * @description Read files synchronously from a folder, with natural sorting
 * @param {String} dir Absolute path to directory
 * @returns {Object[]} List of object, each object represent a file
 * structured like so: `{ name, ext, stat }`
 */
function readFilesSync(dir) {
  const files = [];

  fs.readdirSync(dir).forEach((fileName) => {
    const name = path.parse(fileName).name;
    const ext = path.parse(fileName).ext;
    const filepath = path.resolve(dir, fileName);
    const stat = fs.statSync(filepath);
    const isFile = stat.isFile();

    if (isFile) files.push({ name, ext, stat });
  });

  files.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return files;
}

/**
 * @description Executes SQL files in a given directory using the connection
 * @param dir
 * @param conn
 * @param options
 */
function executeSqlQueriesInDir(dir, conn, options) {
  let filesToFilter = [];
  if (typeof arguments[2] === "object") {
    for (const option of options) {
      if (option === "filter") {
        filesToFilter = [...options["filter"]];
      }
    }
  }
  const files = readFilesSync(dir);

  files.forEach((file) => {
    /* Execute only .sql files */
    if (file.ext.toLowerCase() === ".sql") {
      fs.readFile(
        dir + "/" + file.name + file.ext,
        "utf8",
        async (error, data) => {
          if (error) {
            throw new Error(error.message);
          }
          const queries = data.split(/;\n\s*/g).filter((q) => q.length > 0);
          for (const query of queries) {
            await conn.query(query);
          }
        }
      );
    }
  });
}

const initialiseDatabase = async (conn, dbName) => {
  console.log(`Initialising new database ${dbName} with full schema.`);
  executeSqlQueriesInDir(migrations.directory, conn);
  console.log(`Schema initialisation complete.`);
};

const migrateDatabase = async (conn) => {
  try {
    const result = await conn.query(
      `SELECT script_name
          FROM database_version
        ORDER BY script_name DESC
        `
    );

    const fileNames = [];
    for (const scriptName of result) {
      const scriptFileName = JSON.parse(JSON.stringify(scriptName));
      fileNames.push(scriptFileName.script_name);
    }
    console.log(fileNames);
    executeSqlQueriesInDir(seeds.directory, conn, { filter: fileNames });
    // console.log(JSON.parse(JSON.stringify(result)));
  } catch (error) {}
};

const runMigrations = async () => {
  console.log(`Running migrations scripts.`);
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
  console.log(`Running seed data scripts.`);
  if (!seeds.seed) {
    console.log(`Seed flag is set to false. Skipping seeding.`);
  } else {
    const conn = await pool();
    executeSqlQueriesInDir(seeds.directory, conn);
  }
  console.log(`Seeding data scripts complete.`);
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
