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

/* ================= iOS PWA DETECTION ================= */
// Detect iOS in standalone mode (PWA)
function isIOSPWA() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // Check window.navigator.standalone first (works on all iOS versions)
  if ('standalone' in navigator && navigator.standalone === true) {
    return isIOS;
  }
  
  // Fallback to matchMedia for iOS 11.3+
  if (window.matchMedia) {
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      return isIOS && isStandalone;
    } catch (e) {
      return false;
    }
  }
  
  return false;
}

/* ================= PASSIVE EVENT LISTENER SUPPORT ================= */
let supportsPassive = false;
try {
  const opts = Object.defineProperty({}, 'passive', {
    get: function() { supportsPassive = true; }
  });
  window.addEventListener('testPassive', null, opts);
  window.removeEventListener('testPassive', null, opts);
} catch (e) {}

/* ================= OPTIMIZED iOS SELECT FIX ================= */
// Only handles event listeners - CSS handles all styling via @supports
function fixIOSSelectDropdowns() {
  if (!isIOSPWA()) return;
  
  console.log('✅ iOS PWA detected - applying select event fixes');
  
  const selects = document.querySelectorAll('select');
  
  selects.forEach(select => {
    // Skip if already fixed
    if (select.dataset.iosFixed) return;
    select.dataset.iosFixed = 'true';
    
    // Add touch event to force focus - helps with iOS dropdown opening
    select.addEventListener('touchstart', function(e) {
      e.stopPropagation();
      this.focus();
    }, supportsPassive ? { passive: true } : false);
    
    // Prevent interference from parent elements
    select.addEventListener('click', function(e) {
      e.stopPropagation();
    }, supportsPassive ? { passive: true } : false);
    
    // Additional fix for iOS 15+ - ensure dropdown stays open
    select.addEventListener('touchend', function(e) {
      const self = this;
      setTimeout(function() {
        self.focus();
      }, 50);
    }, supportsPassive ? { passive: true } : false);
  });
}

// Call the fix after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fixIOSSelectDropdowns);
} else {
  fixIOSSelectDropdowns();
}

// Re-apply fix when new selects are added dynamically
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(function(mutations) {
    let needsFix = false;
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.tagName === 'SELECT' || node.querySelectorAll('select').length > 0) {
              needsFix = true;
            }
          }
        });
      }
    });
    if (needsFix) {
      fixIOSSelectDropdowns();
    }
  });
  
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

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

/* ================= DIRECTION BUTTONS ================= */
btnNilaToSahyadri.addEventListener("click", function() {
  setDirection("Nila", "Sahyadri");
  setActiveButton(btnNilaToSahyadri);
  
  // TRACK THIS EVENT
  if (typeof trackDirectionClick === 'function') {
    trackDirectionClick("Nila", "Sahyadri");
  }
});

btnSahyadriToNila.addEventListener("click", function() {
  setDirection("Sahyadri", "Nila");
  setActiveButton(btnSahyadriToNila);
  
  // TRACK THIS EVENT
  if (typeof trackDirectionClick === 'function') {
    trackDirectionClick("Sahyadri", "Nila");
  }
});

function setDirection(from, to) {
  activeDirection = { from: from, to: to };
  updateResult();
}

function setActiveButton(activeBtn) {
  document.querySelectorAll(".dir-btn").forEach(function(btn) {
    btn.classList.remove("active");
  });
  activeBtn.classList.add("active");
}

/* ================= FORMATTERS ================= */
function to12Hour(time24) {
  let parts = time24.split(":");
  let h = Number(parts[0]);
  let m = Number(parts[1]);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return h + ":" + String(m).padStart(2, "0") + " " + period;
}

function getJourneyTime24() {
  const h = Number(journeyHour.value);
  const m = journeyMinute.value;
  const p = journeyPeriod.value;

  if (!h || !m || !p) return null;

  let hour24 = h % 12;
  if (p === "PM") hour24 += 12;

  return String(hour24).padStart(2, "0") + ":" + m;
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
  const parts = time24.split(":");
  const hour = Number(parts[0]);
  
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

  routes.forEach(function(route) {
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

  routes.forEach(function(route) {
    daySet.add(route.dayType);
    if (route.stops) {
      route.stops.forEach(function(stop) {
        destSet.add(stop);
      });
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

  outsideRoutes.forEach(function(route) {
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
      route.stops.forEach(function(stop) {
        destSet.add(stop);
      });
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
    
    // Re-apply iOS fix after update
    if (isIOSPWA()) {
      setTimeout(fixIOSSelectDropdowns, 50);
    }
    return;
  }

  if (selectedDay === "Sunday") {
    outsideDestination.innerHTML = '<option value="">No buses on Sunday</option>';
    outsideDestination.disabled = true;
    
    // Re-apply iOS fix after update
    if (isIOSPWA()) {
      setTimeout(fixIOSSelectDropdowns, 50);
    }
    return;
  }

  const availableDestinations = getAvailableDestinations(selectedDay, selectedTimePeriod);

  if (availableDestinations.length === 0) {
    outsideDestination.innerHTML = '<option value="">No buses at this time</option>';
    outsideDestination.disabled = true;
    
    // Re-apply iOS fix after update
    if (isIOSPWA()) {
      setTimeout(fixIOSSelectDropdowns, 50);
    }
    return;
  }

  outsideDestination.disabled = false;
  outsideDestination.innerHTML = '<option value="">Where to?</option>';
  availableDestinations.forEach(function(dest) {
    outsideDestination.add(new Option(dest, dest));
  });
  
  // Re-apply iOS fix after update
  if (isIOSPWA()) {
    setTimeout(fixIOSSelectDropdowns, 50);
  }
}

/* ================= LOAD DATA (ONCE) ================= */
Promise.all([
  loadRoutes(),
  loadRouteRuns(),
  loadOutsideRoutes()
])
  .then(function(results) {
    allRoutes = results[0];
    routeRuns = results[1];
    outsideRoutes = results[2];

    extractUniqueValues(allRoutes);
    extractOutsideValues(outsideRoutes);

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
    
    // Re-apply iOS fix after all dropdowns are populated
    if (isIOSPWA()) {
      setTimeout(fixIOSSelectDropdowns, 100);
    }

    console.log("Flat routes:", allRoutes.length);
    console.log("Route runs:", routeRuns.length);
    console.log("Outside routes:", outsideRoutes.length);
  })
  .catch(function(err) {
    resultsDiv.textContent = "Failed to load bus data";
    console.error(err);
  });

/* ================= HELPERS ================= */
function populateSelect(selectEl, values) {
  if (!selectEl) return;
  const firstOption = selectEl.options[0].text;
  selectEl.innerHTML = '<option value="">' + firstOption + '</option>';
  values.forEach(function(v) {
    selectEl.add(new Option(v, v));
  });
}

function setJourneyDayToToday(availableDays, selectElement) {
  if (!selectElement) {
    selectElement = journeyDay;
  }
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

  if (availableDays.indexOf(today) !== -1) {
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

  const from = activeDirection.from;
  const to = activeDirection.to;

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

  upcomingBuses.forEach(function(bus, index) {
    addResultRow(bus, index === 0);
  });

  updateCountdowns();
}

function addResultRow(bus, isNext) {
  const row = document.createElement("div");
  row.className = "bus-row";
  
  const label = document.createElement("div");
  label.className = isNext ? "label next" : "label";
  label.textContent = isNext ? "Next Bus" : "";
  row.appendChild(label);

  const rightGroup = document.createElement("div");
  rightGroup.className = "right-group";
  
  const time = document.createElement("span");
  time.className = isNext ? "time next" : "time";
  time.textContent = to12Hour(bus.time);
  rightGroup.appendChild(time);

  const count = document.createElement("span");
  count.className = "count";
  count.textContent = bus.count + " bus" + (bus.count > 1 ? "es" : "");
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

  document.querySelectorAll(".countdown").forEach(function(el) {
    const parts = el.dataset.time.split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const busSec = h * 3600 + m * 60;
    const diff = busSec - nowSec;

    if (diff <= 0) {
      el.textContent = "--:--";
      return;
    }

    const mm = Math.floor(diff / 60);
    const ss = diff % 60;
    el.textContent =
      String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  });
}

/* ================= JOURNEY PLANNER (INSIDE CAMPUS) ================= */
journeyBtn.addEventListener("click", function() {
  journeyResults.innerHTML = "";

  const time24 = getJourneyTime24();
  
  if (!time24 || !journeyDay.value || !journeyFrom.value || !journeyTo.value) {
    journeyResults.textContent = "Select day, time and stops";
    return;
  }

  // TRACK THIS EVENT
  if (typeof trackJourneySearch === 'function') {
    trackJourneySearch(
      journeyDay.value,
      journeyFrom.value,
      journeyTo.value,
      time24
    );
  }

  const parts = time24.split(":");
  const selH = Number(parts[0]);
  const selM = Number(parts[1]);
  const selectedMinutes = selH * 60 + selM;

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

  buses.forEach(function(bus) {
    const busParts = bus.time.split(":");
    const h = Number(busParts[0]);
    const m = Number(busParts[1]);
    const busMinutes = h * 60 + m;

    const isEarlier = busMinutes < selectedMinutes;

    const row = document.createElement("div");
    row.className = isEarlier ? "journey-row earlier" : "journey-row upcoming";

    row.innerHTML =
      '<span class="bus-arrow">' + (isEarlier ? "↑" : "↓") + '</span>' +
      '<span class="bus-time">' + to12Hour(bus.time) + '</span>' +
      '<span class="bus-count">: ' + bus.count + ' bus' + (bus.count > 1 ? "es" : "") + '</span>';

    journeyResults.appendChild(row);
  });
});

/* ================= OUTSIDE CAMPUS BUSES ================= */
outsideSearch.addEventListener("click", function() {
  outsideResults.innerHTML = "";

  if (!outsideDay.value) {
    outsideResults.textContent = "Please select a day";
    return;
  }

  // Check if Sunday
  if (outsideDay.value === "Sunday") {
    outsideResults.innerHTML =
      '<div class="no-buses-message">No buses available on Sundays</div>';
    return;
  }

  if (!outsideTimePeriod.value || !outsideDestination.value) {
    outsideResults.textContent = "Please select time and destination";
    return;
  }

  // TRACK THIS EVENT
  if (typeof trackOutsideSearch === 'function') {
    trackOutsideSearch(
      outsideDay.value,
      outsideDestination.value,
      outsideTimePeriod.value
    );
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

  buses.forEach(function(bus) {
    const card = document.createElement("div");
    card.className = bus.departed ? 'outside-bus-card departed' : 'outside-bus-card';

    card.innerHTML =
      '<div class="departure-time">' +
        '<span class="icon">' + (bus.departed ? '⏱️' : '🚌') + '</span> ' +
        to12Hour(bus.departureTime) +
        (bus.departed ? '<span class="departed-badge">Already departed</span>' : '') +
      '</div>' +
      '<div class="route-info">From: <strong>' + bus.origin + '</strong></div>' +
      '<div class="route-stops">' + bus.routeDescription + '</div>' +
      (bus.returnTime && !bus.departed ? '<div class="return-time">↩ Returns: ' + bus.returnTime + '</div>' : '');

    outsideResults.appendChild(card);
  });
});

/* ================= EVENT LISTENERS FOR SMART FILTERING ================= */
// Update destinations when day changes
outsideDay.addEventListener("change", function() {
  updateDestinationDropdown();
  outsideResults.innerHTML = "";
});

// Update destinations when time period changes
outsideTimePeriod.addEventListener("change", function() {
  updateDestinationDropdown();
  outsideResults.innerHTML = "";
});

/* ================= TOGGLE (Campus Journey) ================= */
if (journeyToggle && journeyPanel && journeySection) {
  journeyToggle.addEventListener("click", function() {
    const isOpening = journeyPanel.classList.contains("hidden");
    journeyPanel.classList.toggle("hidden");
    journeySection.classList.toggle("open");
    
    // TRACK THIS EVENT
    if (typeof trackToggle === 'function') {
      trackToggle("Journey Planner", isOpening);
    }
  });
}

/* ================= TOGGLE (Outside Campus) ================= */
if (outsideCampusToggle && outsideCampusPanel && outsideCampusSection) {
  outsideCampusToggle.addEventListener("click", function() {
    const isOpening = outsideCampusPanel.classList.contains("hidden");
    outsideCampusPanel.classList.toggle("hidden");
    outsideCampusSection.classList.toggle("open");
    
    // TRACK THIS EVENT
    if (typeof trackToggle === 'function') {
      trackToggle("Outside Campus Buses", isOpening);
    }
  });
}

/* ================= EVENTS ================= */
setInterval(updateCountdowns, 1000);