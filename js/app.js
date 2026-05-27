let upcomingBuses = [];
let allRoutes = [];
let outsideRoutes = [];
let foodMenuData = null;

// These will be populated from loaded data
let fromPlaces = [];
let toPlaces = [];
let days = [];
let outsideDays = [];
let outsideDestinations = [];

/* ================= HAPTIC FEEDBACK ================= */
function triggerHaptic() {
  if (navigator && navigator.vibrate) {
    navigator.vibrate(50);
  }
}

window.toggleFavorite = function(itemName, el) {
  triggerHaptic();
  let favorites = JSON.parse(localStorage.getItem("food_favorites") || "[]");
  if (favorites.includes(itemName)) {
    favorites = favorites.filter(f => f !== itemName);
    el.classList.remove('active');
  } else {
    favorites.push(itemName);
    el.classList.add('active');
  }
  localStorage.setItem("food_favorites", JSON.stringify(favorites));
};

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
    get: function () { supportsPassive = true; }
  });
  window.addEventListener('testPassive', null, opts);
  window.removeEventListener('testPassive', null, opts);
} catch (e) { }

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
    select.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      this.focus();
    }, supportsPassive ? { passive: true } : false);

    // Prevent interference from parent elements
    select.addEventListener('click', function (e) {
      e.stopPropagation();
    }, supportsPassive ? { passive: true } : false);

    // Additional fix for iOS 15+ - ensure dropdown stays open
    select.addEventListener('touchend', function (e) {
      const self = this;
      setTimeout(function () {
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
  const observer = new MutationObserver(function (mutations) {
    let needsFix = false;
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(function (node) {
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
const btnSwapRoute = document.getElementById("btnSwapRoute");

/* Outside Campus */
const outsideCampusToggle = document.getElementById("outsideCampusToggle");
const outsideCampusPanel = document.getElementById("outsideCampusPanel");
const outsideCampusSection = document.querySelector(".journey.outside-campus");
const outsideDay = document.getElementById("outsideDay");
const outsideTimePeriod = document.getElementById("outsideTimePeriod");
const outsideDestination = document.getElementById("outsideDestination");
const outsideSearch = document.getElementById("outsideSearch");
const outsideResults = document.getElementById("outsideResults");

/* Nav & Food */
const navBus = document.getElementById("navBus");
const navFood = document.getElementById("navFood");
const busView = document.getElementById("busView");
const foodView = document.getElementById("foodView");
const foodDaySelect = document.getElementById("foodDaySelect");
const foodResults = document.getElementById("foodResults");

let activeDirection = { from: "Nila", to: "Sahyadri" };

const btnNilaToSahyadri = document.getElementById("btnNilaToSahyadri");
const btnSahyadriToNila = document.getElementById("btnSahyadriToNila");

/* ================= DIRECTION BUTTONS ================= */
btnNilaToSahyadri.addEventListener("click", function () {
  setDirection("Nila", "Sahyadri");
  setActiveButton(btnNilaToSahyadri);

  // TRACK THIS EVENT
  if (typeof trackDirectionClick === 'function') {
    trackDirectionClick("Nila", "Sahyadri");
  }
});

btnSahyadriToNila.addEventListener("click", function () {
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
  document.querySelectorAll(".dir-btn").forEach(function (btn) {
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

  routes.forEach(function (route) {
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

  routes.forEach(function (route) {
    daySet.add(route.dayType);
    if (route.stops) {
      route.stops.forEach(function (stop) {
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

  outsideRoutes.forEach(function (route) {
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
      route.stops.forEach(function (stop) {
        destSet.add(stop);
      });
    }
  });

  return Array.from(destSet).sort();
}

function updateDestinationDropdown() {
  const selectedDay = outsideDay.value;
  const selectedTimePeriod = outsideTimePeriod.value;
  const currentDestination = outsideDestination.value; // SAVE CURRENT SELECTION

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
  outsideDestination.innerHTML = '<option value="">Bus Stop</option>';
  availableDestinations.forEach(function (dest) {
    outsideDestination.add(new Option(dest, dest));
  });

  // RESTORE PREVIOUS SELECTION IF STILL AVAILABLE
  if (currentDestination && availableDestinations.indexOf(currentDestination) !== -1) {
    outsideDestination.value = currentDestination;
  }

  // Re-apply iOS fix after update
  if (isIOSPWA()) {
    setTimeout(fixIOSSelectDropdowns, 50);
  }
}

/* ================= LOAD DATA (ONCE) ================= */
Promise.all([
  loadRoutes(),
  loadOutsideRoutes(),
  typeof loadFoodMenu === 'function' ? loadFoodMenu() : Promise.resolve(null)
])
  .then(function (results) {
    allRoutes = results[0];
    outsideRoutes = results[1];
    foodMenuData = results[2];
    routeRuns = [];

    extractUniqueValues(allRoutes);
    extractOutsideValues(outsideRoutes);

    populateSelect(journeyFrom, fromPlaces);
    populateSelect(journeyTo, toPlaces);
    populateSelect(journeyDay, days);

    // Add event listeners for smart from/to filtering
    journeyFrom.addEventListener("change", updateFromToDropdowns);
    journeyTo.addEventListener("change", updateFromToDropdowns);

    // Populate outside campus day dropdown
    populateSelect(outsideDay, outsideDays);

    setJourneyDayToToday(days);
    setJourneyDayToToday(outsideDays, outsideDay);

    // Auto-select current time period
    outsideTimePeriod.value = getCurrentTimePeriod();

    // Initialize destination dropdown based on current selections
    updateDestinationDropdown();

    populateTimePicker();
    setJourneyTimeToNow(); // Auto-select current time for journey planner

    // Set default active button state
    if (btnNilaToSahyadri) {
      setActiveButton(btnNilaToSahyadri);
    }

    updateResult();

    // Initialize food view controls
    if (typeof setupFoodControls === 'function') {
      setupFoodControls();
    }

    // Re-apply iOS fix after all dropdowns are populated
    if (isIOSPWA()) {
      setTimeout(fixIOSSelectDropdowns, 100);
    }

    console.log("Flat routes:", allRoutes.length);
    console.log("Route runs:", routeRuns.length);
    console.log("Outside routes:", outsideRoutes.length);
  })
  .catch(function (err) {
    resultsDiv.textContent = "Failed to load bus data";
    console.error(err);
  });

/* ================= HELPERS ================= */
function populateSelect(selectEl, values) {
  if (!selectEl) return;
  const firstOption = selectEl.options[0].text;
  selectEl.innerHTML = '<option value="">' + firstOption + '</option>';
  values.forEach(function (v) {
    selectEl.add(new Option(v, v));
  });
}


function setupDropdownListeners() {
  if (btnSwapRoute) {
    btnSwapRoute.addEventListener("click", () => {
      triggerHaptic();
      const temp = journeyFrom.value;
      journeyFrom.value = journeyTo.value;
      journeyTo.value = temp;
    });
  }
}

function updateFromToDropdowns() {
  const changedDropdown = this; // The dropdown that triggered the change

  // If "From" dropdown changed
  if (changedDropdown === journeyFrom) {
    const fromValue = journeyFrom.value;
    if (fromValue === "Nila") {
      journeyTo.value = "Sahyadri";
    } else if (fromValue === "Sahyadri") {
      journeyTo.value = "Nila";
    }
  }

  // If "To" dropdown changed
  if (changedDropdown === journeyTo) {
    const toValue = journeyTo.value;
    if (toValue === "Nila") {
      journeyFrom.value = "Sahyadri";
    } else if (toValue === "Sahyadri") {
      journeyFrom.value = "Nila";
    }
  }

  // Re-apply iOS fix after updates
  if (isIOSPWA()) {
    setTimeout(fixIOSSelectDropdowns, 50);
  }
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

function setJourneyTimeToNow() {
  if (!journeyHour || !journeyMinute || !journeyPeriod) return;

  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();

  // Round to nearest 5 minutes
  let roundedMinutes = Math.round(minutes / 5) * 5;
  if (roundedMinutes === 60) {
    roundedMinutes = 0;
    hours = (hours + 1) % 24;
  }

  const period = hours >= 12 ? "PM" : "AM";
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;

  journeyHour.value = String(displayHours);
  journeyMinute.value = String(roundedMinutes).padStart(2, "0");
  journeyPeriod.value = period;
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

  // Find the first upcoming bus (not departed)
  let firstUpcomingIndex = upcomingBuses.findIndex(bus => !bus.departed);

  upcomingBuses.forEach(function (bus, index) {
    addResultRow(bus, index === firstUpcomingIndex);
  });

  updateCountdowns();
}


function addResultRow(bus, isNext) {
  const row = document.createElement("div");
  row.className = bus.departed ? "bus-row departed" : "bus-row";

  const label = document.createElement("div");
  label.className = "label";
  // Only show "Next Bus" for the first UPCOMING bus, not departed
  if (isNext && !bus.departed) {
    label.className = "label next";
    label.textContent = "Next Bus";
  }
  row.appendChild(label);

  const rightGroup = document.createElement("div");
  rightGroup.className = "right-group";

  // Add arrow for all buses except the "Next Bus"
  const arrow = document.createElement("span");
  arrow.className = bus.departed ? "bus-arrow earlier" : "bus-arrow upcoming";
  arrow.textContent = bus.departed ? "↑" : "↓";
  rightGroup.appendChild(arrow);

  const time = document.createElement("span");
  // Blue color only for the first upcoming (Next Bus), gray for departed
  time.className = (isNext && !bus.departed) ? "time next" : (bus.departed ? "time departed" : "time");
  time.textContent = to12Hour(bus.time);
  rightGroup.appendChild(time);

  const count = document.createElement("span");
  count.className = bus.departed ? "count departed" : "count";
  count.textContent = bus.count + " bus" + (bus.count > 1 ? "es" : "");
  rightGroup.appendChild(count);

  // Show countdown for all buses (negative for departed, positive for upcoming)
  const countdown = document.createElement("span");
  countdown.className = bus.departed ? "countdown departed" : "countdown";
  countdown.dataset.time = bus.time;
  countdown.dataset.departed = bus.departed ? "true" : "false";
  rightGroup.appendChild(countdown);

  row.appendChild(label);
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

  document.querySelectorAll(".countdown").forEach(function (el) {
    const parts = el.dataset.time.split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const busSec = h * 3600 + m * 60;
    const diff = busSec - nowSec;

    const isDeparted = el.dataset.departed === "true";

    if (isDeparted) {
      const absDiff = Math.abs(diff);
      const mm = Math.floor(absDiff / 60);
      const ss = absDiff % 60;
      el.textContent = "-" + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
      el.classList.remove("urgent-timer");
      return;
    }

    if (diff <= 0) {
      el.textContent = "--:--";
      el.classList.remove("urgent-timer");
      return;
    }

    if (diff <= 300) {
      el.classList.add("urgent-timer");
    } else {
      el.classList.remove("urgent-timer");
    }

    const mm = Math.floor(diff / 60);
    const ss = diff % 60;
    el.textContent = String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  });

  // Food Countdown Logic & Theme Toggling
  const mealCountdownWrapper = document.getElementById("mealCountdownWrapper");
  const mealCountdownText = document.getElementById("mealCountdownText");
  const mealProgressFill = document.getElementById("mealProgressFill");
  
  // Theme Auto-Toggling
  const h = now.getHours();
  // Morning glow (6am to 10am), Night glow (8pm to 5am)
  if (h >= 6 && h < 10) {
    document.body.style.setProperty('--surface', '#1e1b15');
  } else if (h >= 20 || h < 5) {
    document.body.style.setProperty('--surface', '#0f172a');
  } else {
    document.body.style.setProperty('--surface', '#111827');
  }

  if (mealCountdownText && mealProgressFill) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();
    const activeMealName = getUpcomingMealName();
    const slot = mealSlots[activeMealName];
    
    // Only show dynamic countdown if "Today" is selected in the food UI
    const jsDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const isTodaySelected = document.getElementById("foodDaySelect")?.value === jsDays[now.getDay()];

    if (slot && isTodaySelected) {
      mealCountdownWrapper.style.display = "block";
      if (currentMinutes >= slot.start && currentMinutes <= slot.end) {
        // Ongoing meal
        const endSec = slot.end * 60;
        const nowSec = currentMinutes * 60 + currentSeconds;
        const diff = endSec - nowSec;
        
        const dh = Math.floor(diff / 3600);
        const dm = Math.floor((diff % 3600) / 60);
        const ds = diff % 60;
        
        mealCountdownText.textContent = "Ends in " + (dh > 0 ? dh + "h " : "") + String(dm).padStart(2, '0') + "m " + String(ds).padStart(2, '0') + "s";
        
        // Progress
        const totalDuration = (slot.end - slot.start) * 60;
        const elapsed = nowSec - (slot.start * 60);
        const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        mealProgressFill.style.width = progress + "%";
        
      } else {
        // Upcoming meal
        const startSec = slot.start * 60;
        let nowSec = currentMinutes * 60 + currentSeconds;
        
        // If it's for tomorrow
        if (currentMinutes > slot.start) {
          nowSec -= (24 * 60 * 60);
        }
        
        const diff = startSec - nowSec;
        const dh = Math.floor(diff / 3600);
        const dm = Math.floor((diff % 3600) / 60);
        const ds = diff % 60;
        
        mealCountdownText.textContent = "Starts in " + (dh > 0 ? dh + "h " : "") + String(dm).padStart(2, '0') + "m " + String(ds).padStart(2, '0') + "s";
        mealProgressFill.style.width = "0%";
      }
    } else {
       mealCountdownWrapper.style.display = "none";
    }
  }
}


/* ================= JOURNEY PLANNER (INSIDE CAMPUS) ================= */
journeyBtn.addEventListener("click", function () {
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

  buses.forEach(function (bus) {
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
outsideSearch.addEventListener("click", function () {
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

  buses.forEach(function (bus) {
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
outsideDay.addEventListener("change", function () {
  updateDestinationDropdown();
  outsideResults.innerHTML = "";
});

// Update destinations when time period changes
outsideTimePeriod.addEventListener("change", function () {
  updateDestinationDropdown();
  outsideResults.innerHTML = "";
});

/* ================= TOGGLE (Campus Journey) ================= */
if (journeyToggle && journeyPanel && journeySection) {
  journeyToggle.addEventListener("click", function () {
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
  outsideCampusToggle.addEventListener("click", function () {
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

/* ================= BOTTOM NAV & FOOD MENU LOGIC ================= */
if (navBus && navFood) {
  navBus.addEventListener("click", () => {
    navBus.classList.add("active");
    navFood.classList.remove("active");
    busView.classList.remove("hidden");
    foodView.classList.add("hidden");
  });

  navFood.addEventListener("click", () => {
    navFood.classList.add("active");
    navBus.classList.remove("active");
    foodView.classList.remove("hidden");
    busView.classList.add("hidden");

    // Auto-select today's day for food if not already set
    const jsDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = jsDays[new Date().getDay()];
    const foodPodium = document.getElementById("foodPodium");
    if (!foodPodium || !foodPodium.innerHTML.trim() || foodDaySelect.value !== today) {
      foodDaySelect.value = today;
      renderFoodMenu();
    }
  });
}

if (foodDaySelect) {
  foodDaySelect.addEventListener("change", renderFoodMenu);
}

// State for Food preference
let foodPreference = 'veg'; // 'veg' or 'nonveg'

function parseFoodItems(rawText, preference) {
  if (!rawText) return [];

  // Smart split function to ignore separators inside parentheses
  function smartSplit(str, separator) {
    let parts = [];
    let current = "";
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '(') depth++;
      else if (char === ')') depth--;

      if (char === separator && depth === 0) {
        parts.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  // Split by semicolon first, then by comma
  let parts = [];
  smartSplit(rawText, ';').forEach(p => {
    smartSplit(p, ',').forEach(item => {
      parts.push(item.trim());
    });
  });

  let finalItems = [];

  parts.forEach(part => {
    if (!part) return;

    // Strip outer parentheses if present (e.g. "(Non Veg:- Omlet)")
    if (part.startsWith('(') && part.endsWith(')')) {
      part = part.slice(1, -1).trim();
    }

    // Check if it's explicitly Veg-only
    let vegMatch = part.match(/^Veg\s*[: -]+\s*(.*)$/i);
    // Check if it's explicitly Non-Veg-only
    let nonVegMatch = part.match(/^Non[- ]?Veg\s*[: -]+\s*(.*)$/i);

    if (vegMatch) {
      if (preference === 'veg') {
        finalItems.push({ text: vegMatch[1].trim(), type: 'veg' });
      }
    } else if (nonVegMatch) {
      if (preference === 'nonveg') {
        finalItems.push({ text: nonVegMatch[1].trim(), type: 'nonveg' });
      }
    } else {
      // It's a shared item, but check if there's a nested Non-Veg note, e.g. "PEANUT BUTTER (Non Veg:-Omlet)"
      let nestedNonVeg = part.match(/(.*?)\s*\((?:Non[- ]?Veg\s*[: -]+\s*)(.*?)\)/i);
      if (nestedNonVeg) {
        let mainText = nestedNonVeg[1].trim();
        let nonVegOption = nestedNonVeg[2].trim();
        if (preference === 'veg') {
          if (mainText) finalItems.push({ text: mainText, type: 'veg' }); // display main as veg
        } else {
          finalItems.push({ text: `${mainText} + ${nonVegOption}`, type: 'nonveg' });
        }
      } else {
        // Plain shared item
        finalItems.push({ text: part, type: 'shared' });
      }
    }
  });

  return finalItems;
}

function getUpcomingMealName() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMinutes = hour * 60 + minute;

  // Breakfast: up to 9:30 AM
  if (currentMinutes < 9 * 60 + 30) {
    return "Breakfast";
  }
  // Lunch: up to 2:00 PM (14:00)
  if (currentMinutes < 14 * 60) {
    return "Lunch";
  }
  // Snacks: up to 6:00 PM (18:00)
  if (currentMinutes < 18 * 60) {
    return "Snacks";
  }
  // Dinner: up to 9:00 PM (21:00)
  if (currentMinutes < 21 * 60) {
    return "Dinner";
  }
  // After 9:30 PM, next meal is Breakfast (tomorrow)
  return "Breakfast";
}

const mealSlots = {
  "Breakfast": { label: "7:30 AM - 9:30 AM", start: 7 * 60 + 30, end: 9 * 60 + 30 },
  "Lunch": { label: "12:00 PM - 2:00 PM", start: 12 * 60, end: 14 * 60 },
  "Snacks": { label: "4:30 PM - 06:00 PM", start: 16 * 60 + 30, end: 18 * 60 },
  "Dinner": { label: "7:30 PM - 9:00 PM", start: 19 * 60 + 30, end: 21 * 60 }
};

function getMealStatus(mealName, isTodaySelected) {
  if (!isTodaySelected) return "";

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slot = mealSlots[mealName];

  if (slot && currentMinutes >= slot.start && currentMinutes <= slot.end) {
    return "Ongoing Meal";
  }

  const upcomingName = getUpcomingMealName();
  if (mealName === upcomingName) {
    return "Next Meal";
  }

  return "";
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
  // In our week (Mon-Sun), Sunday (0) is the last day of the week.
  // So if it's Sunday, we want to go back 6 days to get to Monday.
  // Otherwise, we go back (day - 1) days.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getActiveWeekKey(selectedDate) {
  // Reference Monday: May 25, 2026 (Month is 4 since May is 0-indexed)
  const refMonday = new Date(2026, 4, 25);
  refMonday.setHours(0, 0, 0, 0);

  const selMonday = getMonday(selectedDate);

  const diffTime = selMonday.getTime() - refMonday.getTime();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.round(diffTime / msPerWeek);

  if (diffWeeks % 2 === 0) {
    return "Week_2_4";
  } else {
    return "Week_1_3";
  }
}

function getDateForDayOfWeek(dayName) {
  const now = new Date();
  const monday = getMonday(now);

  const dayOffsets = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6
  };

  const offset = dayOffsets[dayName] !== undefined ? dayOffsets[dayName] : 0;
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + offset);
  return targetDate;
}

function formatFoodItemText(text) {
  let main = text;
  let sub = "";

  // Match parenthetical notes at the end of strings
  let parenMatch = text.match(/^(.*?)\s*\(([^)]*)\)$/);
  if (parenMatch) {
    main = parenMatch[1].trim();
    sub = parenMatch[2].trim();
  }

  // Check for custom "+ " join
  if (main.includes(" + ")) {
    let parts = main.split(" + ");
    main = parts[0].trim();
    sub = "with " + parts[1].trim();
  }

  return { main, sub };
}

function renderFoodMenu() {
  const foodPodium = document.getElementById("foodPodium");
  const foodFullDayContainer = document.getElementById("foodFullDayContainer");

  if (!foodPodium || !foodFullDayContainer || !foodMenuData) return;

  const day = foodDaySelect.value;
  foodPodium.innerHTML = "";
  foodFullDayContainer.innerHTML = "";

  const targetDate = getDateForDayOfWeek(day);
  const weekKey = getActiveWeekKey(targetDate);
  const weekData = foodMenuData[weekKey] || {};
  const common = weekData["Common"] || {};

  // Clone dayData so we can modify it safely without mutating original cache
  const dayData = { ...(weekData[day] || {}) };
  const meals = ["Breakfast", "Lunch", "Snacks", "Dinner"];

  const activeMealName = getUpcomingMealName();

  const jsDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = jsDays[new Date().getDay()];
  const isTodaySelected = foodDaySelect.value === todayName;

  // Helper to render the item list HTML (merging specific & common items)
  function getItemListHTML(itemsText, commonText) {
    const specificItems = parseFoodItems(itemsText, foodPreference);
    const commonItems = parseFoodItems(commonText, foodPreference);
    let combinedItems = [...specificItems, ...commonItems];

    // Meaningful Sorting
    const priorityMap = [
      { level: 1, keywords: ["chapathi", "phulka", "puri", "rice", "briyani", "pulao", "dosa", "idly", "paratha", "bhatura", "puttu", "upma"] },
      { level: 2, keywords: ["chicken", "paneer", "egg", "kofta", "manchurian"] },
      { level: 3, keywords: ["dal", "sambar", "rasam", "kadhi", "curry", "gravy", "masala", "chola", "rajma"] },
      { level: 4, keywords: ["dry", "fry", "poriyal", "veg"] },
      { level: 6, keywords: ["curd", "raita", "buttermilk", "milk", "tea", "coffee", "juice", "panna"] },
      { level: 7, keywords: ["pickle", "papad", "salad", "onion", "lemon", "chutney", "ketchup", "appalam", "sugar"] }
    ];

    function getPriority(text) {
      const lower = text.toLowerCase();
      for (const p of priorityMap) {
        if (p.keywords.some(kw => lower.includes(kw))) {
          return p.level;
        }
      }
      return 5; // Default priority (Other items)
    }

    combinedItems.sort((a, b) => getPriority(a.text) - getPriority(b.text));

    if (combinedItems.length === 0) {
      return `<div class="food-items" style="font-size: 0.92rem; color: var(--muted); margin: 6px 0;">No items available for this selection.</div>`;
    }

    let html = `<ul class="food-item-list">`;

    combinedItems.forEach(item => {
      let dotClass = "shared-dot";
      if (item.type === 'veg') dotClass = "veg-dot";
      if (item.type === 'nonveg') dotClass = "nonveg-dot";

      // Parse main and subtitle
      let { main, sub } = formatFoodItemText(item.text);

      // Special override to clean up egg text
      if (main.toLowerCase().startsWith("boiled egg") && main.toLowerCase().includes("omelette")) {
        main = "Eggs & Omelettes";
        sub = "Boiled Egg (5x/week), Omelette (2x/week)";
      }

      // Favorites logic
      const favorites = JSON.parse(localStorage.getItem("food_favorites") || "[]");
      const isFav = favorites.includes(main);
      const starHTML = `<span class="favorite-star ${isFav ? 'active' : ''}" data-item="${main}" onclick="window.toggleFavorite('${main.replace(/'/g, "\\'")}', this)">★</span>`;

      let subHTML = sub ? `<span class="food-item-subtitle">${sub}</span>` : "";

      html += `
        <li class="food-item-row item-${item.type}">
          <span class="food-item-indicator dot ${dotClass}"></span>
          <div class="food-item-details">
            <span class="food-item-title">${main} ${starHTML}</span>
            ${subHTML}
          </div>
        </li>
      `;
    });

    html += `</ul>`;
    return html;
  }

  // 1. Render Featured Podium Card
  const activeItemsText = dayData[activeMealName] || "";
  const activeCommonText = common[activeMealName] || "";

  let mealIcon = "";
  if (activeMealName === "Breakfast") mealIcon = "🌅 ";
  if (activeMealName === "Lunch") mealIcon = "☀️ ";
  if (activeMealName === "Snacks") mealIcon = "☕ ";
  if (activeMealName === "Dinner") mealIcon = "🌙 ";

  const podiumCard = document.createElement("div");
  podiumCard.className = "podium-card";

  const statusText = getMealStatus(activeMealName, isTodaySelected) || "Next Meal";

  podiumCard.innerHTML = `
    <div class="podium-badge">${statusText}</div>
    <div class="food-meal-name">${mealIcon}${activeMealName}</div>
    <div class="meal-time-slot" style="font-size: 0.82rem; color: var(--muted); margin: -8px 0 12px 0;">🕒 Timings: ${mealSlots[activeMealName].label}</div>
    
    <div class="meal-countdown-wrapper" id="mealCountdownWrapper">
      <div id="mealCountdownText" class="meal-countdown-text">--:--:--</div>
      <div class="meal-progress-bar">
        <div id="mealProgressFill" class="meal-progress-fill"></div>
      </div>
    </div>

    ${getItemListHTML(activeItemsText, activeCommonText)}
  `;
  foodPodium.appendChild(podiumCard);

  // 2. Render Full Day Cards
  meals.forEach(meal => {
    const itemsText = dayData[meal] || "";
    const commonText = common[meal] || "";

    if (!itemsText) return;

    const card = document.createElement("div");
    const isActive = meal === activeMealName;
    card.className = isActive ? "food-card active-meal" : "food-card collapsed";

    let icon = "";
    if (meal === "Breakfast") icon = "🌅 ";
    if (meal === "Lunch") icon = "☀️ ";
    if (meal === "Snacks") icon = "☕ ";
    if (meal === "Dinner") icon = "🌙 ";

    const statusText = getMealStatus(meal, isTodaySelected);
    const statusBadge = statusText ? `<span class="meal-status-badge active">${statusText}</span>` : "";
    const arrow = isActive ? "▵" : "▾";

    card.innerHTML = `
      <div class="food-card-header" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-weight: 700; font-size: 1.1rem; color: var(--accent); display: flex; align-items: center; gap: 8px;">${icon}${meal}</span>
          <span style="font-size: 0.78rem; color: var(--muted); font-weight: normal; margin-top: 2px;">(${mealSlots[meal].label})</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          ${statusBadge}
          <span class="collapse-arrow" style="font-size: 1.1rem; color: var(--muted); font-weight: bold;">${arrow}</span>
        </div>
      </div>
      <div class="food-card-body ${isActive ? '' : 'hidden'}" style="margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 10px;">
        ${getItemListHTML(itemsText, commonText)}
      </div>
    `;

    // Toggle collapse on header click
    const header = card.querySelector(".food-card-header");
    const body = card.querySelector(".food-card-body");
    const arrowEl = card.querySelector(".collapse-arrow");

    header.addEventListener("click", () => {
      const isHidden = body.classList.contains("hidden");
      body.classList.toggle("hidden");
      card.classList.toggle("collapsed");
      
      if (isHidden) {
        arrowEl.textContent = "▵";
      } else {
        arrowEl.textContent = "▾";
      }
    });

    foodFullDayContainer.appendChild(card);
  });
}

// Setup preference buttons and collapse toggle
function setupFoodControls() {
  const btnPrefVeg = document.getElementById("btnPrefVeg");
  const btnPrefNonVeg = document.getElementById("btnPrefNonVeg");
  const btnToggleFullDay = document.getElementById("btnToggleFullDay");
  const foodFullDayContainer = document.getElementById("foodFullDayContainer");

  if (btnPrefVeg && btnPrefNonVeg) {
    btnPrefVeg.addEventListener("click", () => {
      triggerHaptic();
      if (foodPreference !== 'veg') {
        foodPreference = 'veg';
        btnPrefVeg.classList.add("active");
        btnPrefNonVeg.classList.remove("active");
        renderFoodMenu();
      }
    });

    btnPrefNonVeg.addEventListener("click", () => {
      triggerHaptic();
      if (foodPreference !== 'nonveg') {
        foodPreference = 'nonveg';
        btnPrefNonVeg.classList.add("active");
        btnPrefVeg.classList.remove("active");
        renderFoodMenu();
      }
    });
  }

  if (btnToggleFullDay && foodFullDayContainer) {
    btnToggleFullDay.addEventListener("click", () => {
      triggerHaptic();
      const isHidden = foodFullDayContainer.classList.contains("hidden");
      foodFullDayContainer.classList.toggle("hidden");

      if (isHidden) {
        btnToggleFullDay.innerHTML = `Hide Full Day Menu <span class="arrow">▵</span>`;
      } else {
        btnToggleFullDay.innerHTML = `Show Full Day Menu <span class="arrow">▾</span>`;
      }
    });
  }
}
