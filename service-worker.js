const CACHE_NAME = 'iitp-bus-v1.2.4';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/clock.js',
  './js/dataLoader.js',
  './js/routeEngine.js',
  './js/install.js',
  './data/inside_routes.tsv',
  './data/outside_routes.tsv'
];

// Install service worker and cache resources
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Opened cache:', CACHE_NAME);
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch from cache, fallback to network
// Fetch from cache, fallback to network
self.addEventListener('fetch', function(event) {
  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request).then(function(response) {
          // Only cache successful responses
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(function(error) {
        console.log('Fetch failed:', error);
        // Optional: return offline page for HTML requests
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});


// Handle messages from app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'GET_VERSION') {
    // Extract version from CACHE_NAME
    const version = CACHE_NAME.split('-v')[1] || CACHE_NAME;
    
    // Send version back to the app
    event.source.postMessage({
      type: 'VERSION',
      version: version
    });
  }
});