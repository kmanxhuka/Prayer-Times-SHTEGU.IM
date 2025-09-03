(function() {
  const theme = localStorage.getItem('theme') || 'default';
  document.body.className = `theme-${theme}`;
})();

function setTheme(theme) {
  document.body.className = `theme-${theme}`;
  localStorage.setItem('theme', theme);
}

window.setTheme = setTheme;
