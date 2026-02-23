const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optional: test connection on startup
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL Pool Connection Failed:", err);
  } else {
    console.log("✅ MySQL Pool Connected");
    connection.release();
  }
});

module.exports = db;