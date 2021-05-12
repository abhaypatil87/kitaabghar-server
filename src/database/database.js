const environment = process.env.NODE_ENV || "development";
const config = require("../../knexfile.js")[environment];
const database = require("knex")({
  client: "mysql",
  debug: false,
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  pool: {
    min: 1,
    max: 3,
    afterCreate: (conn, done) => {
      conn.query("select 1+1 as result;", (error) => {
        if (error) {
        }
        done(conn);
      });
    },
  },
});

// const test = async () => {
//   try {
//     const user = await database.raw("select version();");
//     if (!user) {
//       throw new Error(" user does not exist");
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };
// test();
module.exports = database;
