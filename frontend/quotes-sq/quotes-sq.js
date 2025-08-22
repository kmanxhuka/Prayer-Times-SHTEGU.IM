let refreshIntervalSq = 60;
let remainingSq = refreshIntervalSq;

async function loadQuoteSq() {
  const sq = await fetch("/api/quotes-sq").then(r => r.json());
  if (sq.quote) {
    document.getElementById("quotesSq").innerHTML = sq.quote;
    refreshIntervalSq = Math.min(120, Math.max(20, sq.quote.length * 1.2 / 10));
    remainingSq = refreshIntervalSq;
  }
}

const boxSq = document.getElementById("quoteBoxSq");

function updateProgressSq() {
  if (remainingSq > 0) remainingSq -= 0.1;
  const percent = (remainingSq / refreshIntervalSq * 100);
  boxSq.style.setProperty("--progress", percent + "%");
  if (remainingSq <= 0) loadQuoteSq();
}

loadQuoteSq();
setInterval(updateProgressSq, 100);
