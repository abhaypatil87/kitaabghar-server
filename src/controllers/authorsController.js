const { Author } = require("../models/Author");

const index = async (ctx) => {
  //const { query } = request;
  const author = new Author();
  try {
    const result = await author.all();
    ctx.body = { data: { authors: result } };
  } catch (error) {
    console.log(error);
  }
};

const show = async (ctx) => {
  const { params } = ctx;
  if (!params.id)
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });

  // Initialize the Author
  const author = new Author();

  try {
    // Find and show the author
    await author.find(params.id);
    ctx.body = { data: { author } };
  } catch (error) {
    ctx.throw(400, { error: { code: 400, message: "INVALID_DATA" } });
  }
};

module.exports = {
  index,
  show,
};
