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

/* CREATE POST (UNLIMITED) */
router.post("/", auth, (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;

  if (!content)
    return res.status(400).json({ message: "Content required" });

  const now = new Date().toISOString(); // full timestamp

  db.query(
    "INSERT INTO posts(user_id, content, created_at) VALUES (?, ?, ?)",
    [userId, content, now],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error" });

      res.json({ message: "Post added" });
    }
  );
});

/* GET POSTS */
router.get("/", (req, res) => {
  db.query(
    "SELECT users.name, posts.content, posts.created_at FROM posts JOIN users ON posts.user_id=users.id ORDER BY posts.created_at DESC",
    (err, data) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(data);
    }
  );
});
// DELETE post by id (only if owned by user)
router.delete("/:id", auth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  db.query(
    "DELETE FROM posts WHERE id=? AND user_id=?",
    [postId, userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Server error" });

      if (result.affectedRows === 0)
        return res.status(403).json({ message: "Cannot delete this post" });

      res.json({ message: "Post deleted" });
    }
  );
});
module.exports = router;
