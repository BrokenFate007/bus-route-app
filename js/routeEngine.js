function getToday() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function findNextBus(routes, from, to) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = getToday();

  const valid = routes.filter(r =>
    r.day === today &&
    r.from === from &&
    r.to === to &&
    timeToMinutes(r.time) >= nowMin
  );

  if (valid.length === 0) return null;

  return valid.sort((a, b) =>
    timeToMinutes(a.time) - timeToMinutes(b.time)
  )[0];
}
