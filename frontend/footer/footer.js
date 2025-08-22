function updateFooterClock() {
  const clock = document.getElementById("footerClock");
  if (!clock) {
    return;
  }
  clock.textContent = dayjs().format("HH:mm:ss");
}

setInterval(updateFooterClock, 1000);
updateFooterClock();
