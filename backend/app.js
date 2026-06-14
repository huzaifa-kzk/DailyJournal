const cors = require("cors");
const path = require("path");
const express = require("express");

const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");

const app = express();

// ✅ 1. First, set up middleware (order matters!)
app.use(cors());

// ✅ 2. Increase JSON and URL-encoded payload limits (before routes)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ✅ 3. Serve static files
app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ 4. API routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

// ✅ 5. Fallback route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "login.html"));
});

// Listen on all network interfaces for EC2 public access
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});