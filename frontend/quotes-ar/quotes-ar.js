let refreshIntervalAr = 60;
let remainingAr = refreshIntervalAr;

// === Helper: auto-fit font size (shrink only, robust) ===
function fitQuoteFont(quoteEl, baseSize = 2, minSize = 1. 2) {
  const parent = quoteEl.parentElement;

  // reset to base font size every time
  let fontSize = baseSize;
  quoteEl.style.fontSize = fontSize + "rem";

  // shrink until it fits inside parent
  while (quoteEl.scrollHeight > parent.clientHeight && fontSize > minSize) {
    fontSize -= 1;
    quoteEl.style.fontSize = fontSize + "rem";
  }
}

async function loadQuoteAr() {
  const ar = await fetch("/api/quotes-ar").then(r => r.json());
  if (ar.quote) {
    const parts = ar.quote.trim().split("\n");
    const title = parts.pop();
    const body = parts.join("\n");

    const quoteEl = document.getElementById("quotesAr");
    const quoteTitleEl = document.getElementById("quoteTitleAr");

    // update content
    quoteEl.innerHTML = body;
    quoteTitleEl.textContent = title;

    // auto-fit font size
    fitQuoteFont(quoteEl, 2, 1.2);

    // update refresh interval
    refreshIntervalAr = Math.min(90, Math.max(5, body.length * 1.2 / 20));
    remainingAr = refreshIntervalAr;
    progressAr.style.transform = "scaleX(1)"; // ✅ reset full bar
  }
}

const progressAr = document.getElementById("progressAr");

function updateProgressAr() {
  if (remainingAr > 0) remainingAr -= 0.1;
  const percent = (remainingAr / refreshIntervalAr * 100);
  progressAr.style.transform = `scaleX(${percent / 100})`; // ✅ smooth shrink
  if (remainingAr <= 0) loadQuoteAr();
}

loadQuoteAr();
setInterval(updateProgressAr, 100);
