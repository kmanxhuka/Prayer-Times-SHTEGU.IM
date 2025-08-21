let refreshIntervalAr = 60;
let remainingAr = refreshIntervalAr;

async function loadQuoteAr() {
  const ar = await fetch("/api/quotes-ar").then(r => r.json());
  if (ar.quote) {
    document.getElementById("quotesAr").innerHTML = ar.quote;
    refreshIntervalAr = Math.min(120, Math.max(20, ar.quote.length * 1.2 / 10));
    remainingAr = refreshIntervalAr;
  }
}

function updateProgressAr() {
  if (remainingAr > 0) remainingAr -= 0.1;
  document.getElementById("progressAr").style.width =
    (remainingAr / refreshIntervalAr * 100) + "%";
  if (remainingAr <= 0) loadQuoteAr();
}

loadQuoteAr();
setInterval(updateProgressAr, 100);
