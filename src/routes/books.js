const KoaRouter = require("koa-router");
const booksController = require("../controllers/booksController");
const router = new KoaRouter();

const baseUrl = "/api";

router.get(`${baseUrl}/books`, booksController.index);
router.get(`${baseUrl}/books/:id`, booksController.show);
router.post(`${baseUrl}/books`, booksController.create);
router.put(`${baseUrl}/books/:id`, booksController.update);
router.delete(`${baseUrl}/books/:id`, booksController.remove);

module.exports = router;
