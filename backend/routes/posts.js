const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const { randomUUID } = require("crypto");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../s3");

const router = express.Router();

const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/gif", ".gif"],
]);

async function deleteImageFromS3(imageUrl) {
  if (!imageUrl || !process.env.AWS_BUCKET_NAME) return;

  try {
    const parsed = new URL(imageUrl);
    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));

    if (!key) return;

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }));
  } catch (err) {
    console.error("S3 image cleanup failed:", err);
  }
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;

  if (!token) {
    return res.status(403).json({ message: "No token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  });
}

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const ext = allowedImageTypes.get(file.mimetype);
      cb(null, `posts/${Date.now()}_${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const expectedExt = allowedImageTypes.get(file.mimetype);
    const validJpeg = file.mimetype === "image/jpeg" && (ext === ".jpg" || ext === ".jpeg");

    if (expectedExt && (ext === expectedExt || validJpeg)) {
      return cb(null, true);
    }

    return cb(new Error("Only JPG, PNG, GIF allowed"));
  },
});

router.post("/", auth, upload.single("image"), (req, res) => {
  const contentValue = typeof req.body.content === "string" ? req.body.content.trim() : "";
  const userId = req.user.id;
  const now = new Date().toISOString();

  if (contentValue.length > 2000) {
    return res.status(400).json({ message: "Post content is too long" });
  }

  let imageUrl = null;

  if (req.file) {
    if (req.file.location) {
      imageUrl = req.file.location;
    } else if (req.file.key) {
      const region = process.env.AWS_REGION || "us-east-1";
      const bucket = process.env.AWS_BUCKET_NAME;
      imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${req.file.key}`;
    }
  }

  if (!contentValue && !imageUrl) {
    return res.status(400).json({ message: "Post must have text or image" });
  }

  const query = "INSERT INTO posts(user_id, content, image_url, created_at) VALUES (?, ?, ?, ?)";
  const params = [userId, contentValue, imageUrl, now];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json({
      message: "Post added",
      imageUrl,
      postId: result.insertId,
    });
  });
});

router.get("/", auth, (req, res) => {
  const query = `
    SELECT posts.id, posts.user_id, users.name, posts.content, posts.image_url, posts.created_at
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `;

  db.query(query, (err, data) => {
    if (err) {
      console.error("Error fetching posts:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json(data);
  });
});

router.delete("/:id", auth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  db.query("SELECT image_url FROM posts WHERE id=? AND user_id=?", [postId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching post for deletion:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Cannot delete this post" });
    }

    const imageUrl = results[0].image_url;

    db.query("DELETE FROM posts WHERE id=? AND user_id=?", [postId, userId], (deleteErr) => {
      if (deleteErr) {
        console.error("Error deleting post:", deleteErr);
        return res.status(500).json({ message: "Server error" });
      }

      deleteImageFromS3(imageUrl);
      return res.json({ message: "Post deleted" });
    });
  });
});

module.exports = router;
