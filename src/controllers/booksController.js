const Joi = require("joi");
const { getOrCreateAuthor } = require("../models/Author");
const { Book } = require("../models/Book");
const {
  fetchGoogleBooksApiResponse,
  fetchOpenLibraryApiResponse,
  getBookDataFromResponse,
} = require("../lib");

const bookSchema = Joi.object({
  id: Joi.number().integer(),
  title: Joi.string().required(),
  subtitle: Joi.any(),
  isbn10: Joi.string(),
  isbn13: Joi.string(),
  description: Joi.string(),
  pageCount: Joi.number(),
  authorId: Joi.number().required(),
});

const index = async (ctx) => {
  const book = new Book();
  try {
    const result = await book.all();
    ctx.body = {
      data: {
        books: result,
      },
    };
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const show = async (ctx) => {
  const { params } = ctx;
  if (!params.id) ctx.throw(400, "Book ID is required to show details");

  // Initialize the Book
  const book = new Book();

  try {
    // Find and show the book
    await book.find(params.id);
    ctx.body = {
      data: {
        book: book,
      },
    };
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const create = async (ctx) => {
  const request = ctx.request.body;
  if (!request.isbn) {
    ctx.throw(400, "A 13 or 10 digit ISBN is required to create a book");
  }

  const gBooksResp = await fetchGoogleBooksApiResponse(request.isbn);
  const olBooksResp = await fetchOpenLibraryApiResponse(request.isbn);
  const bookData = getBookDataFromResponse(gBooksResp, olBooksResp);
  const author = await getOrCreateAuthor(bookData.author);

  bookData.authorId = author.id;
  const book = new Book(bookData);
  const validator = bookSchema.validate(book);
  if (validator.error) {
    console.log(validator.error.details);
    ctx.throw(400, validator.error);
  }

  try {
    const result = await book.store();
    book.id = result.insertId;
    ctx.body = {
      data: {
        book: book,
      },
    };
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const update = async (ctx) => {
  const { params } = ctx;
  const request = ctx.request.body;

  if (!params.id) ctx.throw("Book ID is required");

  const book = new Book();
  await book.find(params.id);
  if (!book) ctx.throw(`No book found with provided ID=${params.id}`);

  // Replace the author data with the new updated author data
  book.id = params.id;
  book.firstName = request.firstName;
  book.lastName = request.lastName;

  try {
    await book.update();
    ctx.body = { data: { author: book } };
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const remove = async (ctx) => {
  const { params } = ctx;
  if (!params.id) ctx.throw(400, "Book ID is required");

  const book = new Book();
  await book.find(params.id);
  if (!book) ctx.throw(400, `No book found with provided ID=${params.id}`);

  try {
    await book.remove();
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
