// Install functionality
let deferredPrompt;
const installBtn = document.getElementById('installButton');
const installContainer = document.getElementById('installContainer');

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome's default install prompt
  e.preventDefault();
  
  // Save the event for later use
  deferredPrompt = e;
  
  // Show our custom install button
  installContainer.classList.remove('hidden');
  
  console.log('✅ Install prompt available');
  
  // TRACK: Install prompt shown
  if (typeof trackInstallPromptShown === 'function') {
    trackInstallPromptShown();
  }
});

// Handle install button click
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        alert('App is already installed! 🎉');
        return;
      }
      
      // Show iOS instructions
      if (isIOS()) {
        showIOSInstructions();
        return;
      }
      
      alert('Install option not available. Try from browser menu.');
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }
    
    // TRACK: Install prompt response
    if (typeof trackInstallPromptResponse === 'function') {
      trackInstallPromptResponse(outcome === 'accepted');
    }
    
    // Clear the prompt
    deferredPrompt = null;
    
    // Hide button
    installContainer.classList.add('hidden');
  });
}

// Detect iOS
function isIOS() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
}

// Show iOS installation instructions
function showIOSInstructions() {
  const hint = document.createElement('div');
  hint.className = 'ios-hint';
  hint.innerHTML = `
    <strong>📱 Install on iOS:</strong><br>
    Tap the <strong>Share</strong> button (□↑) below,<br>
    then select <strong>"Add to Home Screen"</strong>
  `;
  
  installContainer.appendChild(hint);
  
  // Remove hint after 10 seconds
  setTimeout(() => {
    hint.remove();
  }, 10000);
}

// Listen for app installed event
window.addEventListener('appinstalled', (e) => {
  console.log('✅ App installed successfully!');
  
  // Hide install button
  installContainer.classList.add('hidden');
  
  // Clear the prompt
  deferredPrompt = null;
  
  // TRACK: PWA installation success
  if (typeof trackPWAInstall === 'function') {
    trackPWAInstall();
  }
});

// Check if already installed
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('✅ App is running in standalone mode (already installed)');
  // Keep button hidden
  if (installContainer) {
    installContainer.classList.add('hidden');
  }
}


// [Keep all your install functionality as is - it's perfect!]

// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(function(registration) {
      console.log('✅ Service Worker registered');
      
      // Check for updates immediately
      registration.update();
      
      // Optional: Listen for updates
      registration.addEventListener('updatefound', function() {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 Update ready! Will activate on next visit.');
          }
        });
      });
      
      // Check for updates every 30 minutes
      setInterval(function() {
        registration.update();
      }, 1800000);
    })
    .catch(function(error) {
      console.error('❌ Service Worker registration failed:', error);
    });
}

// Display app version from service worker
function displayAppVersion() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Send message to service worker to get version
    navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });
  } else {
    // Fallback: try to parse from service-worker.js
    fetch('./service-worker.js')
      .then(response => response.text())
      .then(text => {
        const match = text.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
        if (match) {
          const version = match[1].split('-v')[1] || match[1];
          document.getElementById('appVersion').textContent = version;
        } else {
          document.getElementById('appVersion').textContent = '1.2.2';
        }
      })
      .catch(() => {
        document.getElementById('appVersion').textContent = '1.2.2';
      });
  }
}

// Listen for version response from service worker
navigator.serviceWorker.addEventListener('message', function(event) {
  if (event.data.type === 'VERSION') {
    document.getElementById('appVersion').textContent = event.data.version;
  }
});

// Call when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayAppVersion);
} else {
  displayAppVersion();
}
