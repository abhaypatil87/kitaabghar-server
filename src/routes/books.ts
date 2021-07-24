import * as Router from "@koa/router";
import booksController from "../controllers/booksController";
import { authorisation } from "../middlewares/authorisation";

const baseUrl = "/api";

export function register(router: Router) {
  router.get(`${baseUrl}/books`, authorisation, booksController.index);
  router.get(`${baseUrl}/books/:id`, authorisation, booksController.show);
  router.post(`${baseUrl}/books`, authorisation, booksController.create);
  router.put(`${baseUrl}/books/:id`, authorisation, booksController.update);
  router.delete(`${baseUrl}/books/:id`, authorisation, booksController.remove);
}
