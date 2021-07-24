import { v4 as uuidv4 } from "uuid";
import {
  BookResponse,
  BookWithAuthorName,
  BookWithAuthorObject,
} from "./declarations";

const uuidParse = require("uuid").parse;
const request = require("node-fetch");

const getIntFromUUID = (uuid) => {
  const parsedUuid = uuidParse(uuid);
  const buffer = Buffer.from(parsedUuid);
  return buffer.readUInt32BE(0);
};

export const fetchGoogleBooksApiResponse = async (searchParams) => {
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

export const fetchOpenLibraryApiResponse = async (isbn) => {
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

const getConvertedBookTitle: (title: string) => string = (title: string) => {
  const words = title.split(" ");
  if (words.length === 1) {
    return title;
  }

  let firstWord = words.shift();
  if (
    firstWord &&
    (firstWord.toLowerCase() === "a" ||
      firstWord.toLowerCase() === "an" ||
      firstWord.toLowerCase() === "the")
  ) {
    return words.join(" ") + ", " + firstWord;
  } else {
    return title;
  }
};

export const getBooksFromResponse: (response) => BookWithAuthorName[] = (
  response
) => {
  return response.map((item) => {
    const book = {} as BookWithAuthorName;
    const volumeInfo = item.volumeInfo;
    // assign an ID for uniqueness
    book.book_id = getIntFromUUID(uuidv4());

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
};

export const getBookDataFromResponse = async (response: BookResponse) => {
  const book = {} as BookWithAuthorObject;
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

    if (book.author.first_name === "" && book.author.last_name === "") {
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

const getAuthorNameObject = (author: string) => {
  const names = author.split(" ");
  if (names.length === 1) {
    return {
      first_name: names[0],
      last_name: names[0],
    };
  }
  return {
    first_name: names[0],
    last_name: names[1],
  };
};
