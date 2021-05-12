const pool = require("../database/database");

const findById = async (id) => {
  let connection = await pool();
  try {
    let author = await connection.query(
      `
      SELECT author_id, firstname, lastname FROM authors WHERE author_id = ?
      `,
      [id]
    );
    return JSON.parse(JSON.stringify(author[0]));
  } catch (error) {
    ctx.throw(400, "INVALID_DATA");
  } finally {
    await connection.release();
    await connection.destroy();
  }
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
      throw new Error(error);
    }
  }

  async all() {
    let connection = await pool();
    try {
      let authors = await connection.query(
        `SELECT author_id, firstname, lastname FROM authors`
      );
      return JSON.parse(JSON.stringify(authors));
    } catch (error) {
      ctx.throw(400, "INVALID_DATA");
    }
  }

  async store() {
    let connection = await pool();
    try {
      return await connection.query(
        `INSERT INTO authors(firstname, lastname) VALUES(?, ?)`,
        [this.firstName, this.lastName]
      );
    } catch (error) {
      throw new Error("ERROR");
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
      console.log(ex);
      throw ex;
    }
  }

  async remove() {
    let connection = await pool();
    try {
      return await connection.query(`DELETE FROM authors WHERE author_id= ?`, [
        this.id,
      ]);
    } catch (error) {
      throw new Error("ERROR");
    }
  }

  init(props) {
    this.id = props.author_id || -1;
    this.firstName = props.firstname;
    this.lastName = props.lastname;
  }
}
module.exports = {
  findById,
  Author,
};
