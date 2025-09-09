(function() {
  const theme = localStorage.getItem('theme') || 'default';
  document.body.className = `theme-${theme}`;

  // apply saved background (if any) directly on body
  const bg = localStorage.getItem('bg');
  if (bg) {
    document.body.style.setProperty('--bg-image', `url('${bg}')`);
  }
})();

function setTheme(theme) {
  document.body.className = `theme-${theme}`;
  localStorage.setItem('theme', theme);
}
window.setTheme = setTheme;

// new: background setter for admin
function setBackground(url) {
  localStorage.setItem('bg', url);
  document.body.style.setProperty('--bg-image', `url('${url}')`);
}
window.setBackground = setBackground;
