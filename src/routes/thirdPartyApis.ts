import * as Router from "@koa/router";
import thirdPartyApisController from "../controllers/thirdPartyApisController";
import { authorisation } from "../middlewares/authorisation";

const baseUrl = "/api";

export function register(router: Router) {
  router.get(
    `${baseUrl}/third_party_apis`,
    authorisation,
    thirdPartyApisController.getThirdPartyApis
  );
  router.put(
    `${baseUrl}/third_party_apis`,
    authorisation,
    thirdPartyApisController.updateThirdPartyApis
  );
}
