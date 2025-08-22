// backend/server.js
import express from "express";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "pg-connection-string";
import { entitiesToHTML } from "./entitiesToHTML.js";

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

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Start Telegram bot
bot.launch();
