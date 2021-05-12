const environment = process.env.NODE_ENV || "development";
const mysql = require("promise-mysql");
const config = require("../../config.js")[environment];

module.exports = async () => {
  try {
    let pool;
    let connection;
    if (pool) connection = pool.getConnection();
    else {
      pool = await mysql.createPool(config.connection);
      connection = pool.getConnection();
    }
    return connection;
  } catch (ex) {
    throw ex;
  }
};
