async function loadRoutes() {
  const response = await fetch("data/routes.txt");
  const text = await response.text();

  const lines = text.trim().split("\n");
  const headers = lines.shift().split("\t");

  return lines.map(line => {
    const cols = line.split("\t");
    return {
      day: cols[0],
      from: cols[1],
      to: cols[2],
      time: cols[3],
      count: Number(cols[4])
    };
  });
}
