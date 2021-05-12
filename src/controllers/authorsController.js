const Joi = require("joi");

const { Author } = require("../models/Author");

const authorSchema = Joi.object({
  id: Joi.number().integer(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

const index = async (ctx) => {
  //const { query } = request;
  const author = new Author();
  try {
    const result = await author.all();
    console.log(result);
    ctx.body = {
      data: {
        authors: result,
      },
    };
  } catch (error) {
    console.log(error);
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
  // Add ip
  request.ipAddress = ctx.ip;

  // Create a new author object using the request params
  const author = new Author(request);

  // Validate the newly created author
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
    console.log(error);
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

  // Make sure they've specified a note
  if (!params.id)
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });

  // Find and set that note
  const author = new Author();
  await author.find(params.id);
  if (!author) ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });

  // Replace the author data with the new updated author data
  author.id = params.id;
  author.firstName = request.firstname;
  author.lastName = request.lastname;

  try {
    const result = await author.update();
    author.id = result;
    ctx.body = { data: { author } };
  } catch (error) {
    console.log(error)
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });
  }
};

const remove = async (ctx) => {
  const { params } = ctx;
  if (!params.id)
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });

  // Find that note
  const author = new Author();
  await author.find(params.id);
  if (!author)
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });

  try {
    await author.remove();
    ctx.body = { data: {} };
  } catch (error) {
    logger.error(error);
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
