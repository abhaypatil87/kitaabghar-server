import * as Router from "@koa/router";
import thirdPartyApisController from "../controllers/thirdPartyApisController";

const baseUrl = "/api";

export function register(router: Router) {
  router.get(
    `${baseUrl}/third_party_apis`,
    thirdPartyApisController.getThirdPartyApis
  );
  router.put(
    `${baseUrl}/third_party_apis`,
    thirdPartyApisController.updateThirdPartyApis
  );
}
