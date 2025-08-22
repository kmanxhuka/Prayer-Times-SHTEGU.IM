let refreshIntervalSq = 60;
let remainingSq = refreshIntervalSq;

// === Helper: auto-fit font size (shrink only, robust) ===
function fitQuoteFont(quoteEl, baseSize = 22, minSize = 12) {
  const parent = quoteEl.parentElement;

  // reset to base font size every time
  let fontSize = baseSize;
  quoteEl.style.fontSize = fontSize + "px";

  // shrink until it fits inside parent
  while (quoteEl.scrollHeight > parent.clientHeight && fontSize > minSize) {
    fontSize -= 1;
    quoteEl.style.fontSize = fontSize + "px";
  }
}

async function loadQuoteSq() {
  const sq = await fetch("/api/quotes-sq").then(r => r.json());
  if (sq.quote) {
    const parts = sq.quote.trim().split("\n");
    const title = parts.pop();
    const body = parts.join("\n");

    const quoteEl = document.getElementById("quotesSq");
    const quoteTitleEl = document.getElementById("quoteTitleSq");

    // update content
    quoteEl.innerHTML = body;
    quoteTitleEl.textContent = title;

    // auto-fit font size
    fitQuoteFont(quoteEl, 22, 12);

    // update refresh interval
    refreshIntervalSq = Math.min(90, Math.max(5, body.length * 1.2 / 20));
    remainingSq = refreshIntervalSq;
    progressSq.style.transform = "scaleX(1)"; // ✅ reset full bar
  }
}

const progressSq = document.getElementById("progressSq");

function updateProgressSq() {
  if (remainingSq > 0) remainingSq -= 0.1;
  const percent = (remainingSq / refreshIntervalSq * 100);
  progressSq.style.transform = `scaleX(${percent / 100})`; // ✅ smooth shrink
  if (remainingSq <= 0) loadQuoteSq();
}

loadQuoteSq();
setInterval(updateProgressSq, 100);