"use strict";

import * as bunyan from "bunyan";
import environment from "../../config";

const env = process.env.NODE_ENV || "development";
const loggerOptions = {
  name: environment[env].logger.name,
  level: environment[env].logger.level,
};

const bunyanLogger = bunyan.createLogger(loggerOptions);
export default bunyanLogger;
