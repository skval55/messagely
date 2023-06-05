const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
/** User class for message.ly */

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    // hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    // save to db
    const results = await db.query(
      `
        INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone, join_at`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT username, password 
       FROM users
       WHERE username = $1`,
      [username]
    );
    const user = results.rows[0];
    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        return true;
      } else {
        return false;
      }
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
         SET last_login_at = current_timestamp
         WHERE username = $1
         RETURNING username, last_login_at`,
      [username]
    );

    if (!result.rows[0]) {
      throw new ExpressError(`No user found`, 404);
    }

    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      "SELECT username, first_name, last_name, phone FROM users"
    );
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
             last_login_at 
       FROM users
       WHERE username = $1`,
      [username]
    );
    const user = results.rows[0];
    if (!user) {
      throw new ExpressError("No user found", 404);
    }
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messageResults = await db.query(
      `SELECT id, to_username, body, sent_at, read_at 
      FROM messages WHERE from_username = $1`,
      [username]
    );
    const toUserResults = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users WHERE username = $1`,
      [messageResults.rows[0].to_username]
    );
    return [
      {
        id: messageResults.rows[0].id,
        to_user: toUserResults.rows[0],
        body: messageResults.rows[0].body,
        sent_at: messageResults.rows[0].sent_at,
        read_at: messageResults.rows[0].read_at,
      },
    ];
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const messageResults = await db.query(
      `SELECT id, from_username, body, sent_at, read_at 
      FROM messages WHERE to_username = $1`,
      [username]
    );
    const fromUserResults = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users WHERE username = $1`,
      [messageResults.rows[0].from_username]
    );
    return [
      {
        id: messageResults.rows[0].id,
        from_user: fromUserResults.rows[0],
        body: messageResults.rows[0].body,
        sent_at: messageResults.rows[0].sent_at,
        read_at: messageResults.rows[0].read_at,
      },
    ];
  }
}

module.exports = User;
