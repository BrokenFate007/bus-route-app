// Load INSIDE campus routes
async function loadRoutes() {
  const response = await fetch("./data/inside_routes.json", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load inside_routes.json");
  }

  return await response.json();
}

// Load OUTSIDE campus routes
async function loadOutsideRoutes() {
  const res = await fetch("./data/outside_routes.json", { cache: "no-store" });

  if (!res.ok) {
    console.warn("outside_routes.json not found, skipping outside routes");
    return [];
  }

  return await res.json();
}

// Load Food Menu
async function loadFoodMenu() {
  const res = await fetch("./data/food_menu.json", { cache: "no-store" });
  if (!res.ok) {
    console.warn("food_menu.json not found");
    return null;
  }
  return await res.json();
}