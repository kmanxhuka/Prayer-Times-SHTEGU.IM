dayjs.locale('sq');
const $ = sel => document.querySelector(sel);
let prayers = [];
let currentIndex = -1;

const hijriMonths = [
  "Muharrem","Safer","Rebiu Evel","Rebiu Ahir","Xhumada Ula","Xhumada Ahire",
  "Rexheb","Shaban","Ramadan","Sheval","Dhul Ka'de","Dhul Hixhe"
];
const gregMonths = [
  "Janar","Shkurt","Mars","Prill","Maj","Qershor","Korrik","Gusht","Shtator","Tetor","Nëntor","Dhjetor"
];

// === PRAYER TIMES RENDER ===
function render() {
  const box = $('#timesBox'); 
  box.innerHTML = '';
  prayers.forEach(p => {
    const div = document.createElement('div');
    div.className = 'prayer';
    div.innerHTML = `<div class="prayer-name">${p.name}</div><div class="prayer-time">${p.time}</div>`;
    box.appendChild(div);
  });
}

function tick() {
  if (prayers.length === 0) return;
  const now = dayjs();
  let idx = -1;
  for (let i = 0; i < prayers.length; i++) {
    if (now.isAfter(prayers[i].at)) idx = i;
  }
  currentIndex = idx;
  render();

  const next = prayers[idx + 1];
  if (next) {
    const diff = next.at.diff(now);
    const mins = Math.floor(diff / 60000);
    if (mins > 59) {
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      $('#nextTime').textContent = `${hours} orë e ${remMins.toString().padStart(2,'0')} min`;
    } else {
      $('#nextTime').textContent = `${mins} min`;
    }
    $('#nextLabel').textContent = `${next.name} edhe`;
  } else {
    $('#nextLabel').textContent = 'Dita ka përfunduar';
    $('#nextTime').textContent = '';
  }

  $('#currentClock').textContent = now.format('HH:mm');
  $('#weekday').textContent = now.format('dddd');
  $('#gregDate').textContent = `${now.date()} ${gregMonths[now.month()]} ${now.year()}`;
}

async function loadHijri() {
  const today = dayjs().format('DD-MM-YYYY');
  try {
    const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${today}`);
    const data = await res.json();
    if (data.data && data.data.hijri) {
      const hijri = data.data.hijri;
      const d = hijri.day;
      const m = parseInt(hijri.month.number, 10);
      const y = hijri.year;
      const monthName = hijriMonths[m - 1] || hijri.month.en;
      $('#hijriDate').textContent = `${d} ${monthName} (${m}) ${y}`;
    }
  } catch (e) {
    $('#hijriDate').textContent = '—';
  }
}

async function loadCsv(text) {
  const parsed = Papa.parse(text.trim());
  const headers = parsed.data[0].map(h => h.toLowerCase());
  const idx = {
    day: headers.findIndex(h => h.includes('day')),
    month: headers.findIndex(h => h.includes('month')),
    fajr: headers.findIndex(h => h.includes('fajr') || h.includes('imsak')),
    dhuhr: headers.findIndex(h => h.includes('dhuhr') || h.includes('zuhr')),
    asr: headers.findIndex(h => h.includes('asr')),
    maghrib: headers.findIndex(h => h.includes('maghrib')),
    isha: headers.findIndex(h => h.includes('isha'))
  };

  const today = dayjs();
  const row = parsed.data.find((r, i) => {
    if (i === 0) return false;
    const d = parseInt(r[idx.day], 10);
    const m = parseInt(r[idx.month], 10);
    return d === today.date() && m === today.month() + 1;
  });

  if (!row) { 
    alert('Nuk u gjet rreshti për sot'); 
    return; 
  }

  prayers = [
    { key: 'fajr', name: 'Sabahu' },
    { key: 'dhuhr', name: 'Dreka' },
    { key: 'asr', name: 'Ikindia' },
    { key: 'maghrib', name: 'Akshami' },
    { key: 'isha', name: 'Jacia' }
  ].map(item => {
    const col = idx[item.key];
    const time = row[col];
    if (!time || !time.includes(':')) return null;
    const [h, m] = time.split(':').map(Number);
    const at = today.startOf('day').set('hour', h).set('minute', m).set('second', 0);
    return { name: item.name, time, at };
  }).filter(Boolean);

  setInterval(tick, 1000); 
  tick();
}

fetch("prayer_times.csv").then(r => r.text()).then(loadCsv);
loadHijri();