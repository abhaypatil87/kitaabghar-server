const request = require("node-fetch");

const fetchGoogleBooksApiResponse = async (isbn) => {
  const url = new URL("books/v1/volumes", "https://www.googleapis.com");
  url.search = new URLSearchParams({ q: `isbn:${isbn}` }).toString();
  let result;
  let data;
  try {
    result = await request(url);
    data = await result.json();
  } catch (error) {
    throw error;
  }

  return data;
};

const fetchOpenLibraryApiResponse = async (isbn) => {
  const url = new URL(`isbn/${isbn}.json`, "https://openlibrary.org/");
  let result;
  let data;
  try {
    result = await request(url);
    data = result.json();
  } catch (error) {
    throw error;
  }
  return data;
};

const getEndpoint = (isbn, size) => `/b/isbn/${isbn}-${size}.jpg`;

const fetchOpenLibraryBookCover = async (isbn) => {
  const url = new URL(getEndpoint(isbn, "M"), "http://covers.openlibrary.org");
  url.search = "?default=false";
  try {
    const response = await request(url.toString(), {
      method: "GET",
      redirect: "manual",
    });
    switch (response.status) {
      case 302: {
        return response.headers.get("location");
      }
      case 404:
        return null;
    }
  } catch (e) {
    throw e;
  }
};
const getConvertedBookTitle = (title) => {
  if (title !== null && title !== undefined) {
    let words = title.split(" ");
    let firstWord = words.shift().toLowerCase();
    if (firstWord === "a" || firstWord === "an" || firstWord === "the") {
      return words.join(" ") + ", " + firstWord;
    } else {
      return title;
    }
  }
};

const getBookDataFromResponse = async (response) => {
  const book = {};
  /* Consume the Google Books API response */
  if (response.google && response.google.totalItems > 0) {
    const volumeInfo = response.google.items[0].volumeInfo;
    const images = response.google.items
      .map((item) => item.volumeInfo && item.volumeInfo.imageLinks)
      .filter((a) => !!a);

    // Assign basic information
    book.title = getConvertedBookTitle(volumeInfo.title) || "";
    book.subtitle = volumeInfo.subtitle || "";
    book.description = volumeInfo.description;
    book.page_count = volumeInfo.pageCount;
    book.thumbnail_url = images[0]["thumbnail"];

    // Compute ISBN information
    volumeInfo.industryIdentifiers.forEach((identifier) => {
      if (identifier.type.toLowerCase() === "isbn_10") {
        book.isbn_10 = identifier.identifier;
      }
      if (identifier.type.toLowerCase() === "isbn_13") {
        book.isbn_13 = identifier.identifier;
      }
    });

    //Compute Author information
    if (volumeInfo.authors && volumeInfo.authors.length > 0) {
      const authorName = volumeInfo.authors[0];
      book.author = getAuthorNameObject(authorName);
    }
  } else {
    /* Consume the Open Library response */
    book.title = response.openLibrary.title || "";
    book.subtitle = response.openLibrary.subtitle || "";
    if (
      response.openLibrary.description &&
      response.openLibrary.description.value
    ) {
      book.description = response.openLibrary.description.value || "";
    }
    book.page_count = response.openLibrary.number_of_pages || "";

    if (response.openLibrary.by_statement) {
      book.author = getAuthorNameObject(response.openLibrary.by_statement);
    }
  }

  if (!book.isbn_13) {
    if (
      response.openLibrary.isbn_13 &&
      response.openLibrary.isbn_13.length > 0
    ) {
      book.isbn_13 = response.openLibrary.isbn_13[0];
    }
  }

  if (!book.isbn_10) {
    if (
      response.openLibrary.isbn_10 &&
      response.openLibrary.isbn_10.length > 0
    ) {
      book.isbn_10 = response.openLibrary.isbn_10[0];
    }
  }

  if (!book.thumbnail_url) {
    let bookCover13 = await fetchOpenLibraryBookCover(book.isbn_13);
    let bookCover10 = await fetchOpenLibraryBookCover(book.isbn_10);

    book.thumbnail_url = bookCover13
      ? bookCover13
      : bookCover10
      ? bookCover10
      : "";
  }
  return book;
};

const getAuthorNameObject = (author) => {
  const names = author.split(" ");
  return {
    first_name: names[0],
    last_name: names[1],
  };
};
module.exports = {
  fetchGoogleBooksApiResponse,
  fetchOpenLibraryApiResponse,
  getBookDataFromResponse,
};
