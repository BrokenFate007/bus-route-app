function getTodayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function timeToMinutes(t) {
  let [h, m] = t.split(":").map(Number);
  if (h === 0) h = 24; // handle 0:00 safely
  return h * 60 + m;
}

function findUpcomingBuses(routes, from, to, limit = 3) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = getTodayName();

  return routes
    .filter(r =>
      r.dayType === today &&
      r.from === from &&
      r.to === to &&
      timeToMinutes(r.time) >= nowMin
    )
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    .slice(0, limit);
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
    .filter(r => r.minutes !== null)
    .sort((a, b) => a.minutes - b.minutes);

  const before = matching
    .filter(r => r.minutes < targetMin)
    .slice(-beforeCount);

  const after = matching
    .filter(r => r.minutes >= targetMin)
    .slice(0, afterCount);

  return [...before, ...after];
}

