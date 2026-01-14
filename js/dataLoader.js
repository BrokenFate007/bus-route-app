async function loadRoutes() {
  const response = await fetch("./data/routes.tsv", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load routes.tsv");
  }

  const text = await response.text();
  const lines = text.trim().split("\n");

  // Remove header
  lines.shift();

  return lines
    .map((line, index) => {
      const cols = line.split("\t");

      // Defensive parsing
      if (cols.length < 5) {
        console.warn(`Skipping malformed line ${index + 2}`);
        return null;
      }

      const dayType = cols[0].trim();
      const from = cols[1].trim();
      const to = cols[2].trim();
      const time = cols[3].trim();
      const count = Number(cols[4].trim());

      if (!dayType || !from || !to || !time || Number.isNaN(count)) {
        console.warn(`Invalid data at line ${index + 2}`);
        return null;
      }

      return { dayType, from, to, time, count };
    })
    .filter(Boolean);
}


async function loadRouteRuns() {
  const res = await fetch("./data/route_runs.tsv");
  const text = await res.text();
  const lines = text.trim().split("\n");
  lines.shift();

  return lines.map(line => {
    const [routeId, day, startTime, stops] = line.split("\t");
    return {
      routeId,
      day,
      startTime,
      stops: stops.split(">")
    };
  });
}
