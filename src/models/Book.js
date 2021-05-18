const pool = require("../database/database");

const findById = async (id) => {
  let connection = await pool();
  try {
    let book = await connection.query(
      `SELECT
         books.book_id as id,
         books.title,
         books.subtitle,
         books.description,
         books.isbn_10 as isbn10,
         books.isbn_13 as isbn13,
         books.page_count as pageCount,
         authors.firstname as firstName,
         authors.lastname as lastName
       FROM books
              INNER JOIN authors ON authors.author_id = books.author_id
       WHERE books.book_id = ?
      `,
      [id]
    );
    return JSON.parse(JSON.stringify(book[0]));
  } catch (error) {
    throw new Error(error.message);
  }
};

class Book {
  id;
  title;
  subtitle;
  description;
  isbn10;
  isbn13;
  pageCount;
  authorId;

  constructor(props) {
    if (!props) return;

    this.init(props);
  }

  async find(id) {
    try {
      const result = await findById(id);
      if (!result) return {};
      this.init(result);
    } catch (error) {
      throw error;
    }
  }

  async all() {
    let connection = await pool();
    try {
      let books = await connection.query(
        `SELECT 
            books.book_id as id,
            books.title,
            books.subtitle,
            books.description,
            books.isbn_10 as isbn10,
            books.isbn_13 as isbn13,
            books.page_count as pageCount,
            authors.firstname as firstName,
            authors.lastname as lastName
        FROM books
        INNER JOIN authors ON authors.author_id = books.author_id`
      );
      return JSON.parse(JSON.stringify(books));
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async store() {
    let connection = await pool();
    try {
      await connection.query("START TRANSACTION");
      return await connection.query(
        `INSERT INTO books(title, subtitle, description, page_count, isbn_10, isbn_13, author_id) 
         VALUES(?, ?, ?, ?, ?, ?, ?)`,
        [
          this.title,
          this.subtitle,
          this.description,
          this.pageCount,
          this.isbn10,
          this.isbn13,
          this.authorId,
        ]
      );
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update() {
    let connection = await pool();
    try {
      await connection.query("START TRANSACTION");
      await connection.query(
        `UPDATE books SET firstname=?, lastname=? WHERE author_id=?`,
        [this.firstName, this.lastName, this.id]
      );
      await connection.query("COMMIT");
      return true;
    } catch (error) {
      await connection.query("ROLLBACK");
      throw new Error(error.message);
    }
  }

  async remove() {
    let connection = await pool();
    try {
      return await connection.query(`DELETE FROM books WHERE author_id= ?`, [
        this.id,
      ]);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  init(props) {
    this.id = props.id;
    this.title = props.title;
    this.subtitle = props.subtitle;
    this.isbn10 = props.isbn10;
    this.isbn13 = props.isbn13;
    this.description = props.description;
    this.pageCount = props.page_count;
    this.authorId = props.authorId;
  }
}
module.exports = {
  findById,
  Book,
};
