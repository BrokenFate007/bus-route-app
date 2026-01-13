async function loadRoutes() {
  const response = await fetch("data/routes.tsv");
  const text = await response.text();

  const lines = text.trim().split("\n");
  lines.shift(); // remove header line

  return lines.map(line => {
    const cols = line.split("\t");

    return {
      dayType: cols[0].trim(),   // Monday, Tuesday, ...
      from: cols[1].trim(),      // Nila
      to: cols[2].trim(),        // Sahyadri
      time: cols[3].trim(),      // 8:30
      count: Number(cols[4].trim())
    };
  });
}
