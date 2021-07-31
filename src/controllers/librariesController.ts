/*
 * Creates a default library for a user
 */
import database from "../database";

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
    if (results.length === 0) {
      return undefined;
    }
    return results[0];
  } catch (error) {
    throw error;
  } finally {
    await database.query("COMMIT");
  }
}

/*
 * Gets all the libraries created for the user
 * accepts: userId: number
 * returns: First (and only) library entry
 */
async function getUserLibraries(userId: number) {
  try {
    await database.query("START TRANSACTION");
    let { results } = await database.query(
      `
          SELECT library_id FROM user_libraries
          WHERE user_id = $1`,
      [userId]
    );
    if (results.length === 0) {
      return undefined;
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
