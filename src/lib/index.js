const fetch = require("node-fetch");

const fetchGoogleBooksApiResponse = async (isbn) => {
  const THIRD_PARTY_URL = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  const response = await fetch(THIRD_PARTY_URL);
  return await response.json();
};

const fetchOpenLibraryApiResponse = async (isbn) => {
  const THIRD_PARTY_URL = `https://openlibrary.org/isbn/${isbn}.json`;
  const response = await fetch(THIRD_PARTY_URL);
  if (response.headers.get("content-type") === "application/json") {
    return await response.json();
  } else {
    throw new Error(
      "No data received from the OpenLibrary API Server. Please check the ISBN."
    );
  }
};

const getBookDataFromResponse = (gBooksResp, openLibResp) => {
  const book = {};
  /* Consume the Google Books API response */
  if (gBooksResp.totalItems > 0) {
    const volumeInfo = gBooksResp.items[0].volumeInfo;

    // Assign basic information
    book.title = volumeInfo.title || "";
    book.subtitle = volumeInfo.subtitle || "";
    book.description = volumeInfo.description;
    book.page_count = volumeInfo.pageCount;

    // Compute ISBN information
    volumeInfo.industryIdentifiers.forEach((identifier) => {
      if (identifier.type.toLowerCase() === "isbn_10") {
        book.isbn10 = identifier.identifier;
      }
      if (identifier.type.toLowerCase() === "isbn_13") {
        book.isbn13 = identifier.identifier;
      }
    });

    //Compute Author information
    if (volumeInfo.authors.length > 0) {
      const authorName = volumeInfo.authors[0];
      const names = authorName.split(" ");
      book.author = {};
      book.author.firstName = names[0];
      book.author.lastName = names[1];
    }
  } else {
    /* Consume the Open Library response */
    book.title = openLibResp.title || "";
    book.subtitle = openLibResp.subtitle || "";
    if (openLibResp.description && openLibResp.description.value) {
      book.description = openLibResp.description.value || "";
    }
    book.page_count = openLibResp.number_of_pages || "";
  }

  if (!book.isbn13) {
    if (openLibResp.isbn_13 !== undefined && openLibResp.isbn_13.length > 0) {
      book.isbn13 = openLibResp.isbn_13[0];
    }
  }

  if (!book.isbn10) {
    if (openLibResp.isbn_10 !== undefined && openLibResp.isbn_10.length > 0) {
      book.isbn10 = openLibResp.isbn_10[0];
    }
  }
  return book;
};
module.exports = {
  fetchGoogleBooksApiResponse,
  fetchOpenLibraryApiResponse,
  getBookDataFromResponse,
};
