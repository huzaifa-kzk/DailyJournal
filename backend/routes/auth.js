router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {

      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (!result || result.length === 0)
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