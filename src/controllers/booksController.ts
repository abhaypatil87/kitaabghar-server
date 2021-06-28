import { BookResponse, BookWithAuthorName } from "../utils/declarations";

import * as Joi from "joi";
import { SUCCESS } from "../utils/enums";
import { getOrCreateAuthor } from "../models/Author";
import { Book } from "../models/Book";
import {
  fetchGoogleBooksApiResponse,
  fetchOpenLibraryApiResponse,
  getBookDataFromResponse,
  getBooksFromResponse,
} from "../utils";

const bookSchema = Joi.object({
  book_id: Joi.number().integer(),
  title: Joi.string().required(),
  subtitle: Joi.string().allow("", null),
  isbn_10: Joi.string(),
  isbn_13: Joi.string(),
  description: Joi.string().allow("", null),
  page_count: Joi.number().allow("", null),
  author_id: Joi.number().required(),
  thumbnail_url: Joi.string().allow("", null),
});

const isEmpty = (object) => {
  return Object.keys(object).length === 0 || JSON.stringify(object) === "{}";
};

const verifyParameter = (ctx) => {
  const { params } = ctx;
  if (!params.id) {
    ctx.response.status = 400;
    ctx.throw("Book ID is required");
  }
};

const index = async (ctx) => {
  const query = ctx.query;
  if (query.keywords) {
    let gBooksResp;
    try {
      gBooksResp = await fetchGoogleBooksApiResponse({
        keywords: query.keywords,
      });
      if (gBooksResp.totalItems > 0) {
        const response =
          gBooksResp.totalItems > 10
            ? gBooksResp.items.slice(0, 10)
            : gBooksResp.items;

        const bookData: BookWithAuthorName[] = getBooksFromResponse(response);
        ctx.body = {
          status: SUCCESS,
          message: `Found ${bookData.length} matching results`,
          data: {
            books: bookData,
          },
        };
      }
    } catch (e) {
      ctx.response.status = 500;
      ctx.throw("Error occurred while fetching data from GoogleBooks API");
    }
  } else {
    const book = new Book();
    try {
      const result = await book.all();
      ctx.body = {
        status: SUCCESS,
        message: "",
        data: {
          books: result,
        },
      };
    } catch (error) {
      ctx.response.status = 400;
      ctx.throw(error.message);
    }
  }
};

const show = async (ctx) => {
  verifyParameter(ctx);

  const book = new Book();
  await book.find(ctx.params.id);

  if (isEmpty(book)) {
    ctx.response.status = 400;
    throw new Error(`Book with ID ${ctx.params.id} not found`);
  }

  ctx.body = {
    status: SUCCESS,
    message: "",
    data: {
      book,
    },
  };
};

async function createBook(bookData, ctx) {
  const book = new Book(bookData);
  const validator = bookSchema.validate(book);
  if (validator.error) {
    ctx.response.status = 400;
    ctx.throw(validator.error.details[0].message);
  }

  try {
    const result = await book.store();
    book.book_id = result.rows[0]["book_id"];
    ctx.body = {
      status: SUCCESS,
      message: `The book '${book.title}' has been added into the library`,
      data: {
        book,
      },
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.throw(error.message);
  }
}

const create = async (ctx) => {
  const request = ctx.request.body;
  /* create a book by third party lookup */
  if (request.hasOwnProperty("isbn")) {
    let olBooksResp;
    let gBooksResp;
    try {
      gBooksResp = await fetchGoogleBooksApiResponse({ isbn: request.isbn });
    } catch (e) {
      ctx.response.status = 500;
      ctx.throw(
        "Error occurred while fetching data from GoogleBooks API. Please try to disable fetching data from GoogleBooks and try again."
      );
    }

    try {
      olBooksResp = await fetchOpenLibraryApiResponse(request.isbn);
    } catch (e) {
      ctx.response.status = 500;
      ctx.throw(
        "Error occurred while fetching data from OpenLibrary API. Please try to disable fetching data from OpenLibrary and try again."
      );
    }

    const response = {} as BookResponse;

    if (gBooksResp.totalItems > 0) {
      response.google = gBooksResp;
    }
    if (olBooksResp) {
      response.openLibrary = olBooksResp;
    }

    const bookData = await getBookDataFromResponse(response);
    const authorResult = await getOrCreateAuthor(bookData.author);
    bookData.author.author_id = authorResult.author_id;
    await createBook(bookData, ctx);
  } else if (
    request.hasOwnProperty("isbn_10") ||
    request.hasOwnProperty("isbn_13")
  ) {
    /* Or, create with a manual entry */
    const bookData = request;
    const names = bookData.author.split(" ");
    bookData.author = {};
    bookData.author.first_name = names[0];
    bookData.author.last_name = names[1];
    const authorResult = await getOrCreateAuthor(bookData.author);
    bookData.author.author_id = authorResult.author_id;

    await createBook(bookData, ctx);
  } else {
    ctx.response.status = 400;
    ctx.throw("A 13 or 10 digit ISBN is required to create a book");
  }
};

const update = async (ctx) => {
  verifyParameter(ctx);

  const { params } = ctx;
  const request = ctx.request.body;

  const book = new Book();
  await book.find(params.id);
  if (isEmpty(book)) {
    ctx.throw(`Book with ID ${params.id} not found`);
  }

  book.book_id = params.id;
  book.title = request.title;
  book.subtitle = request.subtitle;
  book.description = request.description;
  book.isbn_10 = request.isbn_10;
  book.isbn_13 = request.isbn_13;
  book.page_count = request.page_count;
  book.thumbnail_url = request.thumbnail_url;

  try {
    const result = await book.update();
    if (result.rowCount > 0) {
      const updatedBook = JSON.parse(JSON.stringify(result.rows[0]));
      ctx.body = {
        status: SUCCESS,
        message: `The book '${updatedBook.title}' has been updated`,
        data: {
          book: updatedBook,
        },
      };
    } else {
      ctx.response.status = 400;
      ctx.throw(
        "Unknown error occurred while updating the record. No rows returned."
      );
    }
  } catch (error) {
    ctx.response.status = 400;
    ctx.throw(error.message);
  }
};

const remove = async (ctx) => {
  verifyParameter(ctx);

  const { params } = ctx;
  const book = new Book();
  await book.find(params.id);
  if (isEmpty(book)) {
    ctx.response.status = 400;
    throw new Error(`Book with ID ${ctx.params.id} not found`);
  }

  try {
    const bookTitle = book.title;
    await book.remove();
    ctx.body = {
      status: SUCCESS,
      message: `The book '${bookTitle}' has been removed from the library`,
      data: {},
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.throw(error.message);
  }
};

const booksController = {
  index,
  show,
  create,
  update,
  remove,
};

export default booksController;
