import database from "../database";
import { AuthorNameObject, BookWithAuthorObject } from "../utils/declarations";
import escapeString from "../utils/stringUtils";

function getAuthorObject(nameObject: AuthorNameObject) {
  return {
    author_id: nameObject.author_id,
    first_name: nameObject.first_name,
    last_name: nameObject.last_name,
  };
}

class Book {
  book_id;
  title;
  subtitle;
  description;
  isbn_10;
  isbn_13;
  page_count;
  author_id;
  thumbnail_url;
  library_id;

  constructor(props?: BookWithAuthorObject) {
    if (!props) return;

    this.init(props);
  }

  async findByTitle(): Promise<BookWithAuthorObject | undefined> {
    try {
      const { results } = await database.query(
        `SELECT books.book_id,
              books.title,
              books.subtitle,
              books.description,
              books.isbn_10,
              books.isbn_13,
              books.page_count,
              books.thumbnail_url
       FROM books
       WHERE books.title LIKE '%${this.title}%'
       AND library_id = $1
      `,
        [this.library_id]
      );
      if (results.length === 0) {
        return undefined;
      }
      return JSON.parse(JSON.stringify(results[0]));
    } catch (error) {
      throw error;
    }
  }

  async findByIsbn(): Promise<BookWithAuthorObject | undefined> {
    try {
      const { results } = await database.query(
        `SELECT books.book_id,
              books.title,
              books.subtitle,
              books.description,
              books.isbn_10,
              books.isbn_13,
              books.page_count,
              books.thumbnail_url
       FROM books
       WHERE (books.isbn_10 = $1 OR books.isbn_13 = $2)
       AND library_id = $3
      `,
        [this.isbn_10, this.isbn_13, this.library_id]
      );
      if (results.length === 0) {
        return undefined;
      }
      return JSON.parse(JSON.stringify(results[0]));
    } catch (error) {
      throw error;
    }
  }

  async findById(id): Promise<void | undefined> {
    try {
      const { results } = await database.query(
        `SELECT books.book_id,
              books.title,
              books.subtitle,
              books.description,
              books.isbn_10,
              books.isbn_13,
              books.page_count,
              books.thumbnail_url,
              authors.first_name,
              authors.last_name,
              authors.author_id
        FROM books
        INNER JOIN authors ON authors.author_id = books.author_id
        WHERE books.book_id = $1`,
        [id]
      );
      if (results.length === 0) {
        return undefined;
      }
      const result = results[0];
      result.author = getAuthorObject(result);
      this.init(result);
    } catch (error) {
      throw error;
    }
  }

  async all() {
    try {
      const { results } = await database.query(
        `SELECT books.book_id,
                books.title,
                books.subtitle,
                books.description,
                books.isbn_10,
                books.isbn_13,
                books.page_count,
                books.thumbnail_url,
                CONCAT(authors.first_name, ' ', authors.last_name) as author
         FROM books
                  INNER JOIN authors ON authors.author_id = books.author_id
         ORDER BY books.title`
      );
      return JSON.parse(JSON.stringify(results));
    } catch (error) {
      throw error;
    }
  }

  async getBooksFromLibrary(libraryId: number) {
    try {
      const { results } = await database.query(
        `SELECT books.book_id,
                books.title,
                books.subtitle,
                books.description,
                books.isbn_10,
                books.isbn_13,
                books.page_count,
                books.thumbnail_url,
                books.library_id,
                CONCAT(authors.first_name, ' ', authors.last_name) as author
         FROM books
                  INNER JOIN authors ON authors.author_id = books.author_id
         WHERE library_id = $1
         ORDER BY books.title`,
        [libraryId]
      );
      return JSON.parse(JSON.stringify(results));
    } catch (error) {
      throw error;
    }
  }

  async store() {
    try {
      await database.query("START TRANSACTION");
      return await database.query(
        `INSERT INTO books(title, 
                subtitle, 
                description, 
                page_count, 
                isbn_10, 
                isbn_13, 
                author_id, 
                thumbnail_url, 
                library_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING book_id`,
        [
          this.title,
          this.subtitle,
          this.description,
          this.page_count,
          this.isbn_10,
          this.isbn_13,
          this.author_id,
          this.thumbnail_url,
          this.library_id,
        ]
      );
    } catch (error) {
      throw error;
    } finally {
      await database.query("COMMIT");
    }
  }

  async update() {
    try {
      await database.query("START TRANSACTION");
      return await database.query(
        `UPDATE books
         SET title=$1,
             subtitle=$2,
             description=$3,
             page_count=$4,
             isbn_10=$5,
             isbn_13=$6,
             thumbnail_url=$7
         WHERE book_id = $8
         RETURNING *`,
        [
          this.title,
          this.subtitle,
          this.description,
          this.page_count,
          this.isbn_10,
          this.isbn_13,
          this.thumbnail_url,
          this.book_id,
        ]
      );
    } catch (error) {
      await database.query("ROLLBACK");
      throw error;
    } finally {
      await database.query("COMMIT");
    }
  }

  async remove() {
    try {
      await database.query(
        `DELETE
                            FROM books
                            WHERE book_id = $1`,
        [this.book_id]
      );
      await database.query("COMMIT");
      return true;
    } catch (error) {
      await database.query("ROLLBACK");
      throw error;
    }
  }

  init(props: BookWithAuthorObject) {
    this.book_id = props.book_id;
    this.title = escapeString(props.title);
    this.subtitle = escapeString(props.subtitle);
    this.isbn_10 = props.isbn_10;
    this.isbn_13 = props.isbn_13;
    this.description = escapeString(props.description);
    this.page_count = props.page_count;
    this.author_id = props.author.author_id;
    this.thumbnail_url = props.thumbnail_url;
    this.library_id = props.library_id;
  }
}

export { Book };
