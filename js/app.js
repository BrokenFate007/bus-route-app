let upcomingBuses = [];
let allRoutes = [];
let routeRuns = []; // future use

// These will be populated from loaded data
let fromPlaces = [];
let toPlaces = [];
let days = [];

/* ================= DOM CACHE ================= */
const resultsDiv = document.getElementById("results");

/* Journey planner (inside campus) */
const journeyDay = document.getElementById("journeyDay");
const journeyFrom = document.getElementById("journeyFrom");
const journeyTo = document.getElementById("journeyTo");
const journeyBtn = document.getElementById("journeySearch");
const journeyResults = document.getElementById("journeyResults");

/* 12-hour picker */
const journeyHour = document.getElementById("journeyHour");
const journeyMinute = document.getElementById("journeyMinute");
const journeyPeriod = document.getElementById("journeyPeriod");

/* Toggle */
const journeyToggle = document.getElementById("journeyToggle");
const journeyPanel = document.getElementById("journeyPanel");
const journeySection = document.querySelector(".journey");

let activeDirection = null;

const btnNilaToSahyadri = document.getElementById("btnNilaToSahyadri");
const btnSahyadriToNila = document.getElementById("btnSahyadriToNila");

btnNilaToSahyadri.addEventListener("click", () => {
  setDirection("Nila", "Sahyadri");
  setActiveButton(btnNilaToSahyadri);
});

btnSahyadriToNila.addEventListener("click", () => {
  setDirection("Sahyadri", "Nila");
  setActiveButton(btnSahyadriToNila);
});

function setDirection(from, to) {
  activeDirection = { from, to };
  updateResult(); // FIXED: was updateNextBuses()
}

function setActiveButton(activeBtn) {
  document.querySelectorAll(".dir-btn").forEach(btn =>
    btn.classList.remove("active")
  );
  activeBtn.classList.add("active");
}


/* ================= FORMATTERS ================= */
function to12Hour(time24) {
  let [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${period}`;
}

function getJourneyTime24() {
  const h = Number(journeyHour.value);
  const m = journeyMinute.value;
  const p = journeyPeriod.value;

  if (!h || !m || !p) return null;

  let hour24 = h % 12;
  if (p === "PM") hour24 += 12;

  return `${String(hour24).padStart(2, "0")}:${m}`;
}

/* ================= EXTRACT UNIQUE VALUES ================= */
function extractUniqueValues(routes) {
  const fromSet = new Set();
  const toSet = new Set();
  const daySet = new Set();

  routes.forEach(route => {
    fromSet.add(route.from);
    toSet.add(route.to);
    daySet.add(route.dayType);
  });

  fromPlaces = Array.from(fromSet).sort();
  toPlaces = Array.from(toSet).sort();
  days = Array.from(daySet);
}

/* ================= LOAD DATA (ONCE) ================= */
Promise.all([
  loadRoutes(),
  loadRouteRuns()
])
  .then(([routes, runs]) => {
    allRoutes = routes;
    routeRuns = runs;

    // FIXED: Extract unique values from loaded data
    extractUniqueValues(routes);

    populateSelect(journeyFrom, fromPlaces);
    populateSelect(journeyTo, toPlaces);
    populateSelect(journeyDay, days);

    setJourneyDayToToday(days);

    populateTimePicker();
    updateResult();

    console.log("Flat routes:", routes.length);
    console.log("Route runs:", runs.length);
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

function setJourneyDayToToday(availableDays) {
  if (!journeyDay) return;

  const jsDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  const today = jsDays[new Date().getDay()];

  // Only auto-select if today exists in route data
  if (availableDays.includes(today)) {
    journeyDay.value = today;
  }
}

function populateTimePicker() {
  if (journeyHour.options.length > 1) return; // prevent duplicates

  for (let h = 1; h <= 12; h++) {
    journeyHour.add(new Option(h, h));
  }

  for (let m = 0; m < 60; m += 5) {
    const mm = String(m).padStart(2, "0");
    journeyMinute.add(new Option(mm, mm));
  }
}

/* ================= NEXT BUS ================= */
function updateResult() {
  resultsDiv.innerHTML = "";

  if (!activeDirection) {
    resultsDiv.textContent = "Select a direction";
    return;
  }

  const { from, to } = activeDirection;

  upcomingBuses = findUpcomingBuses(
    allRoutes,
    from,
    to,
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
  const row = document.createElement("div");
  row.className = "bus-row";
  
  const label = document.createElement("div");
  label.className = `label${isNext ? " next" : ""}`;
  label.textContent = isNext ? "Next Bus" : "";
  row.appendChild(label);

  const rightGroup = document.createElement("div");
  rightGroup.className = "right-group";
  
  const time = document.createElement("span");
  time.className = `time${isNext ? " next" : ""}`;
  time.textContent = to12Hour(bus.time);
  rightGroup.appendChild(time);

  const count = document.createElement("span");
  count.className = "count";
  count.textContent = `${bus.count} bus${bus.count > 1 ? "es" : ""}`;
  rightGroup.appendChild(count);

  const countdown = document.createElement("span");
  countdown.className = "countdown";
  countdown.dataset.time = bus.time;
  rightGroup.appendChild(countdown);
  
  row.appendChild(rightGroup);
  resultsDiv.appendChild(row);
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

/* ================= JOURNEY PLANNER (INSIDE CAMPUS) ================= */
journeyBtn.addEventListener("click", () => {
  journeyResults.innerHTML = "";

  const time24 = getJourneyTime24();
  
  if (!time24) {
    journeyResults.textContent = "Select day, time and stops";
    return;
  }

  const [selH, selM] = time24.split(":").map(Number);
  const selectedMinutes = selH * 60 + selM;

  if (
    !journeyDay.value ||
    !journeyFrom.value ||
    !journeyTo.value
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
    2,
    2
  );

  if (buses.length === 0) {
    journeyResults.textContent = "No buses around this time";
    return;
  }

  buses.forEach(bus => {
    const [h, m] = bus.time.split(":").map(Number);
    const busMinutes = h * 60 + m;

    const isEarlier = busMinutes < selectedMinutes;

    const row = document.createElement("div");
    row.className = `journey-row ${isEarlier ? "earlier" : "upcoming"}`;

    row.innerHTML = `
      <span class="bus-arrow">${isEarlier ? "↑" : "↓"}</span>
      <span class="bus-time">${to12Hour(bus.time)}</span>
      <span class="bus-count">
        : ${bus.count} bus${bus.count > 1 ? "es" : ""}
      </span>
    `;

    journeyResults.appendChild(row);
  });
});

/* ================= TOGGLE ================= */
if (journeyToggle && journeyPanel && journeySection) {
  journeyToggle.addEventListener("click", () => {
    journeyPanel.classList.toggle("hidden");
    journeySection.classList.toggle("open");
  });
}

/* ================= EVENTS ================= */
setInterval(updateCountdowns, 1000);