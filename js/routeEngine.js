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

