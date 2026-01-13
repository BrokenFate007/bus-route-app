function startClock() {
  const clock = document.getElementById("clock");

  setInterval(() => {
    const now = new Date();

    const time = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });

    const date = now.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    clock.innerHTML = `
      <div class="date">${date}</div>
      <div class="time">${time}</div>
    `;
  }, 1000);
}

startClock();
