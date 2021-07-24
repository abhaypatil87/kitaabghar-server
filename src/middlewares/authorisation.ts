import * as jwt from "jsonwebtoken";

const authorisation = async (ctx, next) => {
  const { request } = ctx;
  if (request.headers["authorization"]) {
    try {
      let authorization = request.headers["authorization"].split(" ");
      if (authorization[0] !== "Bearer") {
        ctx.response.status = 401;
        ctx.throw("Missing Bearer token");
      } else {
        request.jwt = jwt.verify(authorization[1], process.env.JWT_SECRET);
        return next();
      }
    } catch (error) {
      ctx.response.status = 403;
      ctx.throw("Invalid Bearer token. Access denied.");
    }
  } else {
    ctx.response.status = 401;
    ctx.throw("Authentication failed. Access denied.");
  }
};

export { authorisation };
