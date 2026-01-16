// Enhanced Analytics for Bus Schedule App

// Track PWA vs Web usage
function trackAppMode() {
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
  gtag('event', 'app_session_start', {
    'app_mode': isInstalled ? 'installed_pwa' : 'web_browser',
    'page_path': window.location.pathname
  });
}

// Track direction button clicks
function trackDirectionClick(from, to) {
  gtag('event', 'direction_selected', {
    'event_category': 'Campus Shuttle',
    'event_label': `${from} to ${to}`,
    'from_location': from,
    'to_location': to
  });
}

// Track journey planner usage
function trackJourneySearch(day, from, to, time) {
  gtag('event', 'journey_search', {
    'event_category': 'Journey Planner',
    'day_selected': day,
    'from_stop': from,
    'to_stop': to,
    'search_time': time
  });
}

// Track outside campus bus searches
function trackOutsideSearch(day, destination, timePeriod) {
  gtag('event', 'outside_bus_search', {
    'event_category': 'Outside Campus',
    'destination': destination,
    'day': day,
    'time_period': timePeriod
  });
}

// Track PWA install
function trackPWAInstall() {
  gtag('event', 'pwa_installed', {
    'event_category': 'PWA',
    'event_label': 'App installed to home screen'
  });
}

// Track install prompt shown
function trackInstallPromptShown() {
  gtag('event', 'install_prompt_shown', {
    'event_category': 'PWA',
    'event_label': 'Install prompt displayed'
  });
}

// Track install prompt accepted/dismissed
function trackInstallPromptResponse(accepted) {
  gtag('event', accepted ? 'install_accepted' : 'install_dismissed', {
    'event_category': 'PWA',
    'event_label': accepted ? 'User accepted install' : 'User dismissed install'
  });
}

// Track toggle interactions
function trackToggle(section, isOpen) {
  gtag('event', 'section_toggle', {
    'event_category': 'UI Interaction',
    'event_label': section,
    'action': isOpen ? 'opened' : 'closed'
  });
}

// Initialize on page load
window.addEventListener('load', () => {
  trackAppMode();
});
