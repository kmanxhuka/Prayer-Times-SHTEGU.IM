let refreshIntervalAr = 60;
let remainingAr = refreshIntervalAr;

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
    fitQuoteFont(quoteEl, 22, 12);

    // update refresh interval
    refreshIntervalAr = Math.min(90, Math.max(5, body.length * 1.2 / 20));
    remainingAr = refreshIntervalAr;
    progressAr.style.width = "100%";
  }
}

const progressAr = document.getElementById("progressAr");

function updateProgressAr() {
  if (remainingAr > 0) remainingAr -= 0.1;
  const percent = (remainingAr / refreshIntervalAr * 100);
  progressAr.style.width = percent + "%";
  if (remainingAr <= 0) loadQuoteAr();
}

loadQuoteAr();
setInterval(updateProgressAr, 100);
