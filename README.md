# IIT Palakkad Shuttle & Mess Menu 🚌 🍽️

A premium, PWA-enabled, mobile-first web companion designed for the student and staff community of **IIT Palakkad**. This application provides real-time shuttle countdowns, route planning tools, and an elegant digital mess menu with dietary preferences and automatic week-over-week synchronization.

---

## 🌟 Key Features

### 🚌 Shuttle Schedules & Journey Planner
* **Real-Time Timers**: Displays live, down-to-the-second countdowns for upcoming shuttles and shows recently departed campus routes between **Nila Gate** and **Sahyadri**.
* **Campus Route Planner**: Auto-detects the current day and time to let users quickly search for transit options with minimal clicks.
* **Outside Campus Schedules**: Complete and normalized coverage of **Palakkad Town**, **Kalleppully / Malampuzha**, and **Wise Park** routes, incorporating Saturday variations and Friday specials (e.g., Kinar Stop).
* **Standardized Bus Stops**: Corrects and normalizes stops from official PDF schedules, restoring omitted intermediate stop data for accurate return route matching.

### 🍽️ Interactive Mess Menu
* **Meal Podium**: Dynamically features the ongoing or next upcoming meal (Breakfast, Lunch, Snacks, or Dinner) based on local time.
* **Strict Veg / Non-Veg Filtering**: Features a segmented preference switch. Selecting "Veg" filters out non-vegetarian items (including eggs and chicken) and displays veg-only items.
* **Alternating Weekly Sync**: Automatically swaps between **Week 1 & 3** and **Week 2 & 4** menus relative to **May 27, 2026** (using a Monday-to-Sunday relative calculation).
* **Accordion Day Menu**: Collapses non-active meals to fit screens cleanly without excessive scrolling, while remaining expandable on click.
* **Side Details Formatting**: Clean layouts that separate main courses from secondary items (like chutneys, side curries, and timings) into elegant subtitles.

### 📱 Premium PWA Support
* **Offline Mode**: Operates fully offline using an aggressive service worker cache (`iitp-bus-v1.4.3`).
* **iOS Standalone Integration**: Includes specialized viewport settings, Apple touch launch icons, and focus event listeners to prevent default select-dropdown viewport zoom bugs inside iOS WebApp containers.
* **Fluid Dark Mode UI**: Designed with Outfit typography, clean glassmorphism layouts, subtle border indicators (Veg vs Non-veg), and smooth micro-animations.

---

## 📂 Project Directory Structure

```text
├── index.html                  # Main PWA entry viewport
├── manifest.json               # PWA configuration
├── service-worker.js           # Offline resource cacher
├── css/
│   └── style.css               # Styling tokens and component styles
├── data/
│   ├── inside_routes.json      # Campus shuttle timelines
│   ├── outside_routes.json     # Standardized and normalized outside bus runs
│   └── food_menu.json          # Alternating two-week food menu
├── js/
│   ├── app.js                  # Main controller: rendering, time math, week sync
│   ├── clock.js                # Digital clock renderer
│   ├── dataLoader.js           # Async JSON file fetcher
│   ├── install.js              # PWA install banner controller
│   └── routeEngine.js          # Campus route planners and filters
└── icons/                      # Application PWA launcher icons
```
