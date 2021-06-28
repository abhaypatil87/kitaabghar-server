import * as Router from "@koa/router";
import booksController from "../controllers/booksController";

const baseUrl = "/api";

export function register(router: Router) {
  router.get(`${baseUrl}/books`, booksController.index);
  router.get(`${baseUrl}/books/:id`, booksController.show);
  router.post(`${baseUrl}/books`, booksController.create);
  router.put(`${baseUrl}/books/:id`, booksController.update);
  router.delete(`${baseUrl}/books/:id`, booksController.remove);
}
