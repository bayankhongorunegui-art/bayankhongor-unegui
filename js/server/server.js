import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { initDb, get, all, run } from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

// __dirname ES module дээр
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ STATIC: project root-оо serve хийнэ
// js/server/server.js байна -> project root = ../../
const projectRoot = path.join(__dirname, "..", "..");
app.use(express.static(projectRoot));

// DB init
await initDb();

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ API: бүх зар
app.get("/api/ads", async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM ads ORDER BY created_at DESC`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "DB error", details: String(e) });
  }
});

// ✅ API: нэг зар (details.html энэ-г дуудаж байна)
app.get("/api/ads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const row = await get(`SELECT * FROM ads WHERE id = ?`, [id]);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "DB error", details: String(e) });
  }
});

// ✅ Root: index.html-г буцаана
app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

// ✅ (Optional) SPA маягаар бусад route-ыг index.html руу чиглүүлэх хэрэг гарвал:
// app.get("*", (req, res) => res.sendFile(path.join(projectRoot, "index.html")));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});