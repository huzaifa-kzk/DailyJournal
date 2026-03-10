const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../s3");
const router = express.Router();

/* ===================== AUTH MIDDLEWARE ===================== */
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ message: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

/* ===================== S3 MULTER SETUP ===================== */
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = Date.now().toString() + "_" + file.originalname;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/gif"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, GIF allowed"));
    }
  },
});

/* ===================== CREATE POST (TEXT + IMAGE) ===================== */
router.post("/", auth, upload.single("image"), (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;
  const now = new Date().toISOString();

  console.log("===== FILE UPLOAD DEBUG =====");
  console.log("req.file:", req.file);
  console.log("req.body.content:", content);
  console.log("==============================");

  let imageUrl = null;
  
  if (req.file) {
    if (req.file.location) {
      imageUrl = req.file.location;
      console.log("Using location URL:", imageUrl);
    } else if (req.file.key) {
      const region = process.env.AWS_REGION || 'us-east-1';
      const bucket = process.env.AWS_BUCKET_NAME;
      const key = req.file.key;
      imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      console.log("Constructed URL from key:", imageUrl);
    }
  }

  // FIX: If there's no content but there is an image, use empty string instead of NULL
  const contentValue = content || "";  // Use empty string instead of null
  
  if (!contentValue && !imageUrl) {
    return res.status(400).json({ message: "Post must have text or image" });
  }

  const query = "INSERT INTO posts(user_id, content, image_url, created_at) VALUES (?, ?, ?, ?)";
  const params = [userId, contentValue, imageUrl, now];
  
  console.log("SQL Query:", query);
  console.log("SQL Params:", params);
  console.log("Final imageUrl being saved:", imageUrl);

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Database error details:", err);
      return res.status(500).json({ 
        message: "Database error", 
        error: err.message 
      });
    }
    console.log("Post inserted successfully, ID:", result.insertId);
    res.json({ 
      message: "Post added", 
      imageUrl: imageUrl,
      postId: result.insertId 
    });
  });
});

/* ===================== GET POSTS ===================== */
router.get("/", (req, res) => {
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
    
    // Log posts with images
    const postsWithImages = data.filter(p => p.image_url);
    console.log(`Found ${postsWithImages.length} posts with images`);
    
    res.json(data);
  });
});

/* ===================== DELETE POST ===================== */
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

    db.query("DELETE FROM posts WHERE id=? AND user_id=?", [postId, userId], (err, result) => {
      if (err) {
        console.error("Error deleting post:", err);
        return res.status(500).json({ message: "Server error" });
      }
      
      console.log(`Post ${postId} deleted successfully`);
      res.json({ message: "Post deleted" });
    });
  });
});

module.exports = router;