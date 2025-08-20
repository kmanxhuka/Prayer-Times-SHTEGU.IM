import express from "express";
import sqlite3 from "sqlite3";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const db = new sqlite3.Database("quotes.db");

// --- DB setup ---
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS "quotes-sq" (id INTEGER PRIMARY KEY AUTOINCREMENT, quote TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS "quotes-ar" (id INTEGER PRIMARY KEY AUTOINCREMENT, quote TEXT)');
});

// --- Helper: convert Telegram entities into proper nested HTML ---
function entitiesToHTML(text, entities = []) {
  if (!entities || entities.length === 0) return text;

  const inserts = [];
  for (const ent of entities) {
    let openTag = "", closeTag = "";

    switch (ent.type) {
      case "bold": openTag = "<b>"; closeTag = "</b>"; break;
      case "italic": openTag = "<i>"; closeTag = "</i>"; break;
      case "underline": openTag = "<u>"; closeTag = "</u>"; break;
      case "strikethrough": openTag = "<s>"; closeTag = "</s>"; break;
      case "code": openTag = "<code>"; closeTag = "</code>"; break;
      case "pre": openTag = "<pre>"; closeTag = "</pre>"; break;
      case "text_link":
        openTag = `<a href="${ent.url}" target="_blank">`; 
        closeTag = "</a>"; 
        break;
      case "text_mention":
        openTag = `<a href="tg://user?id=${ent.user.id}">`; 
        closeTag = "</a>"; 
        break;
    }

    // Opening tags inserted with order=1, closing tags with order=0
    inserts.push({ pos: ent.offset, tag: openTag, order: 1 });
    inserts.push({ pos: ent.offset + ent.length, tag: closeTag, order: 0 });
  }

  // Sort by position (descending), then by order (closing before opening)
  inserts.sort((a, b) => b.pos - a.pos || a.order - b.order);

  // Insert tags backwards so offsets remain valid
  let result = text;
  for (const ins of inserts) {
    result = result.slice(0, ins.pos) + ins.tag + result.slice(ins.pos);
  }

  return result;
}

// --- Telegram Bot ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID_SQ = process.env.CHANNEL_SQ;
const CHANNEL_ID_AR = process.env.CHANNEL_AR;

bot.on("channel_post", (ctx) => {
  const msg = ctx.channelPost;
  if (!msg || !msg.text) return;

  // ✅ Convert text + entities into HTML safely
  const htmlText = entitiesToHTML(msg.text, msg.entities);

  let table;
  if (msg.chat.id.toString() === CHANNEL_ID_SQ) {
    table = "quotes-sq";
  } else if (msg.chat.id.toString() === CHANNEL_ID_AR) {
    table = "quotes-ar";
  } else {
    return; // ignore messages from other channels
  }

  db.run(`INSERT INTO "${table}" (quote) VALUES (?)`, [htmlText], (err) => {
    if (err) console.error("❌ DB insert error", err);
    else console.log(`✅ Quote saved to ${table}`);
  });
});

// --- API Endpoints ---
app.get("/api/quotes-sq", (req, res) => {
  db.get('SELECT quote FROM "quotes-sq" ORDER BY RANDOM() LIMIT 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ quote: row ? row.quote : "" });
  });
});

app.get("/api/quotes-ar", (req, res) => {
  db.get('SELECT quote FROM "quotes-ar" ORDER BY RANDOM() LIMIT 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ quote: row ? row.quote : "" });
  });
});

// --- Serve frontend ---
app.use(express.static("../frontend"));

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

bot.launch();
