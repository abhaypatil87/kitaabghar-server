"use strict";

const bunyan = require("bunyan");
const environment = process.env.NODE_ENV || "development";
const { logger } = require("../../config")[environment];

const loggerOptions = {
  name: logger.name,
  level: logger.level,
};

const bunyanLogger = bunyan.createLogger(loggerOptions);
module.exports = bunyanLogger;
