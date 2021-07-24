import * as Router from "@koa/router";
import { register as bookRoutes } from "./src/routes/books";
import { register as authorRoutes } from "./src/routes/authors";
import { register as thirdPartyApiRoutes } from "./src/routes/thirdPartyApis";
import { register as authorisation } from "./src/routes/auth";

export const router = new Router();

bookRoutes(router);
authorRoutes(router);
thirdPartyApiRoutes(router);
authorisation(router);
