const { SUCCESS } = require("../utils/enums");
const { ThirdPartyApi } = require("../models/ThirdPartyApi");

const getThirdPartyApis = async (ctx) => {
  const thirdPartyApi = new ThirdPartyApi();
  try {
    const result = await thirdPartyApi.all();
    ctx.body = {
      status: SUCCESS,
      message: "",
      data: {
        thirdPartyApis: result,
      },
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.throw(error.message);
  }
};

const updateThirdPartyApis = async (ctx) => {
  const request = ctx.request.body;
  const thirdPartyApi = new ThirdPartyApi();

  try {
    for (const key of Object.keys(request)) {
      await thirdPartyApi.update(key, request[key]);
    }

    const result = await thirdPartyApi.all();

    ctx.body = {
      status: SUCCESS,
      message: "API Settings updated",
      data: {
        thirdPartyApis: result,
      },
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.throw(error.message);
  }
};

const thirdPartyApisController = {
  updateThirdPartyApis,
  getThirdPartyApis,
};

export default thirdPartyApisController;
