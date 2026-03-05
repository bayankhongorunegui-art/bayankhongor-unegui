import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const app = express();

app.use(cors());
app.use(express.json());

// ---------- PATH ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname,"../../")

app.use(express.static(ROOT_DIR))
app.get("/",(req,res)=>{
res.sendFile(path.join(ROOT_DIR,"index.html"))
})

// ---------- DATABASE ----------
const DB_PATH = path.join(__dirname, "ads.db");
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
  CREATE TABLE IF NOT EXISTS ads(
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    price INTEGER,
    category TEXT,
    phone TEXT,
    views INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
  `);
});

// ---------- API ----------

// health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// бүх зар
app.get("/api/ads", (req, res) => {
  db.all(
    `SELECT * FROM ads ORDER BY datetime(created_at) DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// нэг зар
app.get("/api/ads/:id", (req, res) => {
  const id = req.params.id;

  db.get(`SELECT * FROM ads WHERE id=?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Not found" });

    db.run(`UPDATE ads SET views = views + 1 WHERE id=?`, [id]);

    res.json(row);
  });
});

// зар нэмэх
app.post("/api/ads", (req, res) => {
  const { title, description, price, category, phone } = req.body;

  const id = crypto.randomUUID();

  db.run(
    `INSERT INTO ads(id,title,description,price,category,phone)
     VALUES(?,?,?,?,?,?)`,
    [id, title, description, price, category, phone],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

// ---------- FRONTEND ----------

// нүүр
app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});