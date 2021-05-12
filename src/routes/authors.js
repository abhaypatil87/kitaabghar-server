const KoaRouter = require("koa-router");
const authorsController = require("../controllers/authorsController");
const router = new KoaRouter();

const baseUrl = "/api";

router.get(`${baseUrl}/authors`, authorsController.index);
router.get(`${baseUrl}/authors/:id`, authorsController.show);
router.post(`${baseUrl}/authors`, authorsController.create);
router.put(`${baseUrl}/authors/:id`, authorsController.update);
router.delete(`${baseUrl}/authors/:id`, authorsController.remove);

module.exports = router;
