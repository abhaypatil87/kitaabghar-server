import * as Router from "@koa/router";
import authorsController from "../controllers/authorsController";
import { authorisation } from "../middlewares/authorisation";

const baseUrl = "/api";

export function register(router: Router) {
  router.get(`${baseUrl}/authors`, authorisation, authorsController.getAuthors);
  router.get(
    `${baseUrl}/authors/:id`,
    authorisation,
    authorsController.getAuthor
  );
  router.post(
    `${baseUrl}/authors`,
    authorisation,
    authorsController.createAuthor
  );
  router.put(
    `${baseUrl}/authors/:id`,
    authorisation,
    authorsController.updateAuthor
  );
  router.delete(
    `${baseUrl}/authors/:id`,
    authorisation,
    authorsController.removeAuthor
  );
}
