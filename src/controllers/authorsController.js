const Joi = require("joi");
const { Author } = require("../models/Author");

const authorSchema = Joi.object({
  author_id: Joi.number().integer(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
});

const index = async (ctx) => {
  const author = new Author();
  try {
    const result = await author.all();
    ctx.body = {
      data: {
        authors: result,
      },
    };
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const show = async (ctx) => {
  const { params } = ctx;
  if (!params.id) ctx.throw(400, "Author ID is required");

  // Initialize the Author
  const author = new Author();

  try {
    // Find and show the author
    await author.find(params.id);
    ctx.body = {
      data: {
        author,
      },
    };
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const create = async (ctx) => {
  const request = ctx.request.body;

  const author = new Author(request);
  const validator = authorSchema.validate(author);
  if (validator.error) ctx.throw(400, validator.error.details[0].message);

  try {
    const result = await author.store();
    author.author_id = result.rows[0]["author_id"];
    ctx.body = {
      data: {
        author,
      },
    };
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const update = async (ctx) => {
  const { params } = ctx;
  const request = ctx.request.body;

  if (!params.id) ctx.throw(400, "Author ID is required");

  const author = new Author();
  await author.find(params.id);
  if (!author) ctx.throw(400, "Author not found");

  // Replace the author data with the new updated author data
  author.author_id = params.id;
  author.first_name = request.first_name;
  author.last_name = request.last_name;

  try {
    await author.update();
    ctx.body = { data: { author } };
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const remove = async (ctx) => {
  const { params } = ctx;
  if (!params.id) ctx.throw(400, "Author ID is required");

  const author = new Author();
  await author.find(params.id);
  if (!author) ctx.throw(400, "Author not found");

  try {
    await author.remove();
    ctx.body = { data: {} };
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

module.exports = {
  index,
  show,
  create,
  update,
  remove,
};
