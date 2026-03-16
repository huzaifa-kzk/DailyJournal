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
  limits: { fileSize: 20 * 1024 * 1024 }, // max 10MB
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

  let imageUrl = null;
  
  if (req.file) {
    if (req.file.location) {
      imageUrl = req.file.location;
    } else if (req.file.key) {
      const region = process.env.AWS_REGION || 'us-east-1';
      const bucket = process.env.AWS_BUCKET_NAME;
      const key = req.file.key;
      imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }
  }

  // Use empty string if no content (to avoid NULL error)
  const contentValue = content || "";
  
  if (!contentValue && !imageUrl) {
    return res.status(400).json({ message: "Post must have text or image" });
  }

  const query = "INSERT INTO posts(user_id, content, image_url, created_at) VALUES (?, ?, ?, ?)";
  const params = [userId, contentValue, imageUrl, now];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ 
        message: "Database error" 
      });
    }
    
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
      
      res.json({ message: "Post deleted" });
    });
  });
});

module.exports = router;