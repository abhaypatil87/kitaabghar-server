const Joi = require("joi");
const { SUCCESS } = require("../utils/enums");
const { Author } = require("../models/Author");

const authorSchema = Joi.object({
  author_id: Joi.number().integer(),
  first_name: Joi.string().min(1).max(50).required(),
  last_name: Joi.string().min(1).max(50).required(),
});

const isEmpty = (object) => {
  return Object.keys(object).length === 0 || JSON.stringify(object) === "{}";
};

const verifyParameter = (ctx) => {
  const { params } = ctx;
  if (!params.id) {
    ctx.response.status = 400;
    ctx.throw("Author ID is required");
  }
};

const getAuthors = async (ctx) => {
  const author = new Author();
  try {
    const result = await author.all();
    ctx.body = {
      status: SUCCESS,
      message: "",
      data: {
        authors: result,
      },
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.throw(error.message);
  }
};

const getAuthor = async (ctx) => {
  verifyParameter(ctx);

  const author = new Author();
  await author.find(ctx.params.id);
  if (isEmpty(author)) {
    ctx.response.status = 400;
    throw new Error(`Author with ID ${ctx.params.id} not found`);
  }

  ctx.body = {
    status: SUCCESS,
    message: "",
    data: {
      author,
    },
  };
};

const createAuthor = async (ctx) => {
  const request = ctx.request.body;

  const author = new Author(request);
  const validator = authorSchema.validate(author);
  if (validator.error) {
    ctx.response.status = 400;
    ctx.throw(validator.error.details[0].message);
  }

  try {
    const result = await author.store();
    author.author_id = result.rows[0]["author_id"];
    ctx.body = {
      status: SUCCESS,
      message: "Author created",
      data: {
        author,
      },
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.throw(error.message);
  }
};

const updateAuthor = async (ctx) => {
  verifyParameter(ctx);

  const request = ctx.request.body;

  const author = new Author();
  await author.find(ctx.params.id);
  if (isEmpty(author)) {
    ctx.response.status = 400;
    throw new Error(`Author with ID ${ctx.params.id} not found`);
  }

  // Replace the author data with the new updated author data
  author.author_id = parseInt(ctx.params.id);
  author.first_name = request.first_name;
  author.last_name = request.last_name;

  const validator = authorSchema.validate(author);
  if (validator.error) {
    ctx.response.status = 400;
    ctx.throw(validator.error.details[0].message);
  }

  try {
    await author.update();
    ctx.body = {
      status: SUCCESS,
      message: "Author updated",
      data: author,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.throw(error.message);
  }
};

const removeAuthor = async (ctx) => {
  verifyParameter(ctx);

  const author = new Author();
  await author.find(ctx.params.id);
  if (isEmpty(author)) {
    ctx.response.status = 400;
    throw new Error(`Author with ID ${ctx.params.id} not found`);
  }

  try {
    await author.remove();
    ctx.body = {
      status: SUCCESS,
      message: "Author removed",
      data: {},
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.throw(error.message);
  }
};

const authorController = {
  removeAuthor,
  updateAuthor,
  createAuthor,
  getAuthor,
  getAuthors,
};

export default authorController;
