const jwt = require("jsonwebtoken");
const Router = require("express").Router;
const router = new Router();

const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");
/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get("/", async (req, res, next) => {
  const results = await User.all();
  const users = results.rows;
  return { users };
});
/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get("/:username", async (req, res, next) => {
  try {
    const username = req.params.username;
    const user = await User.get(username);
    return res.json({ user });
  } catch (e) {
    next(e);
  }
});
/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/to", async (req, res, next) => {
  try {
    const username = req.params.username;
    const messages = await User.messagesTo(username);
    return res.json({ messages });
  } catch (e) {
    next(e);
  }
});
/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/from", async (req, res, next) => {
  try {
    const username = req.params.username;
    const messages = await User.messagesFrom(username);
    return res.json({ messages });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
