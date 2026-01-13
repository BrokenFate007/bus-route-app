function getTodayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function timeToMinutes(t) {
  let [h, m] = t.split(":").map(Number);
  if (h === 0) h = 24; // handle 0:00 safely
  return h * 60 + m;
}

function findNextBus(routes, from, to) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = getTodayName();

  const valid = routes.filter(r =>
    r.dayType === today &&
    r.from === from &&
    r.to === to &&
    timeToMinutes(r.time) >= nowMin
  );

  if (valid.length === 0) return null;

  return valid.sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
  )[0];
}
