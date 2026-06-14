const cors = require("cors");
const path = require("path");
const express = require("express");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function createRateLimiter(maxRequests, windowMs) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (entry.resetAt <= now) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    hits.set(key, entry);

    if (entry.count > maxRequests) {
      return res.status(429).json({ message: "Too many requests. Try again later." });
    }

    next();
  };
}

const apiLimiter = createRateLimiter(Number(process.env.RATE_LIMIT_MAX || 300), 15 * 60 * 1000);
const authLimiter = createRateLimiter(Number(process.env.AUTH_RATE_LIMIT_MAX || 30), 15 * 60 * 1000);

app.set("trust proxy", 1);

app.use(cors((req, callback) => {
  const requestOrigin = req.header("Origin");
  const host = req.header("Host");
  const sameOrigin = requestOrigin && host
    ? requestOrigin === `http://${host}` || requestOrigin === `https://${host}`
    : false;

  callback(null, {
    origin(origin, originCallback) {
      if (!origin || sameOrigin || allowedOrigins.includes(origin)) {
        return originCallback(null, true);
      }

      return originCallback(new Error("Not allowed by CORS"));
    },
  });
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "login.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
