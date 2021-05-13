const Joi = require("joi");

const { Author } = require("../models/Author");

const authorSchema = Joi.object({
  id: Joi.number().integer(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
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
    ctx.throw(400, {
      error: {
        code: 400,
        message: "INVALID_DATA",
      },
    });
  }
};

const show = async (ctx) => {
  const { params } = ctx;
  if (!params.id)
    ctx.throw(400, {
      error: {
        code: 400,
        message: "INVALID_DATA",
      },
    });

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
    ctx.throw(400, {
      error: {
        code: 400,
        message: "INVALID_DATA",
      },
    });
  }
};

const create = async (ctx) => {
  const request = ctx.request.body;

  const author = new Author(request);
  const validator = authorSchema.validate(author);
  if (validator.error) ctx.throw(400, validator.error.details[0].message);

  try {
    const result = await author.store();
    author.id = result.insertId;
    ctx.body = {
      data: {
        author,
      },
    };
  } catch (error) {
    ctx.throw(400, {
      error: {
        code: 400,
        message: "INVALID_DATA",
      },
    });
  }
};

const update = async (ctx) => {
  const { params } = ctx;
  const request = ctx.request.body;

  if (!params.id)
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });

  // Find and set that note
  const author = new Author();
  await author.find(params.id);
  if (!author)
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });

  // Replace the author data with the new updated author data
  author.id = params.id;
  author.firstName = request.firstName;
  author.lastName = request.lastName;

  try {
    await author.update();
    ctx.body = { data: { author } };
  } catch (error) {
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });
  }
};

const remove = async (ctx) => {
  const { params } = ctx;
  if (!params.id)
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });

  const author = new Author();
  await author.find(params.id);
  if (!author)
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });

  try {
    await author.remove();
    ctx.body = { data: {} };
  } catch (error) {
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });
  }
};

module.exports = {
  index,
  show,
  create,
  update,
  remove,
};
