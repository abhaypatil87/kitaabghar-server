interface User {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  image_url?: string;
  external_id?: number | null;
  user_id: number;
}

interface AuthorNameObject {
  first_name: string;
  last_name: string;
  author_id?: number;
}

interface Book {
  book_id?: number;
  title: string;
  subtitle: string;
  description: string;
  page_count: number;
  thumbnail_url: string;
  isbn_10: string;
  isbn_13: string;
  library_id?: number;
}

interface BookWithAuthorName extends Book {
  author: string;
}

interface BookWithAuthorObject extends Book {
  author: AuthorNameObject;
}

interface VolumeInfo {
  volumeInfo: {
    title: string;
    subtitle: string;
    description: string;
    pageCount: number;
    authors: Array<string>;
    industryIdentifiers: Array<{ type: string; identifier: string }>;
    imageLinks: object;
  };
}

interface GoogleBooksFormat {
  totalItems: number;
  items: Array<VolumeInfo>;
}

interface OpenLibFormat {
  title: string;
  subtitle: string;
  description: { value: string };
  by_statement: string;
  number_of_pages: number;
  isbn_13: string;
  isbn_10: string;
}

interface BookResponse {
  google: GoogleBooksFormat;
  openLibrary: OpenLibFormat;
}

export {
  AuthorNameObject,
  BookWithAuthorObject,
  BookWithAuthorName,
  BookResponse,
  Book,
  GoogleBooksFormat,
  OpenLibFormat,
  VolumeInfo,
  User,
};
