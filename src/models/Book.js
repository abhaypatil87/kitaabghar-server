const { database } = require("../database/index");

const findById = async (id) => {
  try {
    const result = await database.query(
      `SELECT books.book_id,
              books.title,
              books.subtitle,
              books.description,
              books.isbn_10,
              books.isbn_13,
              books.page_count,
              books.thumbnail_url,
              authors.first_name,
              authors.last_name
       FROM books
                INNER JOIN authors ON authors.author_id = books.author_id
       WHERE books.book_id = $1
      `,
      [id]
    );
    if (result.rowCount === 0) {
      return;
    }
    return JSON.parse(JSON.stringify(result.rows[0]));
  } catch (error) {
    throw error;
  }
};

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
    try {
      const result = await database.query(
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
      return JSON.parse(JSON.stringify(result.rows));
    } catch (error) {
      throw error;
    }
  }

  async store() {
    try {
      await database.query("START TRANSACTION");
      return await database.query(
        `INSERT INTO books(title, subtitle, description, page_count, isbn_10, isbn_13, author_id, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      await database.query(
        `UPDATE books
         SET title=$1,
             subtitle=$2,
             description=$3,
             page_count=$4,
             isbn_10=$5,
             isbn_13=$6,
             thumbnail_url=$7
         WHERE book_id = $8`,
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
      await database.query("COMMIT");
      return true;
    } catch (error) {
      await database.query("ROLLBACK");
      throw error;
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

  init(props) {
    this.book_id = props.book_id;
    this.title = props.title;
    this.subtitle = props.subtitle;
    this.isbn_10 = props.isbn_10;
    this.isbn_13 = props.isbn_13;
    this.description = props.description;
    this.page_count = props.page_count;
    this.author_id = props.author_id;
    this.thumbnail_url = props.thumbnail_url;
  }
}

module.exports = {
  findById,
  Book,
};
