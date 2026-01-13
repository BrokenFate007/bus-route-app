let allRoutes = [];

const fromSelect = document.getElementById("fromSelect");
const toSelect = document.getElementById("toSelect");
const nextBusEl = document.getElementById("nextBus");
const busCountEl = document.getElementById("busCount");

loadRoutes().then(routes => {
  allRoutes = routes;

  const places = [...new Set(routes.flatMap(r => [r.from, r.to]))];

  places.forEach(p => {
    fromSelect.add(new Option(p, p));
    toSelect.add(new Option(p, p));
  });
});

function updateResult() {
  const next = findNextBus(
    allRoutes,
    fromSelect.value,
    toSelect.value
  );

  if (!next) {
    nextBusEl.textContent = "Next Bus: None";
    busCountEl.textContent = "";
    return;
  }

  nextBusEl.textContent = `Next Bus: ${next.time}`;
  busCountEl.textContent = `Number of Buses: ${next.count}`;
}

fromSelect.addEventListener("change", updateResult);
toSelect.addEventListener("change", updateResult);
