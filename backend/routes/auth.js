const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db"); // your MySQL connection

const router = express.Router();

/* ===================== REGISTER ===================== */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users(name, email, password) VALUES(?,?,?)",
      [name, email, hashed],
      (err) => {
        if (err) {
          console.error("DB ERROR (register):", err);
          return res.status(400).json({ message: "Email exists" });
        }

        res.json({ message: "User registered" });
      }
    );
  } catch (err) {
    console.error("BCRYPT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===================== LOGIN ===================== */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (err) {
        console.error("DB ERROR (login):", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (!result || result.length === 0) {
        return res.status(400).json({ message: "User not found" });
      }

      try {
        const user = result[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return res.status(400).json({ message: "Wrong password" });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "7d" } // optional: token expiry
        );

        res.json({ token });
      } catch (err) {
        console.error("BCRYPT ERROR (login):", err);
        res.status(500).json({ message: "Server error" });
      }
    }
  );
});

module.exports = router;