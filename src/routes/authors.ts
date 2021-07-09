import * as Router from "@koa/router";
import authorsController from "../controllers/authorsController";

const baseUrl = "/api";

export function register(router: Router) {
  router.get(`${baseUrl}/authors`, authorsController.getAuthors);
  router.get(`${baseUrl}/authors/:id`, authorsController.getAuthor);
  router.post(`${baseUrl}/authors`, authorsController.createAuthor);
  router.put(`${baseUrl}/authors/:id`, authorsController.updateAuthor);
  router.delete(`${baseUrl}/authors/:id`, authorsController.removeAuthor);
}
