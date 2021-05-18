const mysql = require("promise-mysql");
const environment = process.env.NODE_ENV || "development";
const { connection } = require("../../config.js")[environment];

module.exports = async () => {
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
