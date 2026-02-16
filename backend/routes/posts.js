const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

/* AUTH MIDDLEWARE */
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token)
    return res.status(403).json({ message: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = user;
    next();
  });
}

/* CREATE POST (1 PER DAY) */
router.post("/", auth, (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;

  if (!content)
    return res.status(400).json({ message: "Content required" });

  const today = new Date().toISOString().slice(0, 10);

  db.query(
    "SELECT * FROM posts WHERE user_id=? AND created_at=?",
    [userId, today],
    (err, result) => {
      if (result.length > 0)
        return res
          .status(400)
          .json({ message: "Already posted today" });

      db.query(
        "INSERT INTO posts(user_id,content,created_at) VALUES(?,?,?)",
        [userId, content, today],
        () => {
          res.json({ message: "Post added" });
        }
      );
    }
  );
});

/* GET POSTS */
router.get("/", (req, res) => {
  db.query(
    "SELECT users.name, posts.content, posts.created_at FROM posts JOIN users ON posts.user_id=users.id ORDER BY posts.created_at DESC",
    (err, data) => {
      res.json(data);
    }
  );
});

module.exports = router;
