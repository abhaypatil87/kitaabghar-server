import database from "../database";
const findById = async (id: number) => {
  try {
    const { results } = await database.query(
      `
          SELECT api_id, api_name, enabled
          FROM third_party_api_settings
          WHERE api_id = $1
      `,
      [id]
    );
    if (results.length === 0) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(results[0]));
  } catch (error) {
    throw error;
  }
};

class ThirdPartyApi {
  api_id;
  api_name;
  enabled;

  constructor(props) {
    if (!props) return;

    this.init(props);
  }

  async find(id) {
    try {
      const result = await findById(id);
      if (!result) {
        return {};
      }
      this.init(result);
    } catch (error) {
      throw error;
    }
  }

  async all() {
    try {
      const { results } = await database.query(
        `SELECT api_id, api_name, enabled
         FROM third_party_api_settings
         ORDER BY api_id`
      );

      const response = {};
      results.forEach((row) => (response[row.api_name] = row.enabled));
      return JSON.parse(JSON.stringify(response));
    } catch (error) {
      throw error;
    }
  }

  async update(api_name, enabled) {
    try {
      await database.query("START TRANSACTION");
      await database.query(
        `UPDATE third_party_api_settings
         SET enabled=$1
         WHERE api_name = $2`,
        [enabled, api_name]
      );
      await database.query("COMMIT");
      return true;
    } catch (error) {
      await database.query("ROLLBACK");
      throw error;
    }
  }

  init(props) {
    this.api_id = props.author_id;
    this.api_name = props.first_name;
    this.enabled = props.last_name;
  }
}

export { ThirdPartyApi };
