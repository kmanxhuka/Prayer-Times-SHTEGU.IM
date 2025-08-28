let refreshIntervalSq = 60;

// === Helper: auto-fit font size (shrink only, robust) ===
function fitQuoteFont(quoteEl, baseSize = 2, minSize = 1.5) {
  const parent = quoteEl.parentElement;

  // reset to base font size every time
  let fontSize = baseSize;
  quoteEl.style.fontSize = fontSize + "vmax";

  // shrink until it fits inside parent
  while (quoteEl.scrollHeight > parent.clientHeight && fontSize > minSize) {
    fontSize -= 0.1;
    quoteEl.style.fontSize = fontSize + "vmax";
  }
}

const progressSq = document.getElementById("progressSq");

async function loadQuoteSq() {
  try {
    const sq = await fetch("/api/quotes-sq").then(r => r.json());
    if (!sq || !sq.quote) return;

    const parts = sq.quote.trim().split("\n");
    const title = parts.pop();
    const body = parts.join("\n");

    const quoteEl = document.getElementById("quotesSq");
    const quoteTitleEl = document.getElementById("quoteTitleSq");

    // update content
    quoteEl.innerHTML = body;
    quoteTitleEl.textContent = title;

    // auto-fit font size
    fitQuoteFont(quoteEl, 2, 1.5);

    // update refresh interval based on content length (seconds)
    refreshIntervalSq = Math.min(90, Math.max(5, body.length * 1.2 / 20));

    // Ensure bar starts full, then restart width-based animation
    progressSq.style.width = "100%";
    progressSq.style.animation = "none";
    // force reflow to allow the same animation name to restart
    void progressSq.offsetWidth;
    progressSq.style.animation = `progressShrink ${refreshIntervalSq}s linear forwards`;
  } catch (e) {
    // If fetch fails, try again next time the current animation ends
    console.error("Failed to load Albanian quote:", e);
  }
}

// when the animation ends (width reached 0), fetch the next quote
progressSq.addEventListener("animationend", loadQuoteSq);

// initial load
loadQuoteSq();