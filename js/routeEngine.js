/* ================= DAY & TIME ================= */
function getTodayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function timeToMinutes(t) {
  let [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* ================= BASIC (CURRENT SYSTEM) ================= */
function findUpcomingBuses(routes, from, to, count) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const today = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
  
  // Get all buses for today matching from/to
  const todayBuses = routes.filter(function(r) {
    return r.dayType === today && r.from === from && r.to === to;
  }).map(function(r) {
    const parts = r.time.split(":");
    const busMinutes = Number(parts[0]) * 60 + Number(parts[1]);
    return {
      time: r.time,
      count: r.count,
      minutes: busMinutes,
      departed: busMinutes < currentMinutes
    };
  }).sort(function(a, b) {
    return a.minutes - b.minutes;
  });
  
  // Find the last departed bus (just 1)
  const departed = todayBuses.filter(function(b) { 
    return b.departed; 
  }).slice(-1);
  
  // Find next 3 upcoming buses
  const upcoming = todayBuses.filter(function(b) { 
    return !b.departed; 
  }).slice(0, count);
  
  // Combine: 1 departed + 3 upcoming
  return departed.concat(upcoming);
}


function findBusesAroundTime(
  routes,
  day,
  from,
  to,
  targetTime,
  beforeCount = 2,
  afterCount = 2
) {
  if (!day || !from || !to || !targetTime) return [];

  const targetMin = timeToMinutes(targetTime);

  const matching = routes
    .filter(r =>
      r.dayType === day &&
      r.from === from &&
      r.to === to
    )
    .map(r => ({
      ...r,
      minutes: timeToMinutes(r.time)
    }))
    .sort((a, b) => a.minutes - b.minutes);

  const before = matching
    .filter(r => r.minutes < targetMin)
    .slice(-beforeCount);

  const after = matching
    .filter(r => r.minutes >= targetMin)
    .slice(0, afterCount);

  return [...before, ...after];
}

/* ================= OUTSIDE CAMPUS ================= */
function findOutsideBuses(routes, day, destination, timePeriod) {
  if (!day || !destination) return [];

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = getTodayName();

  return routes
    .filter(r => {
      // Match day
      if (r.dayType !== day) return false;

      // Check if destination is in stops
      if (!r.stops || !r.stops.includes(destination)) return false;

      // Filter by time period
      if (timePeriod && timePeriod !== "" && timePeriod !== "all") {
        const busHour = parseInt(r.departureTime.split(":")[0]);
        
        if (timePeriod === "morning" && (busHour < 6 || busHour >= 12)) {
          return false;
        }
        if (timePeriod === "afternoon" && (busHour < 12 || busHour >= 15)) {
          return false;
        }
        if (timePeriod === "evening" && (busHour < 15 || busHour >= 24)) {
          return false;
        }
      }

      return true; // Show all buses regardless of time
    })
    .map(r => ({
      ...r,
      departed: day === today && timeToMinutes(r.departureTime) < nowMin
    }))
    .sort((a, b) => timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime));
}

/* ================= ROUTE-RUN EXPANSION (FUTURE-SAFE) ================= */
function expandRouteRun(run, stopOffsets = {}) {
  const trips = [];
  const baseTimeMin = timeToMinutes(run.startTime);

  for (let i = 0; i < run.stops.length; i++) {
    for (let j = i + 1; j < run.stops.length; j++) {
      const from = run.stops[i];
      const to = run.stops[j];

      const fromOffset = stopOffsets[from] ?? 0;
      const tripTimeMin = baseTimeMin + fromOffset;

      trips.push({
        dayType: run.day,
        from,
        to,
        time: minutesToTime(tripTimeMin),
        routeId: run.routeId,
        routeType: run.routeType || "outside"
      });
    }
  }
  return trips;
}

/* ================= UTIL ================= */
function minutesToTime(totalMin) {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
