require("dotenv").config();
import * as Koa from "koa";
import * as cors from "@koa/cors";
import { userAgent } from "koa-useragent";

import database from "./src/database";
import { router } from "./router";
import { ERROR } from "./src/utils/enums";
import bunyanLogger from "./src/utils/logger";

const port = process.env.PORT || 4000;
const app = new Koa();
const logger = bunyanLogger.child({ component: "index" });

app.use(async function responseTime(ctx, next) {
  const t1 = Date.now();
  await next();
  const t2 = Date.now();
  ctx.set("X-Response-Time", `${Math.ceil(t2 - t1)}ms`);
});

// For cors with options
app.use(
  cors({
    origin: "*",
  })
);

// For useragent detection
app.use(userAgent);

// For managing body. We're only allowing json.
app.use(require("koa-bodyparser")());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    ctx.body = {
      status: ERROR,
      message: err.message,
      data: {},
    };
    ctx.app.emit("error", err, ctx);
  }
});

app.use(require("koa-bodyparser")());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(port, async () => {
  await database.connect();
  await logger.info(`Library Server listening on port ${port}`);
});
