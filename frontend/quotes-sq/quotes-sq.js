let refreshIntervalSq = 60;
let remainingSq = refreshIntervalSq;

async function loadQuoteSq() {
  const sq = await fetch("/api/quotes-sq").then(r => r.json());
  if (sq.quote) {
    const lines = sq.quote.trim().split("\n");
    const title = lines.pop();
    const body = lines.join("\n");
    document.getElementById("quotesSq").innerHTML =
      `<h3 class="quote-title">${title}</h3>` +
      `<div class="text-albanian">${body}</div>`;
    refreshIntervalSq = Math.min(120, Math.max(20, body.length * 1.5 / 10));
    remainingSq = refreshIntervalSq;
  }
}

function updateProgressSq() {
  if (remainingSq > 0) remainingSq -= 0.1;
  document.getElementById("progressSq").style.width =
    (remainingSq / refreshIntervalSq * 100) + "%";
  if (remainingSq <= 0) loadQuoteSq();
}

loadQuoteSq();
setInterval(updateProgressSq, 100);
