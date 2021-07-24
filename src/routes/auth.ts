import * as Router from "@koa/router";
import authController from "../controllers/authController";

const baseUrl = "/api";

export function register(router: Router) {
  router.post(`${baseUrl}/signin`, authController.signIn);
  router.post(`${baseUrl}/signup`, authController.signUp);
  router.put(`${baseUrl}/signout`, authController.signOut);
}
