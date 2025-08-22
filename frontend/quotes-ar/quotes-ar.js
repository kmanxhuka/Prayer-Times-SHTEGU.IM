let refreshIntervalAr = 60;
let remainingAr = refreshIntervalAr;

async function loadQuoteAr() {
  const ar = await fetch("/api/quotes-ar").then(r => r.json());
  if (ar.quote) {
    const parts = ar.quote.trim().split("\n");
    const title = parts.pop();
    const body = parts.join("\n");
    document.getElementById("quotesAr").innerHTML = body;
    quoteTitleAr.textContent = title;
    refreshIntervalAr = Math.min(120, Math.max(20, body.length * 1.2 / 10));
    remainingAr = refreshIntervalAr;
    progressAr.style.width = "100%";
  }
}

const progressAr = document.getElementById("progressAr");
const quoteTitleAr = document.getElementById("quoteTitleAr");

function updateProgressAr() {
  if (remainingAr > 0) remainingAr -= 0.1;
  const percent = (remainingAr / refreshIntervalAr * 100);
  progressAr.style.width = percent + "%";
  if (remainingAr <= 0) loadQuoteAr();
}

loadQuoteAr();
setInterval(updateProgressAr, 100);
