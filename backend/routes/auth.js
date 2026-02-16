const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

/* REGISTER */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users(name,email,password) VALUES(?,?,?)",
    [name, email, hashed],
    (err) => {
      if (err) return res.status(400).json({ message: "Email exists" });

      res.json({ message: "User registered" });
    }
  );
});

/* LOGIN */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (result.length === 0)
        return res.status(400).json({ message: "User not found" });

      const user = result[0];

      const match = await bcrypt.compare(password, user.password);

      if (!match)
        return res.status(400).json({ message: "Wrong password" });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET
      );

      res.json({ token });
    }
  );
});

module.exports = router;
