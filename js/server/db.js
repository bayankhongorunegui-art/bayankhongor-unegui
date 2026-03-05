import sqlite3 from "sqlite3";
sqlite3.verbose();

const DB_PATH = "./ads.db";

export const db = new sqlite3.Database(DB_PATH);

// DB хүснэгт үүсгэх
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER DEFAULT 0,
      location TEXT NOT NULL,
      phone TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT DEFAULT "",
      pin TEXT NOT NULL,
      featured INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT DEFAULT ""
    )
  `);
});

// helper: promisify
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}