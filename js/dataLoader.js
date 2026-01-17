// Load INSIDE campus routes
async function loadRoutes() {
  const response = await fetch("./data/inside_routes.tsv", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load inside_routes.tsv");
  }

  const text = await response.text();
  const lines = text.trim().split("\n");

  lines.shift(); // Remove header

  return lines
    .map((line, index) => {
      const cols = line.split("\t");

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

// Load OUTSIDE campus routes
async function loadOutsideRoutes() {
  const res = await fetch("./data/outside_routes.tsv", { cache: "no-store" });

  if (!res.ok) {
    console.warn("outside_routes.tsv not found, skipping outside routes");
    return [];
  }

  const text = await res.text();
  const lines = text.trim().split("\n");

  if (lines.length <= 1) return [];

  lines.shift(); // Remove header

  return lines
    .map((line, index) => {
      const cols = line.split("\t");

      if (cols.length < 6) {
        console.warn(`Skipping malformed outside route line ${index + 2}`);
        return null;
      }

      const dayType = cols[0].trim();
      const routeId = cols[1].trim();
      const departureTime = cols[2].trim();
      const origin = cols[3].trim();
      const stopsRaw = cols[4].trim();
      const routeDescription = cols[5].trim();
      const returnTime = cols[6] ? cols[6].trim() : "";

      if (!dayType || !routeId || !departureTime || !origin || !stopsRaw) {
        console.warn(`Invalid outside route data at line ${index + 2}`);
        return null;
      }

      return {
        dayType,
        routeId,
        departureTime,
        origin,
        stops: stopsRaw.split(">").map(s => s.trim()),
        routeDescription,
        returnTime
      };
    })
    .filter(Boolean);
}