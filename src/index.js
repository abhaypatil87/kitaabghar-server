require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const authorsRouter = require("./routes/authors");

const port = process.env.PORT || 4000;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(authorsRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.listen(port, () => {
  console.log(`Library Server listening on port ${port}`);
});
