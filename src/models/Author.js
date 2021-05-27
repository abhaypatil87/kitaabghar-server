const { pool } = require("../database/database");

const findById = async (id) => {
  let connection = await pool();
  try {
    let author = await connection.query(
      `
      SELECT author_id as id, firstname as firstName, lastname as lastName FROM authors WHERE author_id = ?
      `,
      [id]
    );
    return JSON.parse(JSON.stringify(author[0]));
  } catch (error) {
    ctx.throw(400, error.message);
  }
};

const findByName = async (names) => {
  let connection = await pool();
  try {
    let author = await connection.query(
      `
      SELECT author_id as id, firstname as firstName, lastname as lastName 
      FROM authors 
      WHERE LOWER(firstname) LIKE '%${names[0]}%' AND LOWER(lastname) LIKE '%${names[1]}%'
      ORDER BY firstname
      LIMIT 1`
    );
    if (author.length === 0) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(author[0]));
  } catch (error) {
    throw new Error(error.message);
  }
};

const getOrCreateAuthor = async (bookAuthor) => {
  let author = null;
  if (bookAuthor !== undefined) {
    try {
      author = await findByName([
        bookAuthor.firstName.toLowerCase(),
        bookAuthor.lastName.toLowerCase(),
      ]);
      if (author === undefined) {
        author = new Author(bookAuthor);
        const result = await author.store();
        author.id = result.insertId;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
  return author;
};

class Author {
  id;
  firstName;
  lastName;
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
      let authors = await connection.query(
        `SELECT author_id as id, firstname as firstName, lastname as lastName 
               FROM authors
               ORDER BY firstName`
      );
      return JSON.parse(JSON.stringify(authors));
    } catch (error) {
      ctx.throw(400, "INVALID_DATA");
    }
  }

  async store() {
    let connection = await pool();
    try {
      await connection.query("START TRANSACTION");
      return await connection.query(
        `INSERT INTO authors(firstname, lastname) VALUES(?, ?)`,
        [this.firstName, this.lastName]
      );
    } catch (error) {
      throw error;
    } finally {
      await connection.query("COMMIT");
    }
  }

  async update() {
    let connection = await pool();
    try {
      await connection.query("START TRANSACTION");
      await connection.query(
        `UPDATE authors SET firstname=?, lastname=? WHERE author_id=?`,
        [this.firstName, this.lastName, this.id]
      );
      await connection.query("COMMIT");
      return true;
    } catch (error) {
      await connection.query("ROLLBACK");
      throw error;
    }
  }

  async remove() {
    let connection = await pool();
    try {
      return await connection.query(`DELETE FROM authors WHERE author_id= ?`, [
        this.id,
      ]);
    } catch (error) {
      throw error;
    }
  }

  init(props) {
    this.id = props.id;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
  }
}
module.exports = {
  findByName,
  getOrCreateAuthor,
  Author,
};
