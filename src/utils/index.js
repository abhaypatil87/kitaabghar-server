const request = require("node-fetch");

const fetchGoogleBooksApiResponse = async (searchParams) => {
  const url = new URL("books/v1/volumes", "https://www.googleapis.com");
  let queryString = "";
  if (searchParams.hasOwnProperty("isbn")) {
    queryString = `isbn:${searchParams.isbn}`;
  } else if (searchParams.hasOwnProperty("keywords")) {
    queryString = `${searchParams.keywords}`;
  }
  url.search = new URLSearchParams({ q: queryString }).toString();
  let result;
  try {
    result = await request(url);
    return await result.json();
  } catch (error) {
    throw error;
  }
};

const fetchOpenLibraryApiResponse = async (isbn) => {
  const url = new URL(`isbn/${isbn}.json`, "https://openlibrary.org/");
  let result;
  try {
    result = await request(url);
    return result.json();
  } catch (error) {
    throw error;
  }
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
  return "";
};

const getBooksFromResponse = (response) => {
  if (response) {
    return response.map((item) => {
      const book = {};
      const volumeInfo = item.volumeInfo;
      // Assign basic information
      book.title = getConvertedBookTitle(volumeInfo["title"]);
      book.subtitle = volumeInfo.subtitle || "";
      book.description = volumeInfo.description || "";
      book.page_count = volumeInfo.pageCount || 0;
      if (volumeInfo.imageLinks) {
        book.thumbnail_url = volumeInfo.imageLinks["thumbnail"];
      }

      // Compute ISBN information
      if (volumeInfo.industryIdentifiers) {
        volumeInfo.industryIdentifiers.forEach((identifier) => {
          if (identifier.type.toLowerCase() === "isbn_10") {
            book.isbn_10 = identifier.identifier;
          }
          if (identifier.type.toLowerCase() === "isbn_13") {
            book.isbn_13 = identifier.identifier;
          }
        });
      }

      //Compute Author information
      if (volumeInfo.authors && Array.isArray(volumeInfo.authors)) {
        book.author = volumeInfo.authors[0];
      }
      return book;
    });
  }

  return [];
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
    book.description = volumeInfo.description || "";
    book.page_count = volumeInfo.pageCount || 0;
    book.thumbnail_url = images[0]["thumbnail"] || "";

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
  }
  if (response.openLibrary) {
    const openLibData = response.openLibrary;
    /* Consume the Open Library response */
    if (book.title === "") {
      book.title = getConvertedBookTitle(openLibData.title) || "";
    }
    if (book.subtitle === "") {
      book.subtitle = openLibData.subtitle || "";
    }
    if (book.description === "") {
      if (openLibData.description && openLibData.description.value) {
        book.description = openLibData.description.value || "";
      }
    }

    if (book.page_count === 0) {
      book.page_count = openLibData.number_of_pages || 0;
    }

    if (book.author === "") {
      if (openLibData.by_statement) {
        book.author = getAuthorNameObject(openLibData.by_statement);
      }
    }

    if (!book.isbn_13) {
      if (openLibData.isbn_13 && openLibData.isbn_13.length > 0) {
        book.isbn_13 = openLibData.isbn_13[0];
      }
    }

    if (!book.isbn_10) {
      if (openLibData.isbn_10 && openLibData.isbn_10.length > 0) {
        book.isbn_10 = openLibData.isbn_10[0];
      }
    }
  }

  if (book.thumbnail_url === "") {
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
  getBooksFromResponse,
};
