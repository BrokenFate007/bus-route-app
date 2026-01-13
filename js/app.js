let upcomingBuses = [];
let allRoutes = [];

/* ===== Cache DOM once ===== */
const fromSelect = document.getElementById("fromSelect");
const toSelect = document.getElementById("toSelect");
const resultsDiv = document.getElementById("results");

/* ===== Guard: DOM must exist ===== */
if (!fromSelect || !toSelect || !resultsDiv) {
  console.error("Required DOM elements missing");
}

/* ===== Load data ===== */
loadRoutes()
  .then(routes => {
    allRoutes = routes;

    const fromPlaces = [...new Set(routes.map(r => r.from))];
    const toPlaces   = [...new Set(routes.map(r => r.to))];

    populateSelect(fromSelect, fromPlaces);
    populateSelect(toSelect, toPlaces);

    updateResult();
  })
  .catch(err => {
    resultsDiv.textContent = "Failed to load bus data";
    console.error(err);
  });

/* ===== Helpers ===== */
function populateSelect(selectEl, values) {
  selectEl.innerHTML = "";
  values.forEach(v => selectEl.add(new Option(v, v)));
}

/* ===== Core update ===== */
function updateResult() {
  resultsDiv.innerHTML = "";

  if (!fromSelect.value || !toSelect.value) {
    resultsDiv.textContent = "Select boarding and destination";
    return;
  }

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
    addResultRow(bus, index === 0);
  });

  updateCountdowns();
}

/* ===== Render one row ===== */
function addResultRow(bus, isNext) {
  // Column 1: label
  const label = document.createElement("div");
  label.className = `label${isNext ? " next" : ""}`;
  label.textContent = isNext ? "Next Bus" : "";
  resultsDiv.appendChild(label);

  // Column 2: time
  const time = document.createElement("div");
  time.className = isNext ? "next" : "";
  time.textContent = bus.time;
  resultsDiv.appendChild(time);

  // Column 3: bus count
  const count = document.createElement("div");
  count.textContent = `${bus.count} bus${bus.count > 1 ? "es" : ""}`;
  resultsDiv.appendChild(count);

  // Column 4: countdown
  const countdown = document.createElement("div");
  countdown.className = "countdown";
  countdown.dataset.time = bus.time;
  resultsDiv.appendChild(countdown);
}

/* ===== Countdown updater ===== */
function updateCountdowns() {
  const now = new Date();
  const nowSec =
    now.getHours() * 3600 +
    now.getMinutes() * 60 +
    now.getSeconds();

  document.querySelectorAll(".countdown").forEach(el => {
    const [h, m] = el.dataset.time.split(":").map(Number);
    const busSec = h * 3600 + m * 60;
    const diff = busSec - nowSec;

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

/* ===== Events ===== */
fromSelect.addEventListener("change", updateResult);
toSelect.addEventListener("change", updateResult);
setInterval(updateCountdowns, 1000);
