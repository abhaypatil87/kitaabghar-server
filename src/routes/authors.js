const KoaRouter = require("koa-router");
const authorsController = require("../controllers/authorsController");
const router = new KoaRouter();

const baseUrl = "/api";

router.get(`${baseUrl}/authors`, authorsController.index);
router.get(`${baseUrl}/authors/:id`, authorsController.show);
// router.post(`${baseUrl}/authors`, jwtMiddleware, create);
// router.put(`${baseUrl}/authors/:id`, jwtMiddleware, update);
// router.delete(`${baseUrl}/authors/:id`, jwtMiddleware, del);

module.exports = router;
