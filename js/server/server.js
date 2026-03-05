import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import sqlite3 from "sqlite3";
import crypto from "crypto";

const app = express();

// -------------------- Paths (ESM) --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// repo root: js/server -> (.. -> js) -> (.. -> repo root)
const ROOT_DIR = path.resolve(__dirname, "..", "..");

// -------------------- Middleware --------------------
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------- Static frontend --------------------
// Serve everything in repo root (index.html, details.html, css/, js/...)
app.use(express.static(ROOT_DIR));

// -------------------- SQLite --------------------
const DB_PATH = path.join(__dirname, "ads.db");
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS ads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      price INTEGER DEFAULT 0,
      category TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      featured INTEGER DEFAULT 0,
      pin TEXT DEFAULT '',
      views INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}
await initDb();

// -------------------- Health --------------------
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// -------------------- API --------------------
// List
app.get("/api/ads", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const category = String(req.query.category ?? "").trim();
    const featured = String(req.query.featured ?? "").trim();

    let where = [];
    let params = [];

    if (q) {
      where.push("(title LIKE ? OR description LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category && category !== "all") {
      where.push("category = ?");
      params.push(category);
    }
    if (featured === "1" || featured === "true") {
      where.push("featured = 1");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await all(
      `
      SELECT id, title, description, price, category, phone, featured, views, created_at
      FROM ads
      ${whereSql}
      ORDER BY datetime(created_at) DESC
      LIMIT 200
      `,
      params
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Details by id
app.get("/api/ads/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const row = await get(
      `
      SELECT id, title, description, price, category, phone, featured, views, created_at
      FROM ads
      WHERE id = ?
      `,
      [id]
    );

    if (!row) return res.status(404).json({ error: "Not found" });

    // increment views
    await run(`UPDATE ads SET views = views + 1 WHERE id = ?`, [id]);

    // return updated views
    row.views = Number(row.views || 0) + 1;

    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create
app.post("/api/ads", async (req, res) => {
  try {
    const body = req.body ?? {};
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const price = Number(body.price ?? 0) || 0;
    const category = String(body.category ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const featured = body.featured ? 1 : 0;
    const pin = String(body.pin ?? "").trim();

    if (!title) return res.status(400).json({ error: "Title required" });

    const id = crypto.randomUUID();

    await run(
      `
      INSERT INTO ads (id, title, description, price, category, phone, featured, pin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [id, title, description, price, category, phone, featured, pin]
    );

    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update (pin required)
app.put("/api/ads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};

    const saved = await get(`SELECT pin FROM ads WHERE id = ?`, [id]);
    if (!saved) return res.status(404).json({ error: "Not found" });

    const inputPin = String(body.pin ?? "").trim();
    const savedPin = String(saved.pin ?? "").trim();
    if (savedPin && inputPin !== savedPin) {
      return res.status(403).json({ error: "Wrong pin" });
    }

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const price = Number(body.price ?? 0) || 0;
    const category = String(body.category ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const featured = body.featured ? 1 : 0;

    await run(
      `
      UPDATE ads
      SET title = ?, description = ?, price = ?, category = ?, phone = ?, featured = ?
      WHERE id = ?
      `,
      [title, description, price, category, phone, featured, id]
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete (pin required)
app.delete("/api/ads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const inputPin = String(req.query.pin ?? "").trim();

    const saved = await get(`SELECT pin FROM ads WHERE id = ?`, [id]);
    if (!saved) return res.status(404).json({ error: "Not found" });

    const savedPin = String(saved.pin ?? "").trim();
    if (savedPin && inputPin !== savedPin) {
      return res.status(403).json({ error: "Wrong pin" });
    }

    await run(`DELETE FROM ads WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -------------------- Frontend routes --------------------
// Ensure "/" always returns index.html (not server.js text)
app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

// For direct navigation like /details.html?id=...
app.get("/:page(details|post|edit).html", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, `${req.params.page}.html`));
});

// (optional) fallback: keep static files working
app.use((req, res) => {
  res.status(404).send("Not found");
});

// -------------------- Start --------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});