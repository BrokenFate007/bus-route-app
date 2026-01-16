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
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
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
