require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.listen(3000, () => {
  console.log("🚀 Server on http://localhost:3000");
});
