import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const app = express();

app.use(cors());
app.use(express.json());

/* -------------------------------- */
/* PATH тохиргоо */
/* -------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------- */
/* FRONTEND serve хийх */
/* -------------------------------- */

app.use(express.static(path.join(__dirname, "../../")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../index.html"));
});

/* -------------------------------- */
/* DATABASE */
/* -------------------------------- */

const db = new sqlite3.Database("./ads.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      price TEXT,
      description TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

/* -------------------------------- */
/* API ROUTES */
/* -------------------------------- */

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/* бүх зар авах */
app.get("/api/ads", (req, res) => {
  db.all("SELECT * FROM ads ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }
    res.json(rows);
  });
});

/* зар нэмэх */
app.post("/api/ads", (req, res) => {
  const { title, price, description, phone } = req.body;

  db.run(
    "INSERT INTO ads (title, price, description, phone) VALUES (?,?,?,?)",
    [title, price, description, phone],
    function (err) {
      if (err) {
        res.status(500).json({ error: err });
        return;
      }

      res.json({
        success: true,
        id: this.lastID,
      });
    }
  );
});

/* -------------------------------- */
/* SERVER */
/* -------------------------------- */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("API running on port " + PORT);
});