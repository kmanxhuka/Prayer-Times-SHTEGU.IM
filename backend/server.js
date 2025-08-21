// server.js
import express from "express";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();

// --- Connect to Postgres ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Render Postgres requires SSL
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

// --- Telegram Bot ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID_SQ = process.env.CHANNEL_SQ;
const CHANNEL_ID_AR = process.env.CHANNEL_AR;

// Helper: convert Telegram entities to HTML
function formatMessageWithEntities(text, entities = []) {
  if (!entities || entities.length === 0) return text;

  let result = "";
  let cursor = 0;

  for (const ent of entities) {
    const before = text.slice(cursor, ent.offset);
    result += before;

    const part = text.substr(ent.offset, ent.length);

    switch (ent.type) {
      case "bold": result += `<b>${part}</b>`; break;
      case "italic": result += `<i>${part}</i>`; break;
      case "underline": result += `<u>${part}</u>`; break;
      case "strikethrough": result += `<s>${part}</s>`; break;
      case "code": result += `<code>${part}</code>`; break;
      case "pre": result += `<pre>${part}</pre>`; break;
      case "text_link": result += `<a href="${ent.url}" target="_blank">${part}</a>`; break;
      case "text_mention": result += `<a href="tg://user?id=${ent.user.id}">${part}</a>`; break;
      default: result += part;
    }

    cursor = ent.offset + ent.length;
  }
  result += text.slice(cursor);
  return result;
}

// Handle incoming channel/group messages
bot.on(["message", "channel_post"], async (ctx) => {
  const msg = ctx.message || ctx.channelPost;
  if (!msg || !msg.text) return;

  const htmlText = formatMessageWithEntities(msg.text, msg.entities);

  let table;
  if (msg.chat.id.toString() === CHANNEL_ID_SQ) {
    table = "quotes_sq";
  } else if (msg.chat.id.toString() === CHANNEL_ID_AR) {
    table = "quotes_ar";
  } else {
    return; // ignore unknown sources
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
