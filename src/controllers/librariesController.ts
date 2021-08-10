import database from "../database";

/*
 * Creates and returns a default library for a given user ID
 */
async function createUserLibrary(userId: number) {
  try {
    await database.query("START TRANSACTION");
    let { results } = await database.query(
      `
          INSERT INTO user_libraries(user_id)
          VALUES($1)
          RETURNING *`,
      [userId]
    );
    return results[0];
  } catch (error) {
    throw error;
  } finally {
    await database.query("COMMIT");
  }
}

/*
 * Gets the libraries created for the given user ID
 * returns: First (and only) library entry
 */
async function getUserLibraries(userId: number) {
  try {
    await database.query("START TRANSACTION");
    let { results } = await database.query(
      `
          SELECT library_id FROM user_libraries
          WHERE user_id = $1
          ORDER BY library_id
          LIMIT 1`,
      [userId]
    );
    if (results.length === 0) {
      throw new Error("No library found");
    }
    return results[0];
  } catch (error) {
    throw error;
  }
}

const librariesController = {
  createUserLibrary,
  getUserLibraries,
};

export default librariesController;
