let refreshIntervalSq = 60;
let remainingSq = refreshIntervalSq;

async function loadQuoteSq() {
  const sq = await fetch("/api/quotes-sq").then(r => r.json());
  if (sq.quote) {
    const parts = sq.quote.trim().split("\n");
    const title = parts.pop();
    const body = parts.join("\n");
    document.getElementById("quotesSq").innerHTML = body;
    quoteTitleSq.textContent = title;
    refreshIntervalSq = Math.min(120, Math.max(20, body.length * 1.2 / 10));
    remainingSq = refreshIntervalSq;
    progressSq.style.transform = "scaleX(1)"; // ✅ reset full bar
  }
}

const progressSq = document.getElementById("progressSq");
const quoteTitleSq = document.getElementById("quoteTitleSq");

function updateProgressSq() {
  if (remainingSq > 0) remainingSq -= 0.1;
  const percent = (remainingSq / refreshIntervalSq * 100);
  progressSq.style.transform = `scaleX(${percent / 100})`; // ✅ smooth shrink
  if (remainingSq <= 0) loadQuoteSq();
}

loadQuoteSq();
setInterval(updateProgressSq, 100);