import * as Router from "@koa/router";
import { register as bookRoutes } from "./src/routes/books";
import { register as authorRoutes } from "./src/routes/authors";

export const router = new Router();

bookRoutes(router);
authorRoutes(router);
