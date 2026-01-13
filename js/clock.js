function startClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;

  // Create elements once
  const dateEl = document.createElement("div");
  dateEl.className = "date";

  const timeEl = document.createElement("div");
  timeEl.className = "time";

  clock.appendChild(dateEl);
  clock.appendChild(timeEl);

  function tick() {
    const now = new Date();

    timeEl.textContent = now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });

    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  tick();                 // immediate render
  setInterval(tick, 1000);
}

startClock();
