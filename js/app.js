let upcomingBuses = [];
let allRoutes = [];

const fromSelect = document.getElementById("fromSelect");
const toSelect = document.getElementById("toSelect");
const nextBusEl = document.getElementById("nextBus");
const busCountEl = document.getElementById("busCount");

loadRoutes().then(routes => {
  allRoutes = routes;

const fromPlaces = [...new Set(routes.map(r => r.from))];
const toPlaces   = [...new Set(routes.map(r => r.to))];

fromPlaces.forEach(p => fromSelect.add(new Option(p, p)));
toPlaces.forEach(p => toSelect.add(new Option(p, p)));
 updateResult(); 

  });

function updateResult() {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  upcomingBuses = findUpcomingBuses(
    allRoutes,
    fromSelect.value,
    toSelect.value,
    3
  );

  if (upcomingBuses.length === 0) {
    resultsDiv.textContent = "No more buses today";
    return;
  }

  upcomingBuses.forEach((bus, index) => {
    // Column 1: label (only first row)
    const label = document.createElement("div");
    label.className = index === 0 ? "label next" : "label";
    label.textContent = index === 0 ? "Next Bus" : "";
    resultsDiv.appendChild(label);

    // Column 2: time
    const time = document.createElement("div");
    time.className = index === 0 ? "next" : "";
    time.textContent = bus.time;
    resultsDiv.appendChild(time);

    // Column 3: bus count
    const count = document.createElement("div");
    count.textContent =
      `${bus.count} bus${bus.count > 1 ? "es" : ""}`;
    resultsDiv.appendChild(count);

    // Column 4: countdown (updated live)
    const countdown = document.createElement("div");
    countdown.className = "countdown";
    countdown.dataset.time = bus.time;
    resultsDiv.appendChild(countdown);
  });

  updateCountdowns();
}



function updateCountdowns() {
  const now = new Date();
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  document.querySelectorAll(".countdown").forEach(el => {
    const [h, m] = el.dataset.time.split(":").map(Number);
    const busSec = h * 3600 + m * 60;
    let diff = busSec - nowSec;

    if (diff <= 0) {
      el.textContent = "--:--";
      return;
    }

    const mm = Math.floor(diff / 60);
    const ss = diff % 60;
    el.textContent =
      `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  });
}


fromSelect.addEventListener("change", updateResult);
toSelect.addEventListener("change", updateResult);
setInterval(updateCountdowns, 1000);
