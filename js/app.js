let upcomingBuses = [];
let allRoutes = [];

/* ================= DOM CACHE ================= */
const fromSelect = document.getElementById("fromSelect");
const toSelect = document.getElementById("toSelect");
const resultsDiv = document.getElementById("results");

/* Journey planner elements */
const journeyDay = document.getElementById("journeyDay");
const journeyFrom = document.getElementById("journeyFrom");
const journeyTo = document.getElementById("journeyTo");
const journeyBtn = document.getElementById("journeySearch");
const journeyResults = document.getElementById("journeyResults");

/* 12-hour picker elements */
const journeyHour = document.getElementById("journeyHour");
const journeyMinute = document.getElementById("journeyMinute");
const journeyPeriod = document.getElementById("journeyPeriod");

/* Toggle elements */
const journeyToggle = document.getElementById("journeyToggle");
const journeyPanel = document.getElementById("journeyPanel");
const journeySection = document.querySelector(".journey");

/* ================= FORMATTERS ================= */
function to12Hour(time24) {
  let [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${period}`;
}

/* Convert custom picker → 24h */
function getJourneyTime24() {
  const h = Number(journeyHour.value);
  const m = journeyMinute.value;
  const p = journeyPeriod.value;

  if (!h || !m || !p) return null;

  let hour24 = h % 12;
  if (p === "PM") hour24 += 12;

  return `${String(hour24).padStart(2, "0")}:${m}`;
}

/* ================= LOAD DATA ================= */
loadRoutes()
  .then(routes => {
    allRoutes = routes;

    const fromPlaces = [...new Set(routes.map(r => r.from))];
    const toPlaces = [...new Set(routes.map(r => r.to))];
    const days = [...new Set(routes.map(r => r.dayType))];

    populateSelect(fromSelect, fromPlaces);
    populateSelect(toSelect, toPlaces);

    populateSelect(journeyFrom, fromPlaces);
    populateSelect(journeyTo, toPlaces);
    populateSelect(journeyDay, days);

    populateTimePicker();
    updateResult();
  })
  .catch(err => {
    resultsDiv.textContent = "Failed to load bus data";
    console.error(err);
  });

/* ================= HELPERS ================= */
function populateSelect(selectEl, values) {
  if (!selectEl) return;
  selectEl.innerHTML = `<option value="">Select</option>`;
  values.forEach(v => selectEl.add(new Option(v, v)));
}


  function populateTimePicker() {
  // Hours: 1–12
  for (let h = 1; h <= 12; h++) {
    journeyHour.add(new Option(h, h));
  }

  // Minutes: every 5 minutes (00–55)
  for (let m = 0; m < 60; m += 5) {
    const mm = String(m).padStart(2, "0");
    journeyMinute.add(new Option(mm, mm));
  }
}


/* ================= NEXT BUS ================= */
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

function addResultRow(bus, isNext) {
  const label = document.createElement("div");
  label.className = `label${isNext ? " next" : ""}`;
  label.textContent = isNext ? "Next Bus" : "";
  resultsDiv.appendChild(label);

  const time = document.createElement("div");
  time.className = isNext ? "next" : "";
  time.textContent = to12Hour(bus.time);
  resultsDiv.appendChild(time);

  const count = document.createElement("div");
  count.textContent = `${bus.count} bus${bus.count > 1 ? "es" : ""}`;
  resultsDiv.appendChild(count);

  const countdown = document.createElement("div");
  countdown.className = "countdown";
  countdown.dataset.time = bus.time;
  resultsDiv.appendChild(countdown);
}

/* ================= COUNTDOWN ================= */
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

/* ================= JOURNEY PLANNER ================= */
journeyBtn.addEventListener("click", () => {
  journeyResults.innerHTML = "";

  const time24 = getJourneyTime24();
  if (
    !journeyDay.value ||
    !journeyFrom.value ||
    !journeyTo.value ||
    !time24
  ) {
    journeyResults.textContent = "Select day, time and stops";
    return;
  }

  const buses = findBusesAroundTime(
    allRoutes,
    journeyDay.value,
    journeyFrom.value,
    journeyTo.value,
    time24,
    1,
    1
  );

  if (buses.length === 0) {
    journeyResults.textContent = "No buses around this time";
    return;
  }

  buses.forEach(bus => {
    const row = document.createElement("div");
    row.className = "journey-row";
    row.textContent =
      `${to12Hour(bus.time)} : ${bus.count} bus${bus.count > 1 ? "es" : ""}`;
    journeyResults.appendChild(row);
  });
});

/* ================= TOGGLE ================= */
journeyToggle.addEventListener("click", () => {
  journeyPanel.classList.toggle("hidden");
  journeySection.classList.toggle("open");
});

/* ================= EVENTS ================= */
fromSelect.addEventListener("change", updateResult);
toSelect.addEventListener("change", updateResult);
setInterval(updateCountdowns, 1000);
