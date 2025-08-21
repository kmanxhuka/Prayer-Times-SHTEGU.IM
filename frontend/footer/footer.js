function updateFooterClock() {
  const now = dayjs().format("HH:mm:ss");
  document.getElementById("footerClock").textContent = now;
}

setInterval(updateFooterClock, 1000);
updateFooterClock();
