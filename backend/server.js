import express from "express";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import initSqlJs from "sql.js";  // ✅ use sql.js instead of sqlite3
import fs from "fs";

dotenv.config();
const app = express();

// --- Database setup with sql.js ---
const dbFile = "quotes.db";
let SQL, db;

async function initDB() {
  SQL = await initSqlJs();

  if (fs.existsSync(dbFile)) {
    const fileBuffer = fs.readFileSync(dbFile);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    db.run('CREATE TABLE IF NOT EXISTS "quotes-sq" (id INTEGER PRIMARY KEY AUTOINCREMENT, quote TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS "quotes-ar" (id INTEGER PRIMARY KEY AUTOINCREMENT, quote TEXT)');
    saveDB();
  }
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFile, buffer);
}

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

    inserts.push({ pos: ent.offset, tag: openTag, order: 1 });
    inserts.push({ pos: ent.offset + ent.length, tag: closeTag, order: 0 });
  }

  inserts.sort((a, b) => b.pos - a.pos || a.order - b.order);

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

  const htmlText = entitiesToHTML(msg.text, msg.entities);

  let table;
  if (msg.chat.id.toString() === CHANNEL_ID_SQ) {
    table = "quotes-sq";
  } else if (msg.chat.id.toString() === CHANNEL_ID_AR) {
    table = "quotes-ar";
  } else {
    return;
  }

  db.run(`INSERT INTO "${table}" (quote) VALUES (?)`, [htmlText]);
  saveDB();
  console.log(`✅ Quote saved to ${table}`);
});

// --- API Endpoints ---
app.get("/api/quotes-sq", (req, res) => {
  const stmt = db.prepare('SELECT quote FROM "quotes-sq" ORDER BY RANDOM() LIMIT 1');
  stmt.step();
  const row = stmt.getAsObject();
  res.json({ quote: row.quote || "" });
});

app.get("/api/quotes-ar", (req, res) => {
  const stmt = db.prepare('SELECT quote FROM "quotes-ar" ORDER BY RANDOM() LIMIT 1');
  stmt.step();
  const row = stmt.getAsObject();
  res.json({ quote: row.quote || "" });
});

// --- Serve frontend ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "../frontend")));

// --- Start server ---
const PORT = process.env.PORT || 5000;
initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
  bot.launch();
});
