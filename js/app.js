let upcomingBuses = [];
let allRoutes = [];
let routeRuns = [];
let outsideRoutes = [];

// These will be populated from loaded data
let fromPlaces = [];
let toPlaces = [];
let days = [];
let outsideDays = [];
let outsideDestinations = [];

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

/* Outside Campus */
const outsideCampusToggle = document.getElementById("outsideCampusToggle");
const outsideCampusPanel = document.getElementById("outsideCampusPanel");
const outsideCampusSection = document.querySelector(".journey.outside-campus");
const outsideDay = document.getElementById("outsideDay");
const outsideTimePeriod = document.getElementById("outsideTimePeriod");
const outsideDestination = document.getElementById("outsideDestination");
const outsideSearch = document.getElementById("outsideSearch");
const outsideResults = document.getElementById("outsideResults");

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
  updateResult();
}

function setActiveButton(activeBtn) {
  document.querySelectorAll(".dir-btn").forEach(btn =>
    btn.classList.remove("active")
  );
  activeBtn.classList.add("active");
}

// At the top of app.js, after the DOM cache section
// (This assumes analytics.js is loaded)

// Update direction button clicks
btnNilaToSahyadri.addEventListener("click", () => {
  setDirection("Nila", "Sahyadri");
  setActiveButton(btnNilaToSahyadri);
  
  // TRACK THIS EVENT
  trackDirectionClick("Nila", "Sahyadri");
});

btnSahyadriToNila.addEventListener("click", () => {
  setDirection("Sahyadri", "Nila");
  setActiveButton(btnSahyadriToNila);
  
  // TRACK THIS EVENT
  trackDirectionClick("Sahyadri", "Nila");
});

// Update journey search
journeyBtn.addEventListener("click", () => {
  journeyResults.innerHTML = "";
  const time24 = getJourneyTime24();
  
  if (!time24 || !journeyDay.value || !journeyFrom.value || !journeyTo.value) {
    journeyResults.textContent = "Select day, time and stops";
    return;
  }

  // TRACK THIS EVENT
  trackJourneySearch(
    journeyDay.value,
    journeyFrom.value,
    journeyTo.value,
    time24
  );

  // ... rest of your existing code
});

// Update outside campus search
outsideSearch.addEventListener("click", () => {
  outsideResults.innerHTML = "";

  if (!outsideDay.value) {
    outsideResults.textContent = "Please select a day";
    return;
  }

  if (outsideDay.value === "Sunday") {
    outsideResults.innerHTML = `
      <div class="no-buses-message">
        No buses available on Sundays
      </div>
    `;
    return;
  }

  if (!outsideTimePeriod.value || !outsideDestination.value) {
    outsideResults.textContent = "Please select time and destination";
    return;
  }

  // TRACK THIS EVENT
  trackOutsideSearch(
    outsideDay.value,
    outsideDestination.value,
    outsideTimePeriod.value
  );

  // ... rest of your existing code
});

// Update journey toggle
if (journeyToggle && journeyPanel && journeySection) {
  journeyToggle.addEventListener("click", () => {
    const isOpening = journeyPanel.classList.contains("hidden");
    journeyPanel.classList.toggle("hidden");
    journeySection.classList.toggle("open");
    
    // TRACK THIS EVENT
    trackToggle("Journey Planner", isOpening);
  });
}

// Update outside campus toggle
if (outsideCampusToggle && outsideCampusPanel && outsideCampusSection) {
  outsideCampusToggle.addEventListener("click", () => {
    const isOpening = outsideCampusPanel.classList.contains("hidden");
    outsideCampusPanel.classList.toggle("hidden");
    outsideCampusSection.classList.toggle("open");
    
    // TRACK THIS EVENT
    trackToggle("Outside Campus Buses", isOpening);
  });
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

/* ================= TIME PERIOD HELPERS ================= */
function getCurrentTimePeriod() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 6 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 15) {
    return "afternoon";
  } else if (hour >= 15 && hour < 24) {
    return "evening";
  }
  return "morning";
}

function getTimePeriodForTime(time24) {
  const [hour] = time24.split(":").map(Number);
  
  if (hour >= 6 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 15) {
    return "afternoon";
  } else if (hour >= 15 && hour < 24) {
    return "evening";
  }
  return "morning";
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

function extractOutsideValues(routes) {
  const daySet = new Set();
  const destSet = new Set();

  routes.forEach(route => {
    daySet.add(route.dayType);
    if (route.stops) {
      route.stops.forEach(stop => destSet.add(stop));
    }
  });

  // Always include all days
  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  outsideDays = allDays;
  outsideDestinations = Array.from(destSet).sort();
}

/* ================= SMART DESTINATION FILTERING ================= */
function getAvailableDestinations(day, timePeriod) {
  if (!day || day === "Sunday") {
    return [];
  }

  const destSet = new Set();

  outsideRoutes.forEach(route => {
    // Match day
    if (route.dayType !== day) return;

    // Filter by time period if selected
    if (timePeriod && timePeriod !== "" && timePeriod !== "all") {
      const busHour = parseInt(route.departureTime.split(":")[0]);
      
      if (timePeriod === "morning" && (busHour < 6 || busHour >= 12)) {
        return;
      }
      if (timePeriod === "afternoon" && (busHour < 12 || busHour >= 15)) {
        return;
      }
      if (timePeriod === "evening" && (busHour < 15 || busHour >= 24)) {
        return;
      }
    }

    // Add all stops from this route
    if (route.stops) {
      route.stops.forEach(stop => destSet.add(stop));
    }
  });

  return Array.from(destSet).sort();
}

function updateDestinationDropdown() {
  const selectedDay = outsideDay.value;
  const selectedTimePeriod = outsideTimePeriod.value;

  if (!selectedDay) {
    outsideDestination.innerHTML = '<option value="">Select day first</option>';
    outsideDestination.disabled = true;
    return;
  }

  if (selectedDay === "Sunday") {
    outsideDestination.innerHTML = '<option value="">No buses on Sunday</option>';
    outsideDestination.disabled = true;
    return;
  }

  const availableDestinations = getAvailableDestinations(selectedDay, selectedTimePeriod);

  if (availableDestinations.length === 0) {
    outsideDestination.innerHTML = '<option value="">No buses at this time</option>';
    outsideDestination.disabled = true;
    return;
  }

  outsideDestination.disabled = false;
  outsideDestination.innerHTML = '<option value="">Where to?</option>';
  availableDestinations.forEach(dest => {
    outsideDestination.add(new Option(dest, dest));
  });
}

/* ================= LOAD DATA (ONCE) ================= */
Promise.all([
  loadRoutes(),
  loadRouteRuns(),
  loadOutsideRoutes()
])
  .then(([routes, runs, outside]) => {
    allRoutes = routes;
    routeRuns = runs;
    outsideRoutes = outside;

    extractUniqueValues(routes);
    extractOutsideValues(outside);

    populateSelect(journeyFrom, fromPlaces);
    populateSelect(journeyTo, toPlaces);
    populateSelect(journeyDay, days);

    // Populate outside campus day dropdown
    populateSelect(outsideDay, outsideDays);

    setJourneyDayToToday(days);
    setJourneyDayToToday(outsideDays, outsideDay);
    
    // Auto-select current time period
    outsideTimePeriod.value = getCurrentTimePeriod();

    // Initialize destination dropdown based on current selections
    updateDestinationDropdown();

    populateTimePicker();
    updateResult();

    console.log("Flat routes:", routes.length);
    console.log("Route runs:", runs.length);
    console.log("Outside routes:", outside.length);
  })
  .catch(err => {
    resultsDiv.textContent = "Failed to load bus data";
    console.error(err);
  });

/* ================= HELPERS ================= */
function populateSelect(selectEl, values) {
  if (!selectEl) return;
  const firstOption = selectEl.options[0].text;
  selectEl.innerHTML = `<option value="">${firstOption}</option>`;
  values.forEach(v => selectEl.add(new Option(v, v)));
}

function setJourneyDayToToday(availableDays, selectElement = journeyDay) {
  if (!selectElement) return;

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

  if (availableDays.includes(today)) {
    selectElement.value = today;
  }
}

function populateTimePicker() {
  if (journeyHour.options.length > 1) return;

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

/* ================= OUTSIDE CAMPUS BUSES ================= */
outsideSearch.addEventListener("click", () => {
  outsideResults.innerHTML = "";

  if (!outsideDay.value) {
    outsideResults.textContent = "Please select a day";
    return;
  }

  // Check if Sunday
  if (outsideDay.value === "Sunday") {
    outsideResults.innerHTML = `
      <div class="no-buses-message">
        No buses available on Sundays
      </div>
    `;
    return;
  }

  if (!outsideTimePeriod.value || !outsideDestination.value) {
    outsideResults.textContent = "Please select time and destination";
    return;
  }

  const buses = findOutsideBuses(
    outsideRoutes,
    outsideDay.value,
    outsideDestination.value,
    outsideTimePeriod.value
  );

  if (buses.length === 0) {
    outsideResults.textContent = "No buses found for this route";
    return;
  }

  buses.forEach(bus => {
    const card = document.createElement("div");
    card.className = `outside-bus-card ${bus.departed ? 'departed' : ''}`;

    card.innerHTML = `
      <div class="departure-time">
        <span class="icon">${bus.departed ? '⏱️' : '🚌'}</span>
        ${to12Hour(bus.departureTime)}
        ${bus.departed ? '<span class="departed-badge">Already departed</span>' : ''}
      </div>
      <div class="route-info">
        From: <strong>${bus.origin}</strong>
      </div>
      <div class="route-stops">
        ${bus.routeDescription}
      </div>
      ${bus.returnTime && !bus.departed ? `<div class="return-time">↩ Returns: ${bus.returnTime}</div>` : ''}
    `;

    outsideResults.appendChild(card);
  });
});


/* ================= EVENT LISTENERS FOR SMART FILTERING ================= */
// Update destinations when day changes
outsideDay.addEventListener("change", () => {
  updateDestinationDropdown();
  outsideResults.innerHTML = "";
});

// Update destinations when time period changes
outsideTimePeriod.addEventListener("change", () => {
  updateDestinationDropdown();
  outsideResults.innerHTML = "";
});

/* ================= TOGGLE (Campus Journey) ================= */
if (journeyToggle && journeyPanel && journeySection) {
  journeyToggle.addEventListener("click", () => {
    journeyPanel.classList.toggle("hidden");
    journeySection.classList.toggle("open");
  });
}

/* ================= TOGGLE (Outside Campus) ================= */
if (outsideCampusToggle && outsideCampusPanel && outsideCampusSection) {
  outsideCampusToggle.addEventListener("click", () => {
    outsideCampusPanel.classList.toggle("hidden");
    outsideCampusSection.classList.toggle("open");
  });
}

/* ================= EVENTS ================= */
setInterval(updateCountdowns, 1000);
