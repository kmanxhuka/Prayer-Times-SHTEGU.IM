// === Theme init ===
const select = document.getElementById('themeSelect');
const currentTheme = localStorage.getItem('theme') || 'default';
select.value = currentTheme;

// === Background init ===
const currentBg = localStorage.getItem('bg');
const thumbs = document.querySelectorAll('.thumb');
const urlInputs = document.querySelectorAll('.bg-url');

function setActive(btn) {
  thumbs.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// Mark saved background as active
thumbs.forEach(btn => {
  if (btn.dataset.bg === currentBg) setActive(btn);
  btn.addEventListener('click', () => {
    // only mark active, don’t apply yet
    setActive(btn);
  });
});

// Hook up custom URL inputs
urlInputs.forEach((input, i) => {
  const btn = thumbs[i];
  input.addEventListener('change', () => {
    const url = input.value.trim();
    if (!url) return;
    btn.dataset.bg = url;
    btn.querySelector('img').src = url;
    setActive(btn); // mark selected, not applied yet
  });
});

// === Unsplash search ===
const searchInput = document.getElementById('bgSearchInput');
const searchBtn = document.getElementById('bgSearchBtn');
const dynamicThumbs = document.querySelector('.dynamic-thumbs');

const UNSPLASH_KEY = "3vHYsmvjhCV7Mx_cekdL2h__kn5CTZ1y3DRk_p4oEJE";

async function searchUnsplash(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape&client_id=${UNSPLASH_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

function renderThumbs(images) {
  dynamicThumbs.innerHTML = "";
  images.forEach(img => {
    const btn = document.createElement('button');
    btn.className = "thumb";
    btn.dataset.bg = img.urls.full;
    btn.innerHTML = `<img src="${img.urls.small}" alt="${img.alt_description || "Unsplash"}">`;
    btn.addEventListener('click', () => {
      setActive(btn); // only mark, don’t apply yet
    });
    dynamicThumbs.appendChild(btn);
  });
}

searchBtn.addEventListener('click', async () => {
  const query = searchInput.value.trim();
  if (!query) return;
  const imgs = await searchUnsplash(query);
  renderThumbs(imgs);
});

// === Iqama offsets ===
const iqamaKeys = ["fajr","dhuhr","asr","maghrib","isha"];
const saveBtn = document.getElementById("saveIqamaBtn");

// Load saved values
iqamaKeys.forEach(key => {
  const input = document.getElementById("iqama-" + key);
  const saved = localStorage.getItem("iqama_" + key);
  if (saved !== null) input.value = saved;
});

// Save button
saveBtn.addEventListener("click", () => {
  // Save iqama offsets
  iqamaKeys.forEach(key => {
    const input = document.getElementById("iqama-" + key);
    localStorage.setItem("iqama_" + key, input.value);
  });

  // Save theme
  localStorage.setItem("theme", select.value);

  // Save background (get currently active thumb)
  const activeThumb = document.querySelector(".thumb.active");
  if (activeThumb) {
    localStorage.setItem("bg", activeThumb.dataset.bg);
  }

  // trigger storage event manually for same-tab update
  localStorage.setItem("admin_saved", Date.now().toString());
});
