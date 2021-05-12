const database = require("../database/database");

const findById = async (id) => {
  try {
    const [authorData] = await database("authors")
      .select("id", "firstName", "lastName")
      .where({ id });
    return authorData;
  } catch (error) {
    console.log(error);
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
    try {
      return await database("authors").select("*");
    } catch (error) {
      throw new Error(error);
    }
  }

  async store() {
    try {
      return await database("authors").insert(this);
    } catch (error) {
      throw new Error("ERROR");
    }
  }

  async save() {
    try {
      return await database("authors").update(this).where({ id: this.id });
    } catch (error) {
      throw new Error("ERROR");
    }
  }

  async destroy() {
    try {
      return await database("authors").delete().where({ id: this.id });
    } catch (error) {
      throw new Error("ERROR");
    }
  }

  init(props) {
    this.id = props.id;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
  }
}
module.exports = {
  findById,
  Author,
};
