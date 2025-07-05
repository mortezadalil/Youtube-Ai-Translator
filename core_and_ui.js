// YouTube Subtitle Translator - Enhanced Version
console.log('🚀 YouTube Translator Extension Loading...');

let navigationObserver = null; // Store observer reference to disconnect if needed
let translatedSubtitles = []; // Store the parsed translated subtitles
let subtitleOverlay = null; // Element to display the subtitles
let isDisplayingSubtitles = false; // Flag to check if we're already displaying subtitles
let subtitleUpdateInterval = null; // Interval for updating subtitle display
let currentVideoId = ''; // Current video ID
let lastProcessedUrl = ''; // Track the last processed URL to avoid duplicate processing
let isSubtitleVisible = true; // Flag to track subtitle visibility state
let originalSubtitleXml = ''; // Store the original subtitle XML
let translatedSubtitleXml = ''; // Store the translated subtitle XML
let subtitleTimeOffset = 0; // Time offset in seconds for subtitle synchronization
let subtitleTimeMultiplier = 1.0; // Time multiplier for subtitle synchronization
let subtitleVerticalPosition = 80; // Vertical position in pixels from bottom (default: 80px)
let originalSubtitleVerticalPosition = 20; // Original subtitle position from top (default: 20px)
let subtitleFontSize = 18; // Subtitle font size in pixels (default: 18px)
let isSettingsBoxCollapsed = false; // Track if settings box is collapsed - default to expanded
let isTranslationInProgress = false; // Track if translation is currently in progress
let showOriginalLanguage = false; // Flag to track original language display state
let originalSubtitles = []; // Store the original subtitles
let showPreviousNextSubtitles = true; // Flag to control showing previous/next subtitles (default: true)
let isInitializing = false; // Flag to prevent multiple simultaneous initialization

// Manual activation function for debugging
function activateSubtitleTranslator() {
  
  // Force remove any existing elements
  removeSettingsBox();
  
  // Reset state
  isDisplayingSubtitles = false;
  isSubtitleVisible = false;
  translatedSubtitles = [];
  
  // Get current video ID
  currentVideoId = new URLSearchParams(window.location.search).get('v');
  // Video ID set
  
  // Create styles
  createStyles();
  
  // Force create settings box
  const content = forceCreateSettingsBox();
  
  if (content) {
          // Manual activation successful
    showNotification('اکستنشن به صورت دستی فعال شد');
  } else {
    console.error('❌ [MANUAL] Manual activation failed');
          // Error in manual activation
    showNotification('خطا در فعال‌سازی دستی اکستنشن');
  }
}

// Make the function globally available for debugging
window.activateSubtitleTranslator = activateSubtitleTranslator;

// Initialize the extension
function init() {
  // Prevent multiple simultaneous initialization
  if (isInitializing) {
    return;
  }
  
  isInitializing = true;
  
  // Clean up localStorage first
  cleanupLocalStorage();
  
    // Check if we're on a YouTube video page
  if (!window.location.href.includes('youtube.com/watch')) {
    isInitializing = false;
    return;
  }
  
  // Get the current video ID
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) {
    console.error('[INIT] Could not find video ID in URL during initialization');
    isInitializing = false;
    return;
  }
  
  // Clear previous video's subtitles if video ID changed
  if (currentVideoId && currentVideoId !== videoId) {
    clearCurrentVideoData();
  }

  currentVideoId = videoId;
  lastProcessedUrl = window.location.href;

  // Check if this video has saved subtitles in localStorage
  const savedSubtitles = loadSubtitlesFromStorage(videoId);
  if (savedSubtitles && savedSubtitles.length > 0) {
    // Load the saved subtitles for display
    translatedSubtitles = savedSubtitles;
  } else {
    // Clear any existing subtitles and hide subtitle display
    translatedSubtitles = [];
    isDisplayingSubtitles = false;
    removeExistingOverlay();
  }

  // Create styles for the button and subtitles
  createStyles();
  
  // Load saved settings
  loadSubtitlePosition();
  loadSubtitleFontSize();
  loadSubtitleTimeOffset();
  loadOriginalSubtitlePosition();
  loadOriginalLanguageSetting();
  loadPreviousNextSubtitlesSetting();
  
  // Setup mutation observer to detect video navigation
  setupNavigationObserver();
  
  // Create the UI
  const settingsContent = createSettingsBox();
  
  if (settingsContent) {
    // Explicitly add translate button
    setTimeout(() => {
  addTranslateButton();
    }, 500);
  } else {
    console.error('[INIT] Failed to create settings box');
    // Try one more time with extra logging
    const container = findYouTubeVideoContainer();
    
    // Try again after a longer delay
    setTimeout(() => {
      const retrySettingsContent = createSettingsBox();
      if (retrySettingsContent) {
        setTimeout(() => addTranslateButton(), 300);
      } else {
        console.error('[INIT] Retry also failed, forcing creation with body fallback...');
        // Force create with body as container
        forceCreateSettingsBox();
      }
    }, 2000);
  }
  
  // Create a notification to let the user know the extension is loaded
  showNotification('مترجم زیرنویس یوتیوب فعال شد - کلیک کنید تا ترجمه شود');
  
  // Auto-retry activation after 5 seconds if no settings box is visible
  setTimeout(() => {
    const existingBox = document.getElementById('subtitle-settings-box');
    if (!existingBox || existingBox.style.display === 'none') {
      if (!isInitializing) {
        // Silent activation without notification (since we already showed one)
        
        // Force remove any existing elements
        removeSettingsBox();
        
        // Reset state
        isDisplayingSubtitles = false;
        isSubtitleVisible = false;
        translatedSubtitles = [];
        
        // Get current video ID
        currentVideoId = new URLSearchParams(window.location.search).get('v');
        
        // Create styles
        createStyles();
        
        // Force create settings box (without notification)
        forceCreateSettingsBox();
    } else {
      }
    } else {
    }
  }, 5000);
  
  
  // Reset initialization flag
  isInitializing = false;
}

// Clear current video data when switching videos
function clearCurrentVideoData() {
  
  // Stop subtitle updates
  if (subtitleUpdateInterval) {
    clearInterval(subtitleUpdateInterval);
    subtitleUpdateInterval = null;
  }
  
  // Clear subtitle arrays
  translatedSubtitles = [];
  originalSubtitles = [];
  
  // Hide and remove subtitle overlays
  removeExistingOverlay();
  removeOriginalSubtitleOverlay();
  
  // Reset subtitle display state
  isDisplayingSubtitles = false;
  isSubtitleVisible = true;
  
  // Clear any ongoing translation
  isTranslationInProgress = false;
  
  // Force cancel all active translation requests
  try {
    forceCancelAllTranslationRequests();
  } catch(e) {
  }
  
  // Clear time range settings for new video
  localStorage.removeItem('translationStartTime');
  localStorage.removeItem('translationEndTime');
  
}

// Clean up old or corrupted subtitle data in localStorage
function cleanupLocalStorage() {
  try {
    
    // Get all keys in localStorage
    const keys = Object.keys(localStorage);
    
    // Find subtitle keys
    const subtitleKeys = keys.filter(key => key.startsWith('youtube_subtitles_'));
    
    // Check each key
    let removed = 0;
    let repaired = 0;
    
    for (const key of subtitleKeys) {
      try {
        const data = localStorage.getItem(key);
        if (!data) {
          // Empty data, remove it
          localStorage.removeItem(key);
          removed++;
          continue;
        }
        
        // Try to parse the data
        try {
          const parsed = JSON.parse(data);
          
          // Check if it's valid
          if (!parsed.subtitles || !Array.isArray(parsed.subtitles) || parsed.subtitles.length === 0) {
            localStorage.removeItem(key);
            removed++;
            continue;
          }
          
          // Check if it's too old (older than 60 days)
          if (parsed.timestamp) {
            const ageInDays = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
            if (ageInDays > 60) {
              localStorage.removeItem(key);
              removed++;
              continue;
            }
          }
          
          // Everything seems fine, keep this entry
        } catch (parseError) {
          // Invalid JSON, remove it
          localStorage.removeItem(key);
          removed++;
        }
      } catch (keyError) {
        console.error(`[CLEANUP] Error processing key: ${key}`, keyError);
      }
    }
    
    
    // Check total localStorage usage
    try {
      const totalSize = JSON.stringify(localStorage).length;
    } catch (sizeError) {
      console.error('[CLEANUP] Error calculating localStorage size:', sizeError);
    }
  } catch (error) {
    console.error('[CLEANUP] Error during localStorage cleanup:', error);
  }
}

// Save subtitles to localStorage
function saveSubtitlesToStorage(videoId, subtitles) {
  try {
    
    if (!videoId) {
      console.error('[STORAGE] Cannot save subtitles: No video ID provided');
      return false;
    }
    
    if (!subtitles || !Array.isArray(subtitles) || subtitles.length === 0) {
      console.error('[STORAGE] Cannot save subtitles: Invalid or empty subtitles array');
      return false;
    }
    
    // Create storage key for this video
    const storageKey = `youtube_subtitles_${videoId}`;
    
    // Save the subtitles and timestamp
    const subtitleData = {
      subtitles: subtitles,
      timestamp: Date.now(),
      videoId: videoId
    };
    
    // Convert to JSON and save
    const jsonData = JSON.stringify(subtitleData);
    
    try {
      localStorage.setItem(storageKey, jsonData);
    } catch (storageError) {
      console.error('[STORAGE] Error in localStorage.setItem:', storageError);
      
      // Try to diagnose why storage might be failing
      try {
        const availableSpace = 5 * 1024 * 1024; // Approx 5MB
        const usedSpace = JSON.stringify(localStorage).length;
        console.error(`[STORAGE] localStorage usage: ${usedSpace} bytes out of ~${availableSpace} bytes`);
        
        if (jsonData.length > 2 * 1024 * 1024) { // If data is > 2MB
          console.error('[STORAGE] Data is too large for localStorage, trying to trim');
          
          // Try to save a smaller version by limiting subtitle count
          const trimmedSubtitles = subtitles.slice(0, Math.min(500, subtitles.length));
          const trimmedData = {
            subtitles: trimmedSubtitles,
            timestamp: Date.now(),
            videoId: videoId,
            note: 'This data was trimmed due to size constraints'
          };
          
          localStorage.setItem(storageKey, JSON.stringify(trimmedData));
        }
      } catch (diagError) {
        console.error('[STORAGE] Error while diagnosing storage issues:', diagError);
      }
      
      return false;
    }
    
    // Verify the save was successful
    const savedData = localStorage.getItem(storageKey);
    if (!savedData) {
      console.error('[STORAGE] Save verification failed: Data not found in localStorage after save');
      return false;
    }
    
    
    try {
      const parsedData = JSON.parse(savedData);
      if (!parsedData.subtitles || !Array.isArray(parsedData.subtitles) || parsedData.subtitles.length === 0) {
        console.error('[STORAGE] Save verification failed: Retrieved data is invalid or empty');
        console.error('[STORAGE] Parsed data structure:', JSON.stringify(Object.keys(parsedData)));
        return false;
      }
      
    } catch (parseError) {
      console.error('[STORAGE] Save verification failed: Could not parse saved data', parseError);
      return false;
    }
    
    // Also save to recent videos list
    updateRecentVideosList(videoId);
    
    // Refresh UI to show "Show Saved Subtitles" button if needed
    setTimeout(() => {
      if (getCurrentVideoId() === videoId) {
        addTranslateButton();
      }
    }, 100);
    
    return true;
  } catch (error) {
    console.error('[STORAGE] Critical error saving subtitles to localStorage:', error);
    return false;
  }
}

// Load subtitles from localStorage
function loadSubtitlesFromStorage(videoId) {
  try {
    
    if (!videoId) {
      console.error('[STORAGE_LOAD] Cannot load subtitles: No video ID provided');
      return null;
    }
    
    // Create storage key for this video
    const storageKey = `youtube_subtitles_${videoId}`;
    
    // Get data from localStorage
    const data = localStorage.getItem(storageKey);
    if (!data) {
      
      // Try backup key if exists
      const backupKey = `youtube_subtitles_backup_${videoId}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const parsedBackup = JSON.parse(backupData);
          if (parsedBackup.subtitles && Array.isArray(parsedBackup.subtitles) && parsedBackup.subtitles.length > 0) {
            return parsedBackup.subtitles;
          }
        } catch (backupError) {
          console.error('[STORAGE_LOAD] Error parsing backup data:', backupError);
        }
      }
      
      return null;
    }
    
    
    // Parse the data
    try {
    const subtitleData = JSON.parse(data);
    
    // Verify it's the right video and has subtitles
      if (subtitleData.videoId !== videoId) {
        console.error(`[STORAGE_LOAD] Invalid subtitle data: Video ID mismatch. Expected ${videoId}, got ${subtitleData.videoId}`);
        return null;
      }
      
      if (!subtitleData.subtitles || !Array.isArray(subtitleData.subtitles)) {
        console.error('[STORAGE_LOAD] Invalid subtitle data: Missing or invalid subtitles array');
        console.error('[STORAGE_LOAD] Data structure:', JSON.stringify(Object.keys(subtitleData)));
        return null;
      }
      
      if (subtitleData.subtitles.length === 0) {
        console.error('[STORAGE_LOAD] Invalid subtitle data: Empty subtitles array');
      return null;
    }
    
    // Check timestamp (optional - could expire after certain time if needed)
    const now = Date.now();
    const ageInDays = (now - subtitleData.timestamp) / (1000 * 60 * 60 * 24);
    if (ageInDays > 30) { // Expire after 30 days
      localStorage.removeItem(storageKey);
      return null;
    }
    
      
    return subtitleData.subtitles;
    } catch (parseError) {
      console.error('[STORAGE_LOAD] Error parsing subtitle data from localStorage:', parseError);
      
      // If the error is parse-related, try to recover partial data
      try {
        const subtitleMatches = data.match(/"startTime":([^,]+),"endTime":([^,]+),"duration":([^,]+),"text":"([^"]+)"/g);
        
        if (subtitleMatches && subtitleMatches.length > 0) {
          
          const recoveredSubtitles = [];
          const subtitleRegex = /"startTime":([^,]+),"endTime":([^,]+),"duration":([^,]+),"text":"([^"]+)"/;
          
          for (const match of subtitleMatches) {
            const parts = subtitleRegex.exec(match);
            if (parts && parts.length === 5) {
              try {
                const startTime = parseFloat(parts[1]);
                const endTime = parseFloat(parts[2]);
                const duration = parseFloat(parts[3]);
                const text = parts[4].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                
                if (!isNaN(startTime) && !isNaN(endTime) && !isNaN(duration)) {
                  recoveredSubtitles.push({
                    startTime,
                    endTime,
                    duration,
                    text
                  });
                }
              } catch (recoveryError) {
                console.error('[STORAGE_LOAD] Error recovering individual subtitle:', recoveryError);
              }
            }
          }
          
          if (recoveredSubtitles.length > 0) {
            return recoveredSubtitles;
          }
        }
      } catch (recoveryError) {
        console.error('[STORAGE_LOAD] Error during recovery attempt:', recoveryError);
      }
      
      // Clean up invalid data
      localStorage.removeItem(storageKey);
      return null;
    }
  } catch (error) {
    console.error('[STORAGE_LOAD] Critical error loading subtitles from localStorage:', error);
    return null;
  }
}

// Update the list of recent videos with translations
function updateRecentVideosList(videoId) {
  try {
    // Get current list
    let recentVideos = JSON.parse(localStorage.getItem('youtube_recent_translated_videos') || '[]');
    
    // Add current video to the beginning (if not already there)
    if (!recentVideos.includes(videoId)) {
      recentVideos.unshift(videoId);
      
      // Keep only the last 20 videos
      if (recentVideos.length > 20) {
        recentVideos = recentVideos.slice(0, 20);
      }
      
      // Save updated list
      localStorage.setItem('youtube_recent_translated_videos', JSON.stringify(recentVideos));
    }
  } catch (error) {
    console.error('Error updating recent videos list:', error);
  }
}

// Create CSS styles for the button and subtitle overlay
function createStyles() {
  // First load the Vazir font CSS
  loadVazirFont();
  
  const style = document.createElement('style');
  style.textContent = `
    .subtitle-settings-box {
      position: absolute !important;
      top: 10px !important;
      left: 10px !important;
      z-index: 2147483647 !important;
      background-color: rgba(0, 0, 0, 0.95) !important;
      border: 2px solid #673AB7 !important;
      border-radius: 8px;
      padding: 10px;
      width: 220px;
      direction: rtl;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8) !important;
      transition: all 0.3s ease;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    .subtitle-settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .subtitle-settings-title {
      color: white;
      font-weight: bold;
      font-size: 16px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .subtitle-settings-controls {
      display: flex;
      gap: 5px;
    }
    
    .subtitle-settings-toggle,
    .subtitle-settings-gear {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      transition: background-color 0.2s;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .subtitle-settings-toggle:hover,
    .subtitle-settings-gear:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .subtitle-settings-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow: hidden;
      max-height: 600px;
      transition: max-height 0.3s ease;
    }
    
    .subtitle-settings-content.collapsed {
      max-height: 0;
    }
    
    .subtitle-translate-button {
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      direction: rtl;
      transition: background-color 0.2s;
      padding: 6px 10px;
      width: 100%;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      margin-bottom: 6px;
    }
    
    .subtitle-translate-button:hover {
      background-color: rgba(0, 0, 0, 0.9);
    }
    
    .subtitle-translate-button.loading {
      background-color: #f49b39;
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .subtitle-translate-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }
    
    .subtitle-translate-button.active {
      background-color: #4CAF50;
    }

    .subtitle-translate-button.green {
      background-color: #4CAF50;
      color: white;
      font-weight: bold;
    }
    
    .subtitle-translate-button.green:hover {
      background-color: #45a049;
    }
    
    .subtitle-translate-button.orange {
      background-color: #FF9800;
      color: white;
      font-weight: bold;
      font-size: 12px;
    }
    
    .subtitle-translate-button.orange:hover {
      background-color: #F57C00;
    }
    
    .subtitle-translate-button.red {
      background-color: #f44336;
      color: white;
      font-weight: bold;
    }
    
    .subtitle-translate-button.red:hover {
      background-color: #d32f2f;
    }
    
    .subtitle-visibility-button {
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      direction: rtl;
      transition: background-color 0.2s;
      padding: 6px 10px;
      width: 100%;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      margin-bottom: 6px;
    }
    
    .subtitle-visibility-button:hover {
      background-color: rgba(0, 0, 0, 0.9);
    }
    
    .subtitle-visibility-button.hidden {
      background-color: #F44336;
    }

    .subtitle-visibility-button.bright-green {
      background-color: #00C853;
      color: white;
      font-weight: bold;
    }
    
    .subtitle-visibility-button.bright-green:hover {
      background-color: #00B34A;
    }
    
    .subtitle-refresh-button {
      background-color: #FF9800;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      direction: rtl;
      transition: background-color 0.2s;
      padding: 6px 10px;
      width: 100%;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      margin-bottom: 6px;
    }
    
    .subtitle-refresh-button:hover {
      background-color: #F57C00;
    }
    
    .subtitle-refresh-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }
    
    .subtitle-sync-controls {
      background-color: rgba(0, 0, 0, 0.4);
      color: white;
      border-radius: 4px;
      font-size: 14px;
      direction: rtl;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .subtitle-sync-title {
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .subtitle-sync-control {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .subtitle-sync-control button {
      background-color: #673AB7;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 6px;
      cursor: pointer;
      margin: 0 2px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .subtitle-sync-control button:hover {
      background-color: #5E35B1;
    }
    
    .subtitle-sync-value {
      font-size: 12px;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      min-width: 40px;
      text-align: center;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .collapsed-button {
      position: absolute !important;
      top: 10px !important;
      left: 10px !important;
      z-index: 2147483647 !important;
      background-color: rgba(0, 0, 0, 0.95) !important;
      border: 2px solid #673AB7 !important;
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8) !important;
      transition: all 0.3s ease;
      display: none;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .collapsed-button:hover {
      background-color: rgba(0, 0, 0, 1);
    }
    
    .subtitle-overlay {
      position: absolute;
      bottom: 80px;
      left: 0;
      width: 100%;
      text-align: center;
      z-index: 9999999;
      pointer-events: none;
      direction: rtl;
    }
    
    .subtitle-text {
      display: inline-block;
      background-color: rgba(0, 0, 0, 0.7);
      //color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      font-size: 18px !important;
      font-weight: bold;
      max-width: 80%;
      margin: 0 auto;
      line-height: 1.5;
      text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }
    
    .subtitle-context {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      max-width: 80%;
      margin: 0 auto;
    }
    
    .subtitle-previous,
    .subtitle-next {
      display: inline-block;
      background-color: rgba(0, 0, 0, 0.7);
     // color: rgb(255, 255, 255);
      padding: 5px 15px;
      border-radius: 3px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      font-size: 14px !important;
      font-weight: normal;
      max-width: 90%;
      line-height: 1.3;
      text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    
    .subtitle-previous {
      margin-bottom: 3px;
    }
    
    .subtitle-next {
      margin-top: 3px;
    }
    
    .api-key-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999999;
      background-color: rgba(0, 0, 0, 0.9);
      border-radius: 8px;
      padding: 15px;
      width: 340px;
      direction: rtl;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      display: none;
    }
    
    .api-key-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .api-key-panel-title {
      color: white;
      font-weight: bold;
      font-size: 16px;
    }
    
    .api-key-panel-close {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .api-key-panel-close:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .api-key-panel-content {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .api-key-panel-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .api-key-panel-label {
      color: white;
      font-size: 14px;
    }
    
    .api-key-panel-input {
      padding: 8px 10px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      direction: ltr;
      text-align: left;
      width: calc(100% - 20px);
    }
    
    .api-key-panel-input:focus {
      outline: none;
      border-color: #4CAF50;
    }
    
    .api-key-panel-info {
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      margin-top: 5px;
    }
    
    .api-key-panel-button {
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 15px;
      font-size: 14px;
      cursor: pointer;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      width: 100%;
      margin-top: 5px;
    }
    
    .api-key-panel-button:hover {
      background-color: #45a049;
    }
    
    .subtitle-refresh-button:hover {
      background-color: #F57C00;
    }
    
    .subtitle-download-button {
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      direction: rtl;
      transition: background-color 0.2s;
      padding: 8px 12px;
      width: 100%;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      margin-top: 5px;
    }
    
    .subtitle-download-button:hover {
      background-color: #1976D2;
    }
    
    .subtitle-download-button.english {
      background-color: #3F51B5;
    }
    
    .subtitle-download-button.english:hover {
      background-color: #303F9F;
    }
    
    .subtitle-time-range {
      background-color: rgba(0, 0, 0, 0.4);
      color: white;
      border-radius: 4px;
      font-size: 14px;
      direction: rtl;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      margin-bottom: 10px;
    }
    
    .subtitle-time-range-title {
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 13px;
      text-align: center;
    }
    
    .subtitle-time-range-control {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .subtitle-time-range-control button {
      background-color: #673AB7;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 6px;
      cursor: pointer;
      margin: 0 2px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      font-size: 12px;
      min-width: 24px;
    }
    
    .subtitle-time-range-control button:hover {
      background-color: #5E35B1;
    }
    
    .subtitle-time-range-value {
      font-size: 12px;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      min-width: 50px;
      text-align: center;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .subtitle-time-info {
      color: rgba(255, 255, 255, 0.7);
      font-size: 11px;
      text-align: center;
      margin-top: 4px;
    }
    
    .persistent-progress {
      background-color: rgba(0, 0, 0, 0.6);
      color: white;
      border-radius: 4px;
      font-size: 11px;
      direction: rtl;
      padding: 6px;
      margin-bottom: 8px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .persistent-progress-title {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 11px;
      text-align: center;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .persistent-progress-bar-container {
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      height: 16px;
      margin: 4px 0;
      overflow: hidden;
      position: relative;
      direction: ltr;
    }
    
    .persistent-progress-bar {
      background: linear-gradient(90deg, #2196F3, #4CAF50);
      height: 100%;
      border-radius: 8px;
      transition: width 0.3s ease;
      width: 0%;
      position: relative;
    }
    
    .persistent-progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 10px;
      font-weight: bold;
      text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.7);
      z-index: 1;
    }
    
    .persistent-progress-status {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 2px;
      text-align: center;
    }
    
    /* Original subtitle position controls */
    .original-position-container {
      margin: 0 0 6px 0;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .original-position-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 3px 0;
      padding: 6px;
      background-color: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .original-status-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      padding: 4px 6px;
      background-color: rgba(0, 0, 0, 0.4);
      border-radius: 3px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .original-status-label {
      color: white;
      font-size: 10px;
      font-weight: bold;
      direction: rtl;
      text-align: right;
    }
    
    .original-status-value {
      font-size: 10px;
      font-weight: bold;
      direction: rtl;
      text-align: right;
    }
    
    /* Subtitle position controls - same style as original position controls */
    .subtitle-position-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 6px 0;
      padding: 6px;
      background-color: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    /* Original language controls - same style as position controls */
    .original-language-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      padding: 6px;
      background-color: transparent;
      border-radius: 4px;
      border: none;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      flex: 1;
    }
    
    .original-position-label,
    .subtitle-position-label,
    .original-language-label {
      color: white;
      font-size: 11px;
      font-weight: bold;
      direction: rtl;
      text-align: right;
      // min-width: 90px;
    }
    
    .original-position-buttons,
    .subtitle-position-buttons {
      display: flex;
      align-items: center;
      gap: 3px;
    }
    
    .original-position-button,
    .subtitle-position-button {
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 3px;
      width: 20px;
      height: 20px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }
    
    .original-position-button:hover,
    .subtitle-position-button:hover {
      background-color: #45a049;
    }
    
    .original-position-value,
    .subtitle-position-value {
      color: white;
      font-size: 10px;
      font-weight: bold;
      min-width: 30px;
      text-align: center;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 2px 4px;
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    /* Original language checkbox styling */
    .original-language-checkbox {
      width: 16px;
      height: 16px;
      accent-color: #4CAF50;
      cursor: pointer;
      margin: 0;
    }
    
    .original-language-checkbox:checked {
      background-color: #4CAF50;
    }
    
    .original-subtitle-overlay {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483646;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 14px;
      line-height: 1.4;
      text-align: center;
      max-width: 80%;
      word-wrap: break-word;
      direction: ltr;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: none;
    }
    
    
    
    
    
    
    
  `;
  document.head.appendChild(style);
}

// Function to load Vazir font CSS
function loadVazirFont() {
  // Check if the font is already loaded
  if (document.getElementById('vazir-font-css')) {
    return;
  }
  
  // Try to use the external CSS file first
  try {
    // Get the path to the CSS file (relative to extension)
    const fontCssPath = chrome.runtime.getURL('vazir-font.css');
    
    // Create link element
    const link = document.createElement('link');
    link.id = 'vazir-font-css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = fontCssPath;
    
    // Add to document head
    document.head.appendChild(link);
    
  } catch (error) {
    // Fallback: Directly embed Vazir font CSS in the page
    
    const style = document.createElement('style');
    style.id = 'vazir-font-css';
    style.textContent = `
      @font-face {
        font-family: 'Vazirmatn';
        font-style: normal;
        font-weight: 400;
        src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff2') format('woff2');
      }
      
      @font-face {
        font-family: 'Vazirmatn';
        font-style: normal;
        font-weight: 700;
        src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2');
      }
      
      .persian-text {
        font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
        direction: rtl;
        text-align: right;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Function to find the YouTube video container more reliably
function findYouTubeVideoContainer() {
  // Try multiple selectors in order of preference
  const selectors = [
    '#movie_player',
    '.html5-video-container',
    '.html5-main-video',
    '#player-container',
    '#player',
    '.ytp-chrome-top',
    '.video-stream',
    'video', // As a last resort
    '#ytd-player',
    'ytd-player',
    '#primary-inner',
    '#primary',
    '#content',
    '.ytd-watch-flexy',
    '#columns',
    '#page-manager'
  ];
  
  let container = null;
  
  
  // Try each selector
  for (const selector of selectors) {
    container = document.querySelector(selector);
    if (container) {
      
      // If we found the video element itself, get its parent
      if (selector === 'video' || selector === '.html5-main-video' || selector === '.video-stream') {
        if (container.parentNode) {
          container = container.parentNode;
        }
      }
      
      // Make sure the container has relative or absolute positioning
      const computedStyle = window.getComputedStyle(container);
      if (computedStyle.position === 'static') {
        container.style.position = 'relative';
      }
      
      break;
    }
  }
  
  // If still no container found, use body as fallback
  if (!container) {
    console.warn('[CONTAINER] Could not find any YouTube video container, using body as fallback');
    container = document.body;
  }
  
  return container;
}

// Create settings box
function createSettingsBox() {
  // Remove existing settings box if any
  removeSettingsBox();
  
  // Find the video container to position the settings box relative to it
  const videoContainer = findYouTubeVideoContainer();
                        
  if (!videoContainer) {
    console.error('Could not find YouTube video container for settings box positioning');
    return null;
  }
  
  // Create settings box container
  const settingsBox = document.createElement('div');
  settingsBox.className = 'subtitle-settings-box';
  settingsBox.id = 'subtitle-settings-box';
  
  // Create header with title and toggle button
  const header = document.createElement('div');
  header.className = 'subtitle-settings-header';
  
  const title = document.createElement('div');
  title.className = 'subtitle-settings-title';
  title.textContent = 'تنظیمات زیرنویس';
  
  // Create controls container for buttons
  const controls = document.createElement('div');
  controls.className = 'subtitle-settings-controls';
  
  // Add settings gear button with modern SVG
  const gearButton = document.createElement('button');
  gearButton.className = 'subtitle-settings-gear';
  gearButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>`;
  gearButton.title = 'تنظیمات کلید API';
  gearButton.addEventListener('click', showApiKeyPanel);
  
  // Add prompt editing button next to gear button
  const promptButton = document.createElement('button');
  promptButton.className = 'subtitle-settings-gear';
  promptButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10,9 9,9 8,9"></polyline>
    </svg>
  `;
  promptButton.title = 'ویرایش پرامپت ترجمه';
  promptButton.addEventListener('click', showPromptPanel);
  
  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'subtitle-settings-toggle';
  toggleButton.textContent = '×';
  toggleButton.title = 'بستن پنل تنظیمات';
  toggleButton.addEventListener('click', toggleSettingsBox);
  
  // Add buttons to controls
  controls.appendChild(gearButton);
  controls.appendChild(promptButton);
  controls.appendChild(toggleButton);
  
  // Add elements to header
  header.appendChild(title);
  header.appendChild(controls);
  
  // Create content container
  const content = document.createElement('div');
  content.className = 'subtitle-settings-content';
  content.id = 'subtitle-settings-content';
  
  // Add elements to settings box
  settingsBox.appendChild(header);
  settingsBox.appendChild(content);
  
  // Add to video container instead of body
  videoContainer.appendChild(settingsBox);
  
  // Create collapsed button (+ button)
  const collapsedButton = document.createElement('div');
  collapsedButton.className = 'collapsed-button';
  collapsedButton.id = 'subtitle-collapsed-button';
  collapsedButton.textContent = '+';
  collapsedButton.title = 'باز کردن تنظیمات زیرنویس';
  collapsedButton.addEventListener('click', toggleSettingsBox);
  
  // Initial state: Always show settings box open by default, hide the + button
  content.classList.remove('collapsed');
  settingsBox.style.display = 'block';
  collapsedButton.style.display = 'none';
  
  // Add to video container instead of body
  videoContainer.appendChild(collapsedButton);
  
  // Set the z-index to a very high value to ensure it's visible
  settingsBox.style.zIndex = '2147483647';
  
  // Create the API key panel (hidden initially)
  createApiKeyPanel();
  
  // IMPORTANT: Do NOT call addTranslateButton here - this was causing infinite recursion
  
  return content;
}

// Toggle settings box between expanded and collapsed states
function toggleSettingsBox() {
  isSettingsBoxCollapsed = !isSettingsBoxCollapsed;
  
  const settingsBox = document.getElementById('subtitle-settings-box');
  const content = document.getElementById('subtitle-settings-content');
  const collapsedButton = document.getElementById('subtitle-collapsed-button');
  const toggleButton = document.querySelector('.subtitle-settings-toggle');
  
  if (isSettingsBoxCollapsed) {
    // Instead of just hiding, completely remove the settings box
    removeSettingsBox();
    
    // But keep the + button visible so user can reopen
    const videoContainer = findYouTubeVideoContainer();
    if (videoContainer) {
      // Create collapsed button (+ button) if it doesn't exist
      let collapsedBtn = document.getElementById('subtitle-collapsed-button');
      if (!collapsedBtn) {
        collapsedBtn = document.createElement('div');
        collapsedBtn.className = 'collapsed-button';
        collapsedBtn.id = 'subtitle-collapsed-button';
        collapsedBtn.textContent = '+';
        collapsedBtn.title = 'باز کردن تنظیمات زیرنویس';
        collapsedBtn.addEventListener('click', toggleSettingsBox);
        videoContainer.appendChild(collapsedBtn);
      }
      collapsedBtn.style.display = 'flex';
    }
  } else {
    // Expand - recreate the settings box with all content
    const newContent = createSettingsBox();
    if (newContent) {
      // Add all the buttons and controls
      addTranslateButton();
    }
    
    // Hide the + button
    const collapsedBtn = document.getElementById('subtitle-collapsed-button');
    if (collapsedBtn) {
      collapsedBtn.style.display = 'none';
    }
  }
}

// Remove settings box
function removeSettingsBox() {
  const settingsBox = document.getElementById('subtitle-settings-box');
  if (settingsBox) {
    settingsBox.remove();
  }
  
  const collapsedButton = document.getElementById('subtitle-collapsed-button');
  if (collapsedButton) {
    collapsedButton.remove();
  }
}

// Add translate button
