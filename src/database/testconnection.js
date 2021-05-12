let mysql = require("mysql");

let connection = mysql.createConnection({
  host: "localhost",
  user: "api_user",
  password: "password",
  database: "home_library",
});

connection.connect(function (err) {
  if (err) {
    return console.error("error: " + err.message);
  }

  console.log("Connected to the MySQL server.");
});
