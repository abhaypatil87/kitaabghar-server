const Joi = require("joi");
const { getOrCreateAuthor } = require("../models/Author");
const { Book } = require("../models/Book");
const {
  fetchGoogleBooksApiResponse,
  fetchOpenLibraryApiResponse,
  getBookDataFromResponse,
} = require("../utils/index");

const bookSchema = Joi.object({
  book_id: Joi.number().integer(),
  title: Joi.string().required(),
  subtitle: Joi.any(),
  isbn_10: Joi.string(),
  isbn_13: Joi.string(),
  description: Joi.string(),
  page_count: Joi.number(),
  author_id: Joi.number().required(),
  thumbnail_url: Joi.string(),
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
  if (!params.id) ctx.throw(400, "Book ID is required");

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

  let olBooksResp;
  let gBooksResp;
  try {
    gBooksResp = await fetchGoogleBooksApiResponse(request.isbn);
  } catch (e) {
    ctx.response.status = 500;
    ctx.throw(
      500,
      "Error occurred while fetching data from GoogleBooks API. Please try to disable fetching data from GoogleBooks and try again."
    );
  }

  try {
    olBooksResp = await fetchOpenLibraryApiResponse(request.isbn);
  } catch (e) {
    ctx.response.status = 500;
    ctx.throw(
      500,
      "Error occurred while fetching data from OpenLibrary API. Please try to disable fetching data from OpenLibrary and try again."
    );
  }

  const response = {
    google: gBooksResp,
    openLibrary: olBooksResp,
  };

  const bookData = await getBookDataFromResponse(response);
  const authorResult = await getOrCreateAuthor(bookData.author);

  bookData.author_id = authorResult.author_id;
  const book = new Book(bookData);
  const validator = bookSchema.validate(book);
  if (validator.error) {
    ctx.throw(400, validator.error);
  }

  try {
    const result = await book.store();
    book.book_id = result.rows[0]["book_id"];
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

  book.book_id = params.id;
  book.title = request.title;
  book.subtitle = request.subtitle;
  book.description = request.description;
  book.isbn_10 = request.isbn_10;
  book.isbn_13 = request.isbn_13;
  book.page_count = request.page_count;
  book.author_id = request.author_id;
  book.thumbnail_url = request.thumbnail_url;

  try {
    await book.update();
    ctx.body = { data: { book: book } };
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
