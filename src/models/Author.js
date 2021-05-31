const { database } = require("../database/index");

const findById = async (id) => {
  try {
    const result = await database.query(
      `
          SELECT author_id, first_name, last_name
          FROM authors
          WHERE author_id = $1
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

const findByName = async (names) => {
  try {
    let result = await database.query(
      `
          SELECT author_id, first_name, last_name
          FROM authors
          WHERE LOWER(first_name) LIKE '%${names[0]}%'
            AND LOWER(last_name) LIKE '%${names[1]}%'
          ORDER BY first_name
          LIMIT 1`
    );
    if (result.rowCount === 0) {
      return;
    }
    return JSON.parse(JSON.stringify(result.rows[0]));
  } catch (error) {
    throw error;
  }
};

const getOrCreateAuthor = async (bookAuthor) => {
  let author;
  if (bookAuthor !== undefined) {
    try {
      author = await findByName([
        bookAuthor.first_name.toLowerCase(),
        bookAuthor.last_name.toLowerCase(),
      ]);
      if (author === undefined) {
        author = new Author(bookAuthor);
        const result = await author.store();
        author.author_id = result.rows[0]["author_id"];
      }
    } catch (error) {
      throw error;
    }
  }
  return author;
};

class Author {
  author_id;
  first_name;
  last_name;

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
        `SELECT author_id, first_name, last_name
         FROM authors
         ORDER BY first_name`
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
        `INSERT INTO authors(first_name, last_name)
         VALUES ($1, $2)
         RETURNING author_id`,
        [this.first_name, this.last_name]
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
        `UPDATE authors
         SET first_name=$1,
             last_name=$2
         WHERE author_id = $3`,
        [this.first_name, this.last_name, this.author_id]
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
      return await database.query(
        `DELETE
                                   FROM authors
                                   WHERE author_id = $1`,
        [this.author_id]
      );
    } catch (error) {
      throw error;
    }
  }

  init(props) {
    this.author_id = props.author_id;
    this.first_name = props.first_name;
    this.last_name = props.last_name;
  }
}

module.exports = {
  findByName,
  getOrCreateAuthor,
  Author,
};
