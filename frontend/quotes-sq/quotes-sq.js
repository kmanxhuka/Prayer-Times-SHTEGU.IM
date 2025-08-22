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
    progressSq.style.width = "100%";
  }
}

const progressSq = document.getElementById("progressSq");
const quoteTitleSq = document.getElementById("quoteTitleSq");

function updateProgressSq() {
  if (remainingSq > 0) remainingSq -= 0.1;
  const percent = (remainingSq / refreshIntervalSq * 100);
  progressSq.style.width = percent + "%";
  if (remainingSq <= 0) loadQuoteSq();
}

loadQuoteSq();
setInterval(updateProgressSq, 100);
