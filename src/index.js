require("dotenv").config();
const koa = require("koa");
const koaBodyParser = require("koa-bodyparser");
const { userAgent } = require("koa-useragent");
const cors = require("kcors");
const authorsRouter = require("./routes/authors");

const port = process.env.PORT || 4000;

const app = new koa();
app.use(async function responseTime(ctx, next) {
  const t1 = Date.now();
  await next();
  const t2 = Date.now();
  ctx.set("X-Response-Time", `${Math.ceil(t2 - t1)}ms`);
});

// For cors with options
app.use(cors({ origin: "*" }));

// For useragent detection
app.use(userAgent);

// For managing body. We're only allowing json.
app.use(koaBodyParser({ enableTypes: ["json"] }));

app.use(authorsRouter.routes());

app.listen(port, () => {
  console.log(`Library Server listening on port ${port}`);
});
