// backend/server.js
import express from "express";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "pg-connection-string";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Always load .env from backend folder
dotenv.config({ path: path.join(__dirname, ".env") });

const { Pool } = pkg;
const app = express();

// Debug: check environment variables in dev
if (process.env.NODE_ENV !== "production") {
  if (!process.env.DATABASE_URL) {
    console.error("❌ Missing DATABASE_URL in .env");
    process.exit(1);
  }
  const parsed = parse(process.env.DATABASE_URL);
  console.log("Parsed DB config:", parsed);
  console.log("BOT_TOKEN =", process.env.BOT_TOKEN ? "✅ loaded" : "❌ missing");
}

// --- Serve frontend (always point to ../frontend) ---
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// --- Connect to Postgres ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false } // Render requires SSL
    : false                         // Local Postgres doesn’t use SSL
});

// --- DB setup ---
async function initDb() {
  await pool.query(`CREATE TABLE IF NOT EXISTS quotes_sq (
    id SERIAL PRIMARY KEY,
    quote TEXT
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS quotes_ar (
    id SERIAL PRIMARY KEY,
    quote TEXT
  )`);
}
initDb().catch(err => console.error("❌ DB init failed:", err));

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

  // Sort: descending pos, closing tags first at same position
  inserts.sort((a, b) => b.pos - a.pos || a.order - b.order);

  // Insert backwards so offsets remain valid
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

bot.on("channel_post", async (ctx) => {
  const msg = ctx.channelPost;
  if (!msg || !msg.text) return;

  const htmlText = entitiesToHTML(msg.text, msg.entities);

  let table;
  if (msg.chat.id.toString() === CHANNEL_ID_SQ) {
    table = "quotes_sq";
  } else if (msg.chat.id.toString() === CHANNEL_ID_AR) {
    table = "quotes_ar";
  } else {
    return; // ignore messages from other channels
  }

  try {
    await pool.query(`INSERT INTO ${table} (quote) VALUES ($1)`, [htmlText]);
    console.log(`✅ Quote saved to ${table}`);
  } catch (err) {
    console.error("❌ DB insert error:", err);
  }
});

// --- API Endpoints ---
app.get("/api/quotes-sq", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT quote FROM quotes_sq ORDER BY RANDOM() LIMIT 1"
    );
    res.json({ quote: rows[0] ? rows[0].quote : "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/quotes-ar", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT quote FROM quotes_ar ORDER BY RANDOM() LIMIT 1"
    );
    res.json({ quote: rows[0] ? rows[0].quote : "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Serve frontend ---
app.use(express.static("../frontend"));

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Start Telegram bot
bot.launch();
