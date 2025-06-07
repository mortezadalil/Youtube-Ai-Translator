// YouTube Subtitle Translator - Enhanced Version
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
let isSettingsBoxCollapsed = false; // Track if settings box is collapsed - default to expanded
let isTranslationInProgress = false; // Track if translation is currently in progress
let showOriginalLanguage = false; // Flag to track original language display state
let originalSubtitles = []; // Store the original subtitles
let showPreviousNextSubtitles = true; // Flag to control showing previous/next subtitles (default: true)

// Manual activation function for debugging
function activateSubtitleTranslator() {
  console.log('[MANUAL] Manually activating subtitle translator...');
  
  // Force remove any existing elements
  removeSettingsBox();
  
  // Reset state
  isDisplayingSubtitles = false;
  isSubtitleVisible = false;
  translatedSubtitles = [];
  
  // Get current video ID
  currentVideoId = new URLSearchParams(window.location.search).get('v');
  console.log('[MANUAL] Current video ID:', currentVideoId);
  
  // Create styles
  createStyles();
  
  // Force create settings box
  const content = forceCreateSettingsBox();
  
  if (content) {
    console.log('[MANUAL] Manual activation successful');
    showNotification('اکستنشن به صورت دستی فعال شد');
  } else {
    console.error('[MANUAL] Manual activation failed');
    showNotification('خطا در فعال‌سازی دستی اکستنشن');
  }
}

// Make the function globally available for debugging
window.activateSubtitleTranslator = activateSubtitleTranslator;

// Initialize the extension
function init() {
  console.log('[INIT] YouTube Subtitle Translator initializing...');
  console.log('[INIT] Current URL:', window.location.href);
  
  // Clean up localStorage first
  cleanupLocalStorage();
  
  // Check if we're on a YouTube video page
  if (!window.location.href.includes('youtube.com/watch')) {
    console.log('[INIT] Not on a YouTube video page, exiting init');
    return;
  }

  console.log('[INIT] YouTube video page detected, setting up translator...');
  
  // Get the current video ID
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) {
    console.error('[INIT] Could not find video ID in URL during initialization');
    return;
  }
  
  // Clear previous video's subtitles if video ID changed
  if (currentVideoId && currentVideoId !== videoId) {
    console.log(`[EXIT] 🚪 Exiting video ${currentVideoId} and switching to ${videoId}`);
    console.log(`[INIT] Video changed from ${currentVideoId} to ${videoId}, clearing previous subtitles`);
    clearCurrentVideoData();
  }

  currentVideoId = videoId;
  lastProcessedUrl = window.location.href;
  console.log('[INIT] Current video ID set to:', currentVideoId);

  // Check if this video has saved subtitles in localStorage
  const savedSubtitles = loadSubtitlesFromStorage(videoId);
  if (savedSubtitles && savedSubtitles.length > 0) {
    console.log(`[INIT] ✅ Video ${videoId} has ${savedSubtitles.length} saved subtitles in localStorage`);
    // Load the saved subtitles for display
    translatedSubtitles = savedSubtitles;
  } else {
    console.log(`[INIT] ❌ Video ${videoId} has NO saved subtitles in localStorage`);
    // Clear any existing subtitles and hide subtitle display
    translatedSubtitles = [];
    isDisplayingSubtitles = false;
    removeExistingOverlay();
  }

  // Create styles for the button and subtitles
  createStyles();
  
  // Load saved settings
  loadSubtitlePosition();
  loadOriginalSubtitlePosition();
  loadOriginalLanguageSetting();
  loadPreviousNextSubtitlesSetting();
  
  // Setup mutation observer to detect video navigation
  setupNavigationObserver();
  
  // Create the UI
  console.log('[INIT] Creating settings box...');
  const settingsContent = createSettingsBox();
  
  if (settingsContent) {
    // Explicitly add translate button
    console.log('[INIT] Settings box created successfully, adding translate button...');
    setTimeout(() => {
  addTranslateButton();
    }, 500);
  } else {
    console.error('[INIT] Failed to create settings box');
    // Try one more time with extra logging
    console.log('[INIT] Attempting to find video container manually...');
    const container = findYouTubeVideoContainer();
    console.log('[INIT] Manual container search result:', container ? 'Found' : 'Not found');
    
    // Try again after a longer delay
    setTimeout(() => {
      console.log('[INIT] Retrying settings box creation after delay...');
      const retrySettingsContent = createSettingsBox();
      if (retrySettingsContent) {
        console.log('[INIT] Retry successful, adding translate button...');
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
      console.log('[INIT] Auto-retry: Settings box not found, attempting manual activation...');
      activateSubtitleTranslator();
    } else {
      console.log('[INIT] Auto-retry: Settings box found, no action needed');
    }
  }, 5000);
  
  console.log('[INIT] Initialization complete');
}

// Clear current video data when switching videos
function clearCurrentVideoData() {
  console.log('[EXIT] 🚪 Exiting current video - cleaning up all data...');
  console.log('[CLEAR] Clearing current video data...');
  
  // Stop subtitle updates
  if (subtitleUpdateInterval) {
    clearInterval(subtitleUpdateInterval);
    subtitleUpdateInterval = null;
    console.log('[CLEAR] Stopped subtitle update interval');
  }
  
  // Clear subtitle arrays
  translatedSubtitles = [];
  originalSubtitles = [];
  console.log('[CLEAR] Cleared subtitle arrays');
  
  // Hide and remove subtitle overlays
  removeExistingOverlay();
  removeOriginalSubtitleOverlay();
  console.log('[CLEAR] Removed subtitle overlays');
  
  // Reset subtitle display state
  isDisplayingSubtitles = false;
  isSubtitleVisible = true;
  console.log('[CLEAR] Reset subtitle display state');
  
  // Clear any ongoing translation
  isTranslationInProgress = false;
  console.log('[CLEAR] Reset translation state');
  
  // Force cancel all active translation requests
  try {
    forceCancelAllTranslationRequests();
    console.log('[CLEAR] Force canceled all translation requests');
  } catch(e) {
    console.log('[CLEAR] Could not force cancel requests:', e.message);
  }
  
  // Clear time range settings for new video
  localStorage.removeItem('translationStartTime');
  localStorage.removeItem('translationEndTime');
  console.log('[CLEAR] Cleared time range settings');
  
  console.log('[CLEAR] Video data cleared successfully');
}

// Clean up old or corrupted subtitle data in localStorage
function cleanupLocalStorage() {
  try {
    console.log('[CLEANUP] Starting localStorage cleanup...');
    
    // Get all keys in localStorage
    const keys = Object.keys(localStorage);
    
    // Find subtitle keys
    const subtitleKeys = keys.filter(key => key.startsWith('youtube_subtitles_'));
    console.log(`[CLEANUP] Found ${subtitleKeys.length} subtitle entries in localStorage`);
    
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
            console.log(`[CLEANUP] Invalid subtitle data for key: ${key}`);
            localStorage.removeItem(key);
            removed++;
            continue;
          }
          
          // Check if it's too old (older than 60 days)
          if (parsed.timestamp) {
            const ageInDays = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
            if (ageInDays > 60) {
              console.log(`[CLEANUP] Removing old subtitle data (${ageInDays.toFixed(1)} days) for key: ${key}`);
              localStorage.removeItem(key);
              removed++;
              continue;
            }
          }
          
          // Everything seems fine, keep this entry
        } catch (parseError) {
          // Invalid JSON, remove it
          console.log(`[CLEANUP] Invalid JSON data for key: ${key}`, parseError);
          localStorage.removeItem(key);
          removed++;
        }
      } catch (keyError) {
        console.error(`[CLEANUP] Error processing key: ${key}`, keyError);
      }
    }
    
    console.log(`[CLEANUP] Completed: Removed ${removed} invalid entries, repaired ${repaired} entries`);
    
    // Check total localStorage usage
    try {
      const totalSize = JSON.stringify(localStorage).length;
      console.log(`[CLEANUP] Current localStorage usage: ${(totalSize / 1024).toFixed(2)} KB`);
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
    console.log(`[STORAGE] Attempting to save subtitles for video ID: ${videoId}`);
    console.log(`[STORAGE] Subtitles count: ${subtitles ? subtitles.length : 0}`);
    
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
    console.log(`[STORAGE] Using storage key: ${storageKey}`);
    
    // Save the subtitles and timestamp
    const subtitleData = {
      subtitles: subtitles,
      timestamp: Date.now(),
      videoId: videoId
    };
    
    // Convert to JSON and save
    const jsonData = JSON.stringify(subtitleData);
    console.log(`[STORAGE] JSON data size: ${jsonData.length} bytes`);
    
    try {
      localStorage.setItem(storageKey, jsonData);
      console.log(`[STORAGE] localStorage.setItem called with key: ${storageKey}`);
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
          console.log(`[STORAGE] Saved trimmed data with ${trimmedSubtitles.length} subtitles`);
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
    
    console.log(`[STORAGE] Verification: data found in localStorage, size: ${savedData.length} bytes`);
    
    try {
      const parsedData = JSON.parse(savedData);
      if (!parsedData.subtitles || !Array.isArray(parsedData.subtitles) || parsedData.subtitles.length === 0) {
        console.error('[STORAGE] Save verification failed: Retrieved data is invalid or empty');
        console.error('[STORAGE] Parsed data structure:', JSON.stringify(Object.keys(parsedData)));
        return false;
      }
      
      console.log(`[STORAGE] Successfully saved ${subtitles.length} subtitles for video ${videoId} to localStorage (verified size: ${jsonData.length} bytes)`);
      console.log(`[STORAGE] First subtitle sample:`, parsedData.subtitles[0]);
      console.log(`[STORAGE] Last subtitle sample:`, parsedData.subtitles[parsedData.subtitles.length - 1]);
    } catch (parseError) {
      console.error('[STORAGE] Save verification failed: Could not parse saved data', parseError);
      return false;
    }
    
    // Also save to recent videos list
    updateRecentVideosList(videoId);
    
    return true;
  } catch (error) {
    console.error('[STORAGE] Critical error saving subtitles to localStorage:', error);
    return false;
  }
}

// Load subtitles from localStorage
function loadSubtitlesFromStorage(videoId) {
  try {
    console.log(`[STORAGE_LOAD] Loading subtitles for video ID: ${videoId}`);
    
    if (!videoId) {
      console.error('[STORAGE_LOAD] Cannot load subtitles: No video ID provided');
      return null;
    }
    
    // Create storage key for this video
    const storageKey = `youtube_subtitles_${videoId}`;
    console.log(`[STORAGE_LOAD] Using storage key: ${storageKey}`);
    
    // Get data from localStorage
    const data = localStorage.getItem(storageKey);
    if (!data) {
      console.log(`[STORAGE_LOAD] No saved subtitles found for video ${videoId}`);
      
      // Try backup key if exists
      const backupKey = `youtube_subtitles_backup_${videoId}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        console.log(`[STORAGE_LOAD] Found backup data with key: ${backupKey}`);
        try {
          const parsedBackup = JSON.parse(backupData);
          if (parsedBackup.subtitles && Array.isArray(parsedBackup.subtitles) && parsedBackup.subtitles.length > 0) {
            console.log(`[STORAGE_LOAD] Loaded ${parsedBackup.subtitles.length} subtitles from backup storage`);
            return parsedBackup.subtitles;
          }
        } catch (backupError) {
          console.error('[STORAGE_LOAD] Error parsing backup data:', backupError);
        }
      }
      
      return null;
    }
    
    console.log(`[STORAGE_LOAD] Found data in localStorage, size: ${data.length} bytes`);
    
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
        console.log('[STORAGE_LOAD] Saved subtitles are too old (> 30 days), will retranslate');
      localStorage.removeItem(storageKey);
      return null;
    }
    
      console.log(`[STORAGE_LOAD] Loaded ${subtitleData.subtitles.length} subtitles for video ${videoId} from localStorage (${ageInDays.toFixed(1)} days old)`);
      console.log(`[STORAGE_LOAD] First subtitle example:`, subtitleData.subtitles[0]);
      console.log(`[STORAGE_LOAD] Last subtitle example:`, subtitleData.subtitles[subtitleData.subtitles.length - 1]);
      
    return subtitleData.subtitles;
    } catch (parseError) {
      console.error('[STORAGE_LOAD] Error parsing subtitle data from localStorage:', parseError);
      
      // If the error is parse-related, try to recover partial data
      try {
        console.log('[STORAGE_LOAD] Attempting to recover data using regex pattern matching...');
        const subtitleMatches = data.match(/"startTime":([^,]+),"endTime":([^,]+),"duration":([^,]+),"text":"([^"]+)"/g);
        
        if (subtitleMatches && subtitleMatches.length > 0) {
          console.log(`[STORAGE_LOAD] Found ${subtitleMatches.length} potential subtitle matches, attempting recovery`);
          
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
            console.log(`[STORAGE_LOAD] Successfully recovered ${recoveredSubtitles.length} subtitles`);
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
      background-color: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      font-size: 24px;
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
      background-color: rgba(0, 0, 0, 0.5);
      color: rgb(255, 255, 255);
      padding: 5px 15px;
      border-radius: 3px;
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
      font-size: 16px;
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
    .original-position-controls {
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
      margin: 0 0 6px 0;
      padding: 6px;
      background-color: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    }
    
    .original-position-label,
    .subtitle-position-label,
    .original-language-label {
      color: white;
      font-size: 11px;
      font-weight: bold;
      direction: rtl;
      text-align: right;
      min-width: 90px;
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
  console.log('Styles added to page');
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
    
    console.log('Vazir font CSS loaded from external file');
  } catch (error) {
    // Fallback: Directly embed Vazir font CSS in the page
    console.log('Using embedded Vazir font CSS fallback');
    
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
    console.log('Embedded Vazir font CSS added to page');
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
  
  console.log('[CONTAINER] Searching for YouTube video container...');
  
  // Try each selector
  for (const selector of selectors) {
    container = document.querySelector(selector);
    if (container) {
      console.log(`[CONTAINER] Found video container using selector: ${selector}`);
      
      // If we found the video element itself, get its parent
      if (selector === 'video' || selector === '.html5-main-video' || selector === '.video-stream') {
        if (container.parentNode) {
          container = container.parentNode;
          console.log('[CONTAINER] Using video parent node as container');
        }
      }
      
      // Make sure the container has relative or absolute positioning
      const computedStyle = window.getComputedStyle(container);
      if (computedStyle.position === 'static') {
        container.style.position = 'relative';
        console.log('[CONTAINER] Set container position to relative');
      }
      
      break;
    }
  }
  
  // If still no container found, use body as fallback
  if (!container) {
    console.warn('[CONTAINER] Could not find any YouTube video container, using body as fallback');
    container = document.body;
  }
  
  console.log('[CONTAINER] Final container:', container.tagName, container.id || container.className);
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
function addTranslateButton() {
  console.log('--- START addTranslateButton ---');
  
  // Get the settings content WITHOUT creating a new settings box
  // This breaks the infinite recursion
  const settingsContent = document.getElementById('subtitle-settings-content');
  if (!settingsContent) {
    console.error('Could not find settings content');
    // Create the settings box if it doesn't exist
    const newSettingsContent = createSettingsBox();
    if (!newSettingsContent) {
      console.error('Failed to create settings content');
    return;
    }
    // Now we have the settings content
  }
  
  // Get the settings content again after possibly creating it
  const contentElement = document.getElementById('subtitle-settings-content');
  if (!contentElement) {
    console.error('Still could not find or create settings content');
    return;
  }

  // Find or create button container
  let buttonContainer = contentElement.querySelector('.subtitle-button-container');
  if (!buttonContainer) {
    buttonContainer = document.createElement('div');
    buttonContainer.className = 'subtitle-button-container';
    contentElement.appendChild(buttonContainer);
  }

  // Clear only the button container, not the entire content
  buttonContainer.innerHTML = '';

  // Always add persistent progress bar first (if not already exists)
  if (!document.querySelector('.persistent-progress-bar-container')) {
    createPersistentProgressBar();
    updatePersistentProgress();
  }
  
  // Add time range controls (hidden for now)
  // addTimeRangeControls();
  
  // Chunk duration controls moved to API settings panel

  // Make sure we have the current video ID
  if (!currentVideoId) {
    currentVideoId = new URLSearchParams(window.location.search).get('v');
    console.log('Updated currentVideoId in addTranslateButton:', currentVideoId);
  }

  // Double-check if the video ID from URL matches our current video ID
  const urlVideoId = new URLSearchParams(window.location.search).get('v');
  if (urlVideoId !== currentVideoId) {
    console.warn(`Video ID mismatch in addTranslateButton. URL: ${urlVideoId}, Current: ${currentVideoId}`);
    currentVideoId = urlVideoId;
  }

  // Check if we have cached subtitles for the CURRENT video ID
  let hasCachedSubtitles = false;
  let cachedSubtitles = null;
  if (currentVideoId) {
    cachedSubtitles = loadSubtitlesFromStorage(currentVideoId);
    hasCachedSubtitles = cachedSubtitles && cachedSubtitles.length > 0;
    console.log(`Checked for cached subtitles: found=${hasCachedSubtitles}, count=${cachedSubtitles ? cachedSubtitles.length : 0}`);
  }

  console.log(`Button state - hasCachedSubtitles: ${hasCachedSubtitles}, isDisplayingSubtitles: ${isDisplayingSubtitles}, isSubtitleVisible: ${isSubtitleVisible}`);

  // Debugging: Double-check localStorage directly
  try {
    const storageKey = `youtube_subtitles_${currentVideoId}`;
    const rawData = localStorage.getItem(storageKey);
    console.log(`Direct localStorage check for ${storageKey}: ${rawData ? 'FOUND' : 'NOT FOUND'}`);
    if (rawData) {
      const parsedData = JSON.parse(rawData);
      console.log(`Parsed data has ${parsedData.subtitles ? parsedData.subtitles.length : 0} subtitles`);
    }
  } catch (e) {
    console.error('Error checking localStorage directly:', e);
  }

  // Create buttons based on state
  if (hasCachedSubtitles) {
    console.log('DISPLAY LOGIC: We have cached subtitles, deciding which button to show...');
    // If subtitles are cached and currently displaying/visible
    if (isDisplayingSubtitles && isSubtitleVisible) {
      console.log('BUTTON CHOICE: Show "hide subtitle" button');
      // Subtitles are currently visible - show hide button
      const hideButton = document.createElement('button');
      hideButton.textContent = 'مخفی کردن زیرنویس';
      hideButton.className = 'subtitle-visibility-button bright-green';
      hideButton.addEventListener('click', toggleSubtitleVisibility);
      buttonContainer.appendChild(hideButton);
      
      // Add sync controls when subtitles are active and visible
      addSyncControls();
    } else {
      console.log('BUTTON CHOICE: Show "show saved subtitle" button');
      // Subtitles are cached but not displaying or not visible - always show the display button
      const showButton = document.createElement('button');
      showButton.textContent = 'نمایش زیرنویس فارسی (ذخیره شده)';
      showButton.className = 'subtitle-translate-button green';
      showButton.addEventListener('click', () => {
        // Load saved subtitles and display them
        const cachedSubs = loadSubtitlesFromStorage(currentVideoId);
        if (cachedSubs && cachedSubs.length > 0) {
          translatedSubtitles = cachedSubs;
          isSubtitleVisible = true;
          toggleSubtitleDisplay(true);
        }
      });
      buttonContainer.appendChild(showButton);
    }
    
    // Add refresh button only if translation is incomplete
    console.log('BUTTON CHOICE: Checking if refresh button should be added');
    const videoDuration = getVideoDuration();
    let shouldShowRefreshButton = false;
    
    if (videoDuration) {
      const coverage = calculateSubtitleTimeCoverage(cachedSubtitles);
      const isComplete = coverage.endTime >= videoDuration - 30; // 30 seconds tolerance
      shouldShowRefreshButton = !isComplete;
      console.log(`Translation coverage: ${coverage.endTime}s / ${videoDuration}s, complete: ${isComplete}`);
  } else {
      // If we can't determine video duration, assume incomplete and show refresh button
      shouldShowRefreshButton = true;
      console.log('Cannot determine video duration, assuming translation is incomplete');
    }
    
    if (shouldShowRefreshButton) {
      console.log('BUTTON CHOICE: Adding refresh button - translation is incomplete');
      const refreshButton = document.createElement('button');
      refreshButton.textContent = 'دریافت ادامه زیرنویس';
      refreshButton.className = 'subtitle-refresh-button';
      refreshButton.id = 'subtitle-refresh-button';
      refreshButton.addEventListener('click', refreshSubtitles);
      
      // Check if translation is in progress and disable button accordingly
      if (isTranslationInProgress) {
        refreshButton.disabled = true;
        refreshButton.textContent = 'در حال دریافت ادامه...';
        refreshButton.style.opacity = '0.6';
        refreshButton.style.cursor = 'not-allowed';
      }
      
      buttonContainer.appendChild(refreshButton);
    } else {
      console.log('BUTTON CHOICE: Not adding refresh button - translation is complete');
    }
    
    // Add clear subtitles button (red button at the bottom)
    const clearButton = document.createElement('button');
    clearButton.textContent = 'نمایش زیرنویس ذخیره شده';
    clearButton.className = 'subtitle-show-saved-button';
    clearButton.style.backgroundColor = '#2196F3';
    clearButton.style.color = 'white';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '4px';
    clearButton.style.fontSize = '12px';
    clearButton.style.cursor = 'pointer';
    clearButton.style.direction = 'rtl';
    clearButton.style.transition = 'background-color 0.2s';
    clearButton.style.padding = '6px 10px';
    clearButton.style.width = '100%';
    clearButton.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
    clearButton.style.marginTop = '0px';
    clearButton.style.marginBottom = '6px';
    clearButton.addEventListener('click', showSavedSubtitlesViewer);
    clearButton.addEventListener('mouseenter', () => {
      clearButton.style.backgroundColor = '#1976D2';
    });
    clearButton.addEventListener('mouseleave', () => {
      clearButton.style.backgroundColor = '#2196F3';
    });
    buttonContainer.appendChild(clearButton);
  } else {
    console.log('BUTTON CHOICE: No cached subtitles, showing translate button');
    
    // Check if there's incomplete translation progress (but only if there are some saved subtitles)
    const hasIncomplete = hasIncompleteTranslation();
    const hasSavedSubtitles = currentVideoId && loadSubtitlesFromStorage(currentVideoId) && loadSubtitlesFromStorage(currentVideoId).length > 0;
    
    // No cached subtitles - show translate button
    const translateButton = document.createElement('button');
    if (hasIncomplete && hasSavedSubtitles) {
      // Only show "continue translation" if there are actually saved subtitles that are incomplete
      translateButton.textContent = 'ادامه ترجمه زیرنویس';
      translateButton.className = 'subtitle-translate-button orange';
      translateButton.title = 'ادامه ترجمه از جایی که متوقف شده';
    } else {
      // Show regular translation button for videos with no subtitles or incomplete progress only
    translateButton.textContent = 'دریافت و ترجمه زیرنویس';
    translateButton.className = 'subtitle-translate-button orange';
    }
    translateButton.addEventListener('click', translateSubtitlesWithOpenRouter);
    buttonContainer.appendChild(translateButton);
    
    // Add clear progress button if there's incomplete translation AND saved subtitles
    if (hasIncomplete && hasSavedSubtitles) {
      const clearProgressButton = document.createElement('button');
      clearProgressButton.textContent = 'شروع مجدد ترجمه';
      clearProgressButton.className = 'subtitle-refresh-button';
      clearProgressButton.style.backgroundColor = '#f44336';
      clearProgressButton.style.marginTop = '0px';
      clearProgressButton.style.marginBottom = '6px';
      clearProgressButton.style.padding = '6px 10px';
      clearProgressButton.style.fontSize = '12px';
      clearProgressButton.title = 'پاک کردن پیشرفت و شروع از ابتدا';
      clearProgressButton.addEventListener('click', () => {
        if (confirm('آیا می‌خواهید پیشرفت ترجمه را پاک کرده و از ابتدا شروع کنید؟')) {
          clearTranslationProgress();
          addTranslateButton(); // Refresh the UI
          showNotification('پیشرفت ترجمه پاک شد - می‌توانید از ابتدا شروع کنید');
        }
      });
      buttonContainer.appendChild(clearProgressButton);
    }
  }
  
  // Add subtitle position controls at the end (always visible)
  const positionControls = createSubtitlePositionControls();
  buttonContainer.appendChild(positionControls);
  
  // Add original language controls (always visible)
  const originalLanguageControls = createOriginalLanguageControls();
  buttonContainer.appendChild(originalLanguageControls);
  
  // Add original language position controls (always visible)
  const originalPositionControls = createOriginalPositionControls();
  buttonContainer.appendChild(originalPositionControls);
  
  // Add previous/next subtitles controls (always visible)
  const previousNextControls = createPreviousNextSubtitlesControls();
  buttonContainer.appendChild(previousNextControls);
  
  console.log('--- END addTranslateButton ---');
}

// Toggle subtitle visibility
function toggleSubtitleVisibility() {
  try {
    // Toggle visibility state
    isSubtitleVisible = !isSubtitleVisible;
    console.log(`Toggling subtitle visibility to: ${isSubtitleVisible ? 'visible' : 'hidden'}`);
    
    // Update subtitle overlay visibility
    let overlay = document.querySelector('.subtitle-overlay');
    
    if (!overlay && isSubtitleVisible) {
      // If we need to show subtitles but there's no overlay, create one
      console.log('No overlay found, creating a new one');
      createSubtitleOverlay();
      overlay = document.querySelector('.subtitle-overlay');
      
      // If we still don't have an overlay, there's a problem
      if (!overlay) {
        console.error('Failed to create subtitle overlay');
        showNotification('خطا: نمی‌توان روکش زیرنویس را ایجاد کرد');
        return;
      }
      
      // Make sure subtitle updates are running
      if (isDisplayingSubtitles && !subtitleUpdateInterval) {
        startSubtitleUpdates();
      }
    }
    
    if (overlay) {
      overlay.style.display = isSubtitleVisible ? 'block' : 'none';
      showNotification(isSubtitleVisible ? 'زیرنویس‌ها نمایش داده می‌شوند' : 'زیرنویس‌ها مخفی شدند');
    }
    
    // Update buttons to reflect new state
    addTranslateButton();
    
  } catch (error) {
    console.error('Error toggling subtitle visibility:', error);
    showNotification('خطا در تغییر حالت نمایش زیرنویس: ' + error.message);
  }
}

// Toggle subtitle display on/off
function toggleSubtitleDisplay(show) {
  console.log(`[SUBTITLE DISPLAY] Toggling subtitle display: ${show}`);
  isDisplayingSubtitles = show;
  
  if (show) {
    // Create a fresh subtitle overlay
    removeExistingOverlay();
    createSubtitleOverlay();
    
    // Recreate original subtitle overlay if it was enabled
    if (showOriginalLanguage) {
      console.log('[SUBTITLE DISPLAY] Recreating original subtitle overlay');
      const overlay = createOriginalSubtitleOverlay();
      if (overlay) {
        overlay.style.display = 'block';
        updateOriginalSubtitleContent();
      }
    }
    
    // Start updating subtitles based on video time
    startSubtitleUpdates();
    
    // Make sure settings box exists and is visible
    if (!document.getElementById('subtitle-settings-content')) {
      createSettingsBox();
    }
    
    // Reset subtitle visibility
    isSubtitleVisible = true;
    
    // Update buttons to reflect new state after a modest delay
    // to ensure all state variables are set correctly
    setTimeout(() => {
      // Double check if we have cached subtitles before updating buttons
      let hasCachedSubtitles = false;
      if (currentVideoId) {
        const cachedSubtitles = loadSubtitlesFromStorage(currentVideoId);
        if (cachedSubtitles && cachedSubtitles.length > 0) {
          hasCachedSubtitles = true;
        }
      }
      
      console.log(`[SUBTITLE DISPLAY] About to update buttons - State: isDisplayingSubtitles=${isDisplayingSubtitles}, isSubtitleVisible=${isSubtitleVisible}, hasCachedSubtitles=${hasCachedSubtitles}`);
      
      // Force the page to recognize we have cached subtitles
      if (!hasCachedSubtitles && translatedSubtitles && translatedSubtitles.length > 0) {
        console.log(`[SUBTITLE DISPLAY] No cached subtitles found, but we have translatedSubtitles. Force saving...`);
        saveSubtitlesToStorage(currentVideoId, translatedSubtitles);
      }
      
      // Only update the translate button content, don't rebuild the entire UI
      const settingsContent = document.getElementById('subtitle-settings-content');
      if (settingsContent) {
        // Just refresh the button content
        const buttonContainer = settingsContent.querySelector('.subtitle-button-container');
        if (buttonContainer) {
          // Remove existing buttons and recreate them
          buttonContainer.innerHTML = '';
          addTranslateButton();
        }
      }
      console.log('[SUBTITLE DISPLAY] Updated buttons after toggling subtitle display to', show);
    }, 600);
  } else {
    // Stop subtitle updates
    stopSubtitleUpdates();
    
    // Remove the overlay completely
    removeExistingOverlay();
    
    // Reset isSubtitleVisible as well
    isSubtitleVisible = false;
    
    // Reset content
    setTimeout(() => {
      // Only update the translate button content, don't rebuild the entire UI
      const settingsContent = document.getElementById('subtitle-settings-content');
      if (settingsContent) {
        // Just refresh the button content
        const buttonContainer = settingsContent.querySelector('.subtitle-button-container');
        if (buttonContainer) {
          // Remove existing buttons and recreate them
          buttonContainer.innerHTML = '';
    addTranslateButton();
        }
      }
      console.log('[SUBTITLE DISPLAY] Updated buttons after toggling subtitle display to', show);
    }, 200);
  }
}


// Function to extract and translate YouTube subtitles with Gemini
async function translateSubtitlesWithOpenRouter() {
  console.log('[TRANSLATE] Starting subtitle translation...');
  
  // Set translation in progress flag
  isTranslationInProgress = true;
  
  try {
    // Ensure we have the current video ID
    if (!currentVideoId) {
      currentVideoId = new URLSearchParams(window.location.search).get('v');
      if (!currentVideoId) {
        console.error('[TRANSLATE] Could not find video ID in URL');
        throw new Error('Could not find video ID');
      }
      console.log('[TRANSLATE] Set current video ID to:', currentVideoId);
    }
    
    // Check if we have cached subtitles first (only for complete translations)
    if (currentVideoId) {
      const cachedSubtitles = loadSubtitlesFromStorage(currentVideoId);
      if (cachedSubtitles && cachedSubtitles.length > 0) {
        // Check if this is a refresh operation (time range is set)
        const isRefreshOperation = localStorage.getItem('translationStartTime') && localStorage.getItem('translationStartTime') !== '0';
        
        if (!isRefreshOperation) {
          // Check if translation is complete
          const videoDuration = getVideoDuration();
          if (videoDuration) {
            const coverage = calculateSubtitleTimeCoverage(cachedSubtitles);
            const isComplete = coverage.endTime >= videoDuration - 30; // 30 seconds tolerance
            
            if (isComplete) {
              console.log('[TRANSLATE] Found complete cached translated subtitles for video ID:', currentVideoId);
        translatedSubtitles = cachedSubtitles;
              showNotification('استفاده از زیرنویس‌های ذخیره شده');
        toggleSubtitleDisplay(true);
        return;
            } else {
              console.log('[TRANSLATE] Found partial cached subtitles, will continue translation');
            }
          } else {
            // If we can't determine video duration, assume complete
            console.log('[TRANSLATE] Found cached translated subtitles (duration unknown) for video ID:', currentVideoId);
            translatedSubtitles = cachedSubtitles;
            showNotification('استفاده از زیرنویس‌های ذخیره شده');
            toggleSubtitleDisplay(true);
            return;
          }
        } else {
          console.log('[TRANSLATE] Refresh operation detected, will continue translation from specified time range');
        }
      }
    }
    
    // Update button to indicate loading only if no saved subtitles exist
    const translateButton = document.querySelector('.subtitle-translate-button');
    const existingSavedSubtitles = loadSubtitlesFromStorage(currentVideoId);
    
    if (translateButton && (!existingSavedSubtitles || existingSavedSubtitles.length === 0)) {
      // Only disable button if no saved subtitles exist
      translateButton.textContent = 'در حال ترجمه زیرنویس...';
      translateButton.disabled = true;
      translateButton.classList.add('loading');
      translateButton.style.opacity = '0.6';
      translateButton.style.cursor = 'not-allowed';
    }
    
    showNotification('در حال دریافت و ترجمه زیرنویس...');
    
    // Double-check that we're still on the same video
    const urlVideoId = new URLSearchParams(window.location.search).get('v');
    if (urlVideoId !== currentVideoId) {
      console.warn(`[TRANSLATE] Video ID mismatch detected. URL has ${urlVideoId} but currentVideoId is ${currentVideoId}`);
      currentVideoId = urlVideoId; // Update to the correct ID
    }
    
    // Extract subtitles
    console.log('[TRANSLATE] Extracting subtitles for video ID:', currentVideoId);
    const extractStartTime = performance.now();
    const subtitles = await extractYouTubeSubtitles(currentVideoId);
    const extractEndTime = performance.now();
    console.log(`[TRANSLATE] Subtitle extraction took ${(extractEndTime - extractStartTime).toFixed(2)} ms`);
    
    if (!subtitles || subtitles.length === 0) {
      throw new Error('Could not extract subtitles from video');
    }
    
    console.log(`[TRANSLATE] Successfully extracted ${subtitles.length} subtitles`);
    
    // Store the total number of original subtitles for progress calculation
    const originalSubtitlesKey = `original_subtitles_count_${currentVideoId}`;
    localStorage.setItem(originalSubtitlesKey, subtitles.length.toString());
    console.log(`[TRANSLATE] Stored total subtitle count: ${subtitles.length}`);
    
    // Filter subtitles by time range if specified
    const filteredSubtitles = filterSubtitlesByTimeRange(subtitles);
    
    if (filteredSubtitles.length === 0) {
      throw new Error('No subtitles found in the specified time range');
    }
    
    if (filteredSubtitles.length !== subtitles.length) {
      console.log(`[TRANSLATE] Filtered to ${filteredSubtitles.length} subtitles based on time range`);
      
      // Show notification about time range filtering
      const startTime = localStorage.getItem('translationStartTime') || '';
      const endTime = localStorage.getItem('translationEndTime') || '';
      
      // Convert to readable format
      const startDisplay = startTime ? `${startTime}s` : '0s';
      const endDisplay = endTime ? `${endTime}s` : 'پایان';
      showNotification(`ترجمه بازه ${startDisplay} تا ${endDisplay} (${filteredSubtitles.length} زیرنویس)`);
    }
    
    // Convert filtered subtitles to SRT format instead of XML
    console.log('[TRANSLATE] Converting filtered subtitles to SRT format');
    const srt = convertSubtitlesToSrt(filteredSubtitles);
    originalSubtitleXml = srt; // Keep the same variable name for compatibility
    
    // Store original subtitles for display
    originalSubtitles = filteredSubtitles;
    console.log(`[TRANSLATE] Stored ${originalSubtitles.length} original subtitles for display`);
    
    // Log the original SRT for debugging
    console.log('[TRANSLATE] Original SRT with timing data:');
    console.log(srt);
    
    // Also log a sample of subtitles with their timing
    console.log('[TRANSLATE] Sample of filtered subtitles with timing:');
    const sampleSize = Math.min(5, filteredSubtitles.length);
    for (let i = 0; i < sampleSize; i++) {
      console.log(`Subtitle ${i+1}: Start=${filteredSubtitles[i].startTime}, End=${filteredSubtitles[i].endTime}, Text="${filteredSubtitles[i].text}"`);
    }
    
    // Use chunked translation for better reliability and progress tracking
    console.log('[TRANSLATE] Starting chunked translation process');
    
    // Show which API is being used
    const apiInfo = getTranslationApiInfo();
    
    // Validate API key before starting
    if (apiInfo.api === 'openrouter') {
      const openrouterKey = localStorage.getItem('openrouter_api_key');
      if (!openrouterKey) {
        showNotification('⚠️ کلید OpenRouter API تنظیم نشده - لطفاً از تنظیمات کلید API را وارد کنید');
        
        // Reset button state when API key is missing
    const translateButton = document.querySelector('.subtitle-translate-button');
    if (translateButton) {
      translateButton.textContent = 'دریافت و ترجمه زیرنویس';
      translateButton.disabled = false;
          translateButton.classList.remove('loading');
          translateButton.style.opacity = '1';
          translateButton.style.cursor = 'pointer';
        }
        
        // Reset translation in progress flag
        isTranslationInProgress = false;
        
        return;
      }
    } else if (apiInfo.api === 'gemini') {
      const geminiKey = localStorage.getItem('geminiApiKey');
      if (!geminiKey) {
        showNotification('⚠️ کلید Gemini API تنظیم نشده - لطفاً از تنظیمات کلید API را وارد کنید');
        
        // Reset button state when API key is missing
        const translateButton = document.querySelector('.subtitle-translate-button');
        if (translateButton) {
          translateButton.textContent = 'دریافت و ترجمه زیرنویس';
          translateButton.disabled = false;
          translateButton.classList.remove('loading');
          translateButton.style.opacity = '1';
          translateButton.style.cursor = 'pointer';
        }
        
        // Reset translation in progress flag
        isTranslationInProgress = false;
        
        return;
      }
    }
    
    showNotification(`🚀 در حال ترجمه زیرنویس با ${apiInfo.displayName} (${apiInfo.model})...`);
    
    let parsedSubtitles = [];
    let translationSuccess = false;
    
    try {
      // Use chunked translation
      parsedSubtitles = await translateSubtitlesInChunks(filteredSubtitles);
      
      console.log(`[TRANSLATE] Chunked translation completed: ${parsedSubtitles.length} subtitles`);
      
      // Check if we got enough subtitles
      if (parsedSubtitles.length >= filteredSubtitles.length * 0.6) {
        translationSuccess = true;
        console.log('[TRANSLATE] Chunked translation successful - parsed enough subtitles');
      } else if (parsedSubtitles.length > 0) {
        translationSuccess = true;
        console.warn('[TRANSLATE] Partial chunked translation success - some subtitles missing');
      } else {
        throw new Error('Failed to translate subtitles in chunks');
      }
    } catch (translationError) {
      console.error('[TRANSLATE] Chunked translation error:', translationError);
      
      // No need to hide progress bar since we're using persistent progress bar
      // hideProgressBar();
      
      // Reset button state and show error
    const translateButton = document.querySelector('.subtitle-translate-button');
      const existingSavedSubtitles = loadSubtitlesFromStorage(currentVideoId);
      
      if (translateButton && (!existingSavedSubtitles || existingSavedSubtitles.length === 0)) {
        // Only reset button if it was disabled (no saved subtitles)
      translateButton.textContent = 'دریافت و ترجمه زیرنویس';
      translateButton.disabled = false;
        translateButton.classList.remove('loading');
        translateButton.style.opacity = '1';
        translateButton.style.cursor = 'pointer';
      }
      
      // Throw the error to be caught by the main catch block
      throw new Error('ترجمه زیرنویس ناموفق بود: ' + translationError.message);
    }
    
    // Assign to global variable
    translatedSubtitles = parsedSubtitles;
    
    // Save to storage with the current video ID
    console.log(`[TRANSLATE] Saving ${parsedSubtitles.length} subtitles for video ID: ${currentVideoId}`);
    
    let saveSuccess = false;
    try {
      // Check if we have existing subtitles to merge with
      const existingSubtitles = loadSubtitlesFromStorage(currentVideoId);
      let finalSubtitles = parsedSubtitles;
      
      if (existingSubtitles && existingSubtitles.length > 0) {
        console.log(`[TRANSLATE] Found ${existingSubtitles.length} existing subtitles, merging with ${parsedSubtitles.length} new ones`);
        
        // Get time range settings to determine if we're refreshing a specific range
        const startTime = localStorage.getItem('translationStartTime') || '';
        const endTime = localStorage.getItem('translationEndTime') || '';
        
        let startSeconds = 0;
        let endSeconds = Infinity;
        
        if (startTime) {
          if (startTime.includes(':')) {
            startSeconds = parseTimeToSeconds(startTime);
          } else {
            startSeconds = parseInt(startTime) || 0;
          }
        }
        
        if (endTime) {
          if (endTime.includes(':')) {
            endSeconds = parseTimeToSeconds(endTime);
          } else {
            endSeconds = parseInt(endTime) || Infinity;
          }
        }
        
        // If we have a specific time range, remove existing subtitles in that range first
        let filteredExistingSubtitles = existingSubtitles;
        let removedCount = 0;
        
        if (startTime || endTime) {
          console.log(`[TRANSLATE] Time range specified (${startSeconds}s to ${endSeconds}s), replacing existing subtitles in this range`);
          
          filteredExistingSubtitles = existingSubtitles.filter(sub => {
            // Keep subtitles that don't overlap with the specified time range
            const shouldKeep = sub.endTime <= startSeconds || sub.startTime >= endSeconds;
            if (!shouldKeep) removedCount++;
            return shouldKeep;
          });
          
          console.log(`[TRANSLATE] Removed ${removedCount} existing subtitles from time range ${startSeconds}s-${endSeconds}s`);
        }
        
        // Create a map of filtered existing subtitles by time range for quick lookup
        const existingMap = new Map();
        filteredExistingSubtitles.forEach(sub => {
          const timeKey = `${sub.startTime.toFixed(2)}-${sub.endTime.toFixed(2)}`;
          existingMap.set(timeKey, sub);
        });
        
        // Merge: keep filtered existing subtitles and add new ones
        const mergedSubtitles = [...filteredExistingSubtitles];
        let addedCount = 0;
        
        parsedSubtitles.forEach(newSub => {
          const timeKey = `${newSub.startTime.toFixed(2)}-${newSub.endTime.toFixed(2)}`;
          if (!existingMap.has(timeKey)) {
            mergedSubtitles.push(newSub);
            addedCount++;
          }
        });
        
        // Sort by start time to maintain order
        mergedSubtitles.sort((a, b) => a.startTime - b.startTime);
        
        finalSubtitles = mergedSubtitles;
        console.log(`[TRANSLATE] Final result: ${filteredExistingSubtitles.length} existing + ${addedCount} new = ${finalSubtitles.length} total`);
        
        if (removedCount > 0 && addedCount > 0) {
          showNotification(`${removedCount} زیرنویس قدیمی جایگزین شد و ${addedCount} زیرنویس جدید اضافه شد`);
        } else if (addedCount > 0) {
          showNotification(`${addedCount} زیرنویس جدید به ${filteredExistingSubtitles.length} زیرنویس قبلی اضافه شد`);
        } else {
          showNotification('همه زیرنویس‌ها از قبل موجود بودند');
        }
      } else {
        console.log(`[TRANSLATE] No existing subtitles found, saving all ${parsedSubtitles.length} as new`);
      }
      
      // Update the global variable with merged subtitles
      translatedSubtitles = finalSubtitles;
      
      saveSuccess = saveSubtitlesToStorage(currentVideoId, finalSubtitles);
      console.log(`[TRANSLATE] Save result: ${saveSuccess ? 'SUCCESS' : 'FAILED'}`);
    } catch (saveError) {
      console.error('[TRANSLATE] Error during save operation:', saveError);
    }
    
    // Clear time range settings if this was a refresh operation
    const wasRefreshOperation = localStorage.getItem('translationStartTime') && localStorage.getItem('translationStartTime') !== '0';
    if (wasRefreshOperation) {
      localStorage.removeItem('translationStartTime');
      localStorage.removeItem('translationEndTime');
      console.log('[TRANSLATE] Cleared time range settings after refresh operation');
      
      // Reset refresh button after successful completion
      resetRefreshButton();
    }
    
    // Show success notification and display subtitles
    if (wasRefreshOperation) {
      showNotification('ترجمه ویدیو تکمیل شد - تمام بخش‌ها ترجمه شده‌اند');
    } else {
      showNotification('ترجمه زیرنویس با موفقیت انجام شد');
    }
    
    // Immediately update UI to show subtitle display button
    setTimeout(() => {
      addTranslateButton(); // This will show the "Show Persian Subtitles" button
      showNotification('زیرنویس‌ها ترجمه شدند و به صورت خودکار فعال شدند!');
    }, 100); // Reduced delay for immediate response
    
    // Reset translation in progress flag
    isTranslationInProgress = false;
    
    // Also automatically display subtitles
    toggleSubtitleDisplay(true);
  } catch (error) {
    console.error('[TRANSLATE] Error during subtitle translation:', error);
    
    // Reset translation in progress flag
    isTranslationInProgress = false;
    
    // No need to hide progress bar since we're using persistent progress bar
    // hideProgressBar();
    
    // Reset refresh button if this was a refresh operation
    const wasRefreshOperation = localStorage.getItem('translationStartTime') && localStorage.getItem('translationStartTime') !== '0';
    if (wasRefreshOperation) {
      resetRefreshButton();
      // Clear the time range settings on error too
      localStorage.removeItem('translationStartTime');
      localStorage.removeItem('translationEndTime');
    }
    
    // Reset button state on error
    const translateButton = document.querySelector('.subtitle-translate-button');
    if (translateButton) {
      translateButton.textContent = 'دریافت و ترجمه زیرنویس';
      translateButton.disabled = false;
      translateButton.classList.remove('loading');
      translateButton.classList.remove('orange');
      translateButton.classList.add('orange'); // Restore original orange color
      translateButton.style.opacity = '1';
      translateButton.style.cursor = 'pointer';
    }
    
    // Show error notification to user
    showNotification('خطا در ترجمه زیرنویس: ' + error.message);
    
    // Also try to rebuild the UI to ensure proper state
    setTimeout(() => {
      addTranslateButton();
    }, 500);
  }
}

// Create and show progress bar
function createProgressBar() {
  // Get settings content container
  const settingsContent = document.getElementById('subtitle-settings-content');
  if (!settingsContent) return null;
  
  // Remove any existing progress bar
  const existingProgress = settingsContent.querySelector('.translation-progress');
  if (existingProgress) {
    existingProgress.remove();
  }
  
  // Create progress container
  const progressContainer = document.createElement('div');
  progressContainer.className = 'translation-progress';
  progressContainer.id = 'translation-progress';
  
  // Create progress title
  const progressTitle = document.createElement('div');
  progressTitle.textContent = 'در حال ترجمه زیرنویس...';
  progressTitle.style.fontWeight = 'bold';
  progressTitle.style.marginBottom = '8px';
  progressTitle.style.textAlign = 'center';
  
  // Create progress bar container
  const progressBarContainer = document.createElement('div');
  progressBarContainer.className = 'progress-bar-container';
  
  // Create progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.id = 'translation-progress-bar';
  
  // Create progress text
  const progressText = document.createElement('div');
  progressText.className = 'progress-text';
  progressText.id = 'translation-progress-text';
  progressText.textContent = '0%';
  
  // Create progress status
  const progressStatus = document.createElement('div');
  progressStatus.className = 'progress-status';
  progressStatus.id = 'translation-progress-status';
  progressStatus.textContent = 'آماده‌سازی...';
  
  // Assemble progress bar
  progressBarContainer.appendChild(progressBar);
  progressBarContainer.appendChild(progressText);
  
  progressContainer.appendChild(progressTitle);
  progressContainer.appendChild(progressBarContainer);
  progressContainer.appendChild(progressStatus);
  
  // Insert at the beginning of settings content
  settingsContent.insertBefore(progressContainer, settingsContent.firstChild);
  
  return {
    container: progressContainer,
    bar: progressBar,
    text: progressText,
    status: progressStatus
  };
}

// Update progress bar
function updateProgressBar(percentage, status) {
  const progressBar = document.getElementById('translation-progress-bar');
  const progressText = document.getElementById('translation-progress-text');
  const progressStatus = document.getElementById('translation-progress-status');
  
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
  
  if (progressText) {
    progressText.textContent = `${Math.round(percentage)}%`;
  }
  
  if (progressStatus && status) {
    progressStatus.textContent = status;
  }
}

// Show progress bar
function showProgressBar() {
  const progressContainer = document.getElementById('translation-progress');
  if (progressContainer) {
    progressContainer.classList.add('visible');
  }
}

// Hide progress bar
function hideProgressBar() {
  const progressContainer = document.getElementById('translation-progress');
  if (progressContainer) {
    progressContainer.classList.remove('visible');
    setTimeout(() => {
      if (progressContainer.parentNode) {
        progressContainer.remove();
      }
    }, 300);
  }
}

// Create persistent progress bar
function createPersistentProgressBar() {
  // Get settings content container
  const settingsContent = document.getElementById('subtitle-settings-content');
  if (!settingsContent) return null;
  
  // Remove any existing persistent progress bar
  const existingProgress = settingsContent.querySelector('.persistent-progress');
  if (existingProgress) {
    existingProgress.remove();
  }
  
  // Create persistent progress container
  const progressContainer = document.createElement('div');
  progressContainer.className = 'persistent-progress';
  progressContainer.id = 'persistent-progress';
  
  // Create progress title
  const progressTitle = document.createElement('div');
  progressTitle.className = 'persistent-progress-title';
  progressTitle.id = 'persistent-progress-title';
  progressTitle.textContent = 'پیشرفت ترجمه ویدیو';
  
  // Create progress bar container
  const progressBarContainer = document.createElement('div');
  progressBarContainer.className = 'persistent-progress-bar-container';
  
  // Create progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'persistent-progress-bar';
  progressBar.id = 'persistent-progress-bar';
  
  // Create progress text
  const progressText = document.createElement('div');
  progressText.className = 'persistent-progress-text';
  progressText.id = 'persistent-progress-text';
  progressText.textContent = '0%';
  
  // Create progress status
  const progressStatus = document.createElement('div');
  progressStatus.className = 'persistent-progress-status';
  progressStatus.id = 'persistent-progress-status';
  progressStatus.textContent = 'ترجمه نشده';
  
  // Assemble progress bar
  progressBarContainer.appendChild(progressBar);
  progressBarContainer.appendChild(progressText);
  
  progressContainer.appendChild(progressTitle);
  progressContainer.appendChild(progressBarContainer);
  progressContainer.appendChild(progressStatus);
  
  // Insert at the very beginning of settings content
  settingsContent.insertBefore(progressContainer, settingsContent.firstChild);
  
  return {
    container: progressContainer,
    bar: progressBar,
    text: progressText,
    status: progressStatus,
    title: progressTitle
  };
}

// Update persistent progress bar
function updatePersistentProgressBar(percentage, status, title) {
  const progressBar = document.getElementById('persistent-progress-bar');
  const progressText = document.getElementById('persistent-progress-text');
  const progressStatus = document.getElementById('persistent-progress-status');
  const progressTitle = document.getElementById('persistent-progress-title');
  
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
  
  if (progressText) {
    progressText.textContent = `${Math.round(percentage)}%`;
  }
  
  if (progressStatus && status) {
    progressStatus.textContent = status;
  }
  
  if (progressTitle && title) {
    progressTitle.textContent = title;
  }
}

// Get video duration in seconds
function getVideoDuration() {
  try {
    const video = document.querySelector('video');
    if (video && video.duration && !isNaN(video.duration)) {
      return video.duration;
    }
  } catch (e) {
    console.warn('[DURATION] Error getting video duration:', e);
  }
  return null;
}

// Calculate time coverage of subtitles
function calculateSubtitleTimeCoverage(subtitles) {
  if (!subtitles || subtitles.length === 0) {
    return { startTime: 0, endTime: 0, duration: 0 };
  }
  
  // Sort subtitles by start time
  const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime);
  
  const startTime = sortedSubtitles[0].startTime;
  const endTime = sortedSubtitles[sortedSubtitles.length - 1].endTime;
  const duration = endTime - startTime;
  
  return { startTime, endTime, duration };
}

// Calculate video translation progress
function calculateVideoTranslationProgress() {
  if (!currentVideoId) {
    return { percentage: 0, status: 'ویدیو شناسایی نشده', hasTranslation: false };
  }
  
  const videoDuration = getVideoDuration();
  
  // Check for completed translation
  const savedSubtitles = loadSubtitlesFromStorage(currentVideoId);
  if (savedSubtitles && savedSubtitles.length > 0) {
    // Try to get total subtitle count from localStorage or estimate
    let totalSubtitles = savedSubtitles.length; // Default fallback
    
    // Try to get original subtitle count from storage or recent extraction
    const originalSubtitlesKey = `original_subtitles_count_${currentVideoId}`;
    const storedTotal = localStorage.getItem(originalSubtitlesKey);
    if (storedTotal) {
      totalSubtitles = parseInt(storedTotal);
    } else if (videoDuration) {
      // Estimate total subtitles based on video duration (assuming ~3 seconds per subtitle)
      totalSubtitles = Math.ceil(videoDuration / 3);
    }
    
    if (!videoDuration) {
      // If we can't get video duration, show subtitle count with total
      return { 
        percentage: 100, 
        status: `${savedSubtitles.length} زیرنویس از ${totalSubtitles} ذخیره شده (مدت ویدیو نامشخص)`, 
        hasTranslation: true 
      };
    }
    
    const coverage = calculateSubtitleTimeCoverage(savedSubtitles);
    const percentage = Math.min(100, (coverage.duration / videoDuration) * 100);
    
    const startMinutes = Math.floor(coverage.startTime / 60);
    const startSeconds = Math.floor(coverage.startTime % 60);
    const endMinutes = Math.floor(coverage.endTime / 60);
    const endSeconds = Math.floor(coverage.endTime % 60);
    
    const timeRange = `${startMinutes}:${startSeconds.toString().padStart(2, '0')} - ${endMinutes}:${endSeconds.toString().padStart(2, '0')}`;
    
    return { 
      percentage: percentage, 
      status: `${savedSubtitles.length} زیرنویس از ${totalSubtitles} ذخیره شده (${timeRange})`, 
      hasTranslation: true 
    };
  }
  
  // Check for incomplete translation progress
  try {
    const progressKey = `translation_progress_${currentVideoId}`;
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      const progressData = JSON.parse(savedProgress);
      const translatedCount = progressData.translatedSubtitles ? progressData.translatedSubtitles.length : 0;
      
      // Try to get total subtitle count
      let totalSubtitles = translatedCount; // Default fallback
      const originalSubtitlesKey = `original_subtitles_count_${currentVideoId}`;
      const storedTotal = localStorage.getItem(originalSubtitlesKey);
      if (storedTotal) {
        totalSubtitles = parseInt(storedTotal);
      } else if (videoDuration) {
        // Estimate total subtitles based on video duration
        totalSubtitles = Math.ceil(videoDuration / 3);
      }
      
      if (translatedCount > 0 && videoDuration) {
        // Calculate based on actual time coverage of translated subtitles
        const coverage = calculateSubtitleTimeCoverage(progressData.translatedSubtitles);
        const percentage = Math.min(100, (coverage.duration / videoDuration) * 100);
        
        return {
          percentage: percentage,
          status: `${translatedCount} زیرنویس از ${totalSubtitles} ذخیره شده`,
          hasTranslation: translatedCount > 0,
          isIncomplete: true
        };
      } else {
        // Fallback to chunk-based calculation if no time info available
        const percentage = (progressData.completedChunks / progressData.totalChunks) * 100;
        
        return {
          percentage: percentage,
          status: `${translatedCount} زیرنویس از ${totalSubtitles} ذخیره شده`,
          hasTranslation: translatedCount > 0,
          isIncomplete: true
        };
      }
    }
  } catch (e) {
    console.warn('[PROGRESS] Error calculating progress:', e);
  }
  
  return { percentage: 0, status: 'ترجمه نشده', hasTranslation: false };
}

// Update persistent progress display
function updatePersistentProgress() {
  const progress = calculateVideoTranslationProgress();
  
  let title = 'پیشرفت ترجمه ویدیو';
  if (progress.isIncomplete) {
    title = 'ترجمه ناتمام';
  } else if (progress.hasTranslation) {
    title = 'ترجمه کامل';
  }
  
  updatePersistentProgressBar(progress.percentage, progress.status, title);
}

// Update persistent progress bar during active translation
function updatePersistentProgressDuringTranslation(currentTranslatedSubtitles) {
  if (!currentVideoId || !currentTranslatedSubtitles || currentTranslatedSubtitles.length === 0) {
      return;
    }
    
  const videoDuration = getVideoDuration();
  if (!videoDuration) {
    // Fallback to showing subtitle count if video duration unavailable
    updatePersistentProgressBar(50, `${currentTranslatedSubtitles.length} زیرنویس در حال ترجمه...`, 'در حال ترجمه');
      return;
    }
    
  // Calculate coverage of current translated subtitles
  const coverage = calculateSubtitleTimeCoverage(currentTranslatedSubtitles);
  const percentage = Math.min(100, (coverage.duration / videoDuration) * 100);
  
  // Format time range
  const startMinutes = Math.floor(coverage.startTime / 60);
  const startSeconds = Math.floor(coverage.startTime % 60);
  const endMinutes = Math.floor(coverage.endTime / 60);
  const endSeconds = Math.floor(coverage.endTime % 60);
  
  const timeRange = `${startMinutes}:${startSeconds.toString().padStart(2, '0')} - ${endMinutes}:${endSeconds.toString().padStart(2, '0')}`;
  
  const status = `${currentTranslatedSubtitles.length} زیرنویس (${timeRange})`;
  
  updatePersistentProgressBar(percentage, status, 'در حال ترجمه');
}

// Split subtitles into 5-minute chunks
function splitSubtitlesIntoChunks(subtitles, chunkDurationMinutes = 5) {
  if (!subtitles || subtitles.length === 0) {
    return [];
  }
  
  const chunkDurationSeconds = chunkDurationMinutes * 60;
  const chunks = [];
  let currentChunk = [];
  let chunkStartTime = 0;
  
  for (const subtitle of subtitles) {
    // If this subtitle starts beyond the current chunk's end time, start a new chunk
    if (subtitle.startTime >= chunkStartTime + chunkDurationSeconds && currentChunk.length > 0) {
      chunks.push({
        subtitles: [...currentChunk],
        startTime: chunkStartTime,
        endTime: chunkStartTime + chunkDurationSeconds
      });
      
      // Start new chunk
      currentChunk = [];
      chunkStartTime = Math.floor(subtitle.startTime / chunkDurationSeconds) * chunkDurationSeconds;
    }
    
    // If this is the first subtitle, set the chunk start time
    if (currentChunk.length === 0) {
      chunkStartTime = Math.floor(subtitle.startTime / chunkDurationSeconds) * chunkDurationSeconds;
    }
    
    currentChunk.push(subtitle);
  }
  
  // Add the last chunk if it has subtitles
  if (currentChunk.length > 0) {
    chunks.push({
      subtitles: [...currentChunk],
      startTime: chunkStartTime,
      endTime: chunkStartTime + chunkDurationSeconds
    });
  }
  
  console.log(`[CHUNKS] Split ${subtitles.length} subtitles into ${chunks.length} chunks of ${chunkDurationMinutes} minutes each`);
  
  return chunks;
}

// Translate subtitles in chunks
async function translateSubtitlesInChunks(subtitles) {
  console.log('[CHUNKS] Starting chunked translation...');
  
  // Get chunk duration from settings
  const chunkDurationMinutes = getChunkDurationMinutes();
  console.log(`[CHUNKS] Using chunk duration: ${chunkDurationMinutes} minutes`);
  
  // Split subtitles into chunks based on user setting
  const chunks = splitSubtitlesIntoChunks(subtitles, chunkDurationMinutes);
  
  if (chunks.length === 0) {
    throw new Error('No subtitle chunks to translate');
  }
  
  // Check if we have partial progress from previous attempt
  const progressKey = `translation_progress_${currentVideoId}`;
  let startFromChunk = 0;
  let existingTranslatedChunks = [];
  
  try {
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      const progressData = JSON.parse(savedProgress);
      if (progressData.totalChunks === chunks.length && progressData.chunkDuration === chunkDurationMinutes) {
        // Calculate startFromChunk based on the last saved subtitle's time
        const savedSubtitles = loadSubtitlesFromStorage(currentVideoId);
        if (savedSubtitles && savedSubtitles.length > 0) {
          // Use the same logic as progress calculation
          const videoDuration = getVideoDuration();
          if (videoDuration) {
            const coverage = calculateSubtitleTimeCoverage(savedSubtitles);
            const progressPercentage = Math.min(100, (coverage.duration / videoDuration) * 100);
            
            // Calculate startFromChunk based on the progress percentage
            // If 29% is complete, then we should start from chunk that corresponds to 29% of total chunks
            startFromChunk = Math.floor((progressPercentage / 100) * chunks.length);
            
            // Since we have saved subtitles, we need to start from the NEXT chunk
            // The calculated chunk is where the translation ended, so we start from the next one
            startFromChunk = startFromChunk + 1;
            
            console.log(`[CHUNKS] Progress: ${progressPercentage.toFixed(1)}% of video translated`);
            console.log(`[CHUNKS] Coverage: ${coverage.duration.toFixed(1)}s out of ${videoDuration.toFixed(1)}s`);
            console.log(`[CHUNKS] Calculated startFromChunk: ${startFromChunk} (chunk ${startFromChunk + 1})`);
          } else {
            // Fallback: Find the last subtitle's end time
            const lastSubtitle = savedSubtitles[savedSubtitles.length - 1];
            const lastTimeInMinutes = lastSubtitle.end / 60; // Convert seconds to minutes
            
            // Calculate which chunk to start from (next chunk after the last translated time)
            startFromChunk = Math.ceil(lastTimeInMinutes / chunkDurationMinutes);
            
            console.log(`[CHUNKS] Fallback: Last saved subtitle ends at ${lastTimeInMinutes.toFixed(2)} minutes`);
            console.log(`[CHUNKS] Calculated startFromChunk: ${startFromChunk} (chunk ${startFromChunk + 1})`);
          }
          
          // Ensure we don't exceed the total number of chunks
          if (startFromChunk >= chunks.length) {
            startFromChunk = chunks.length;
            console.log(`[CHUNKS] Translation already complete - all chunks translated`);
          }
        } else {
          // No saved subtitles, use the old method as fallback
          startFromChunk = progressData.completedChunks;
        }
        
        existingTranslatedChunks = progressData.translatedSubtitles || [];
        console.log(`[CHUNKS] Resuming from chunk ${startFromChunk + 1}/${chunks.length}`);
        
        // Only show continuation message if we're not already complete
        if (startFromChunk < chunks.length) {
          showNotification(`ادامه ترجمه از بخش ${startFromChunk + 1}`);
        }
      } else {
        // Different chunk configuration, start fresh
        localStorage.removeItem(progressKey);
      }
    }
  } catch (e) {
    console.warn('[CHUNKS] Could not load previous progress:', e);
    localStorage.removeItem(progressKey);
  }
  
  // Check if translation is already complete
  if (startFromChunk >= chunks.length) {
    console.log('[CHUNKS] Translation is already complete');
    showNotification('ترجمه این ویدیو قبلاً تکمیل شده است');
    updatePersistentProgressBar(100, 'ترجمه کامل شده', 'ترجمه کامل');
    return translatedSubtitles; // Return existing translated subtitles
  }
  
  // Use only persistent progress bar - no additional progress bar needed
  // createProgressBar();
  // showProgressBar();
  
  const initialProgress = (startFromChunk / chunks.length) * 100;
  if (startFromChunk > 0) {
    // Get current subtitle count for display
    const savedSubtitles = loadSubtitlesFromStorage(currentVideoId);
    const currentCount = savedSubtitles ? savedSubtitles.length : 0;
    const totalSubtitles = localStorage.getItem(`original_subtitles_count_${currentVideoId}`) || currentCount;
    updatePersistentProgressBar(initialProgress, `${currentCount} زیرنویس از ${totalSubtitles} ذخیره شده`, 'در حال ترجمه');
  } else {
    // Starting fresh translation
    const totalSubtitles = localStorage.getItem(`original_subtitles_count_${currentVideoId}`) || subtitles.length;
    updatePersistentProgressBar(0, `0 زیرنویس از ${totalSubtitles} ذخیره شده`, 'در حال ترجمه');
  }
  
  const translatedChunks = [...existingTranslatedChunks];
  let firstChunkCompleted = startFromChunk > 0 || existingTranslatedChunks.length > 0;
  
  try {
    for (let i = startFromChunk; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkNumber = i + 1;
      
      console.log(`[CHUNKS] Translating chunk ${chunkNumber}/${chunks.length} (${chunk.subtitles.length} subtitles)`);
      
      // Update progress with current subtitle count
      const currentSavedSubtitles = loadSubtitlesFromStorage(currentVideoId) || [];
      const totalSubtitles = localStorage.getItem(`original_subtitles_count_${currentVideoId}`) || subtitles.length;
      const progressPercentage = (i / chunks.length) * 100;
      updatePersistentProgressBar(progressPercentage, `${currentSavedSubtitles.length} زیرنویس از ${totalSubtitles} ذخیره شده`, `در حال ترجمه`);
      
      try {
        // Convert chunk to appropriate format based on API
        const apiInfo = getTranslationApiInfo();
        let chunkData;
        let translatedData;
        
        if (apiInfo.api === 'gemini') {
          // Use XML format for Gemini API
          console.log(`[CHUNKS] Using ${apiInfo.displayName} for model: ${apiInfo.model} (XML format)`);
          chunkData = convertSubtitlesToXml(chunk.subtitles);
          translatedData = await translateWithGemini(chunkData);
        } else {
          // Use SRT format for OpenRouter API
          console.log(`[CHUNKS] Using ${apiInfo.displayName} for model: ${apiInfo.model} (SRT format)`);
          chunkData = convertSubtitlesToSrt(chunk.subtitles);
          translatedData = await translateWithOpenRouter(chunkData);
        }
        
        // Parse translated data based on format
        let chunkTranslatedSubtitles;
        if (apiInfo.api === 'gemini') {
          chunkTranslatedSubtitles = parseTranslatedXml(translatedData);
        } else {
          chunkTranslatedSubtitles = parseTranslatedSrt(translatedData);
        }
        
        if (chunkTranslatedSubtitles && chunkTranslatedSubtitles.length > 0) {
          translatedChunks.push(...chunkTranslatedSubtitles);
          console.log(`[CHUNKS] Successfully translated chunk ${chunkNumber}: ${chunkTranslatedSubtitles.length} subtitles`);
        } else {
          console.warn(`[CHUNKS] No translated subtitles received for chunk ${chunkNumber} - skipping this chunk`);
          // Skip this chunk instead of adding untranslated text
          // This prevents saving original text with "[ترجمه نشده]" label
        }
        
                 // Save progress after each successful chunk
         const progressData = {
           completedChunks: i + 1,
           totalChunks: chunks.length,
           chunkDuration: chunkDurationMinutes,
           translatedSubtitles: translatedChunks,
           timestamp: Date.now()
         };
         localStorage.setItem(progressKey, JSON.stringify(progressData));
         
         // Update persistent progress bar with real-time calculation
         // updatePersistentProgressDuringTranslation(translatedChunks);
         // Don't update with subtitle count format during translation to keep "بخش x از y" format
        
        // Update progress after successful translation
        const completedProgress = ((i + 1) / chunks.length) * 100;
        const updatedSavedSubtitles = loadSubtitlesFromStorage(currentVideoId) || [];
        const totalSubtitles = localStorage.getItem(`original_subtitles_count_${currentVideoId}`) || subtitles.length;
        updatePersistentProgressBar(completedProgress, `${updatedSavedSubtitles.length} زیرنویس از ${totalSubtitles} ذخیره شده`, `در حال ترجمه`);
        
        // Save merged subtitles after each chunk completion
        const existingSubtitles = loadSubtitlesFromStorage(currentVideoId) || [];
        
        // Get only the newly translated subtitles from this chunk
        const currentChunkSubtitles = chunkTranslatedSubtitles; // This contains only the current chunk's results
        
        // Merge current chunk with existing storage
        const mergedSubtitles = mergeSubtitles(existingSubtitles, currentChunkSubtitles);
        
        // Update global variable and save to storage
        translatedSubtitles = [...mergedSubtitles];
        saveSubtitlesToStorage(currentVideoId, translatedSubtitles);
        
        console.log(`[CHUNKS] Saved ${mergedSubtitles.length} total subtitles after chunk ${chunkNumber}`);
        
        // Update UI to show subtitle display button after each chunk completion
        setTimeout(() => {
          addTranslateButton(); // This will show the "نمایش زیرنویس فارسی" button
          
          // Show notification about available subtitles
          if (!firstChunkCompleted) {
            showNotification('بخش اول ترجمه شد - زیرنویس‌ها آماده مشاهده هستند!');
  } else {
            showNotification(`بخش ${chunkNumber} ترجمه شد - زیرنویس‌ها به‌روزرسانی شدند!`);
          }
        }, 100); // Reduced delay for immediate response
        
                 // Enable subtitle display after first chunk is completed
         if (!firstChunkCompleted && translatedChunks.length > 0) {
           firstChunkCompleted = true;
           console.log('[CHUNKS] First chunk completed, enabling subtitle display');
           
           // Automatically start displaying subtitles after first chunk
           setTimeout(() => {
             toggleSubtitleDisplay(true); // Automatically show subtitles
             showNotification('زیرنویس‌ها به صورت خودکار فعال شدند - ترجمه ادامه دارد...');
           }, 200);
         }
        
        // Small delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (chunkError) {
        console.error(`[CHUNKS] Error translating chunk ${chunkNumber}:`, chunkError);
        
                 // Save current progress before stopping
         const progressData = {
           completedChunks: i,
           totalChunks: chunks.length,
           chunkDuration: chunkDurationMinutes,
           translatedSubtitles: translatedChunks,
           timestamp: Date.now(),
           lastError: chunkError.message
         };
         localStorage.setItem(progressKey, JSON.stringify(progressData));
         
         // Update persistent progress bar with current progress
         if (translatedChunks.length > 0) {
           // updatePersistentProgressDuringTranslation(translatedChunks);
           // Don't update with subtitle count format during translation to keep "بخش x از y" format
         } else {
           updatePersistentProgress();
         }
        
        // Update progress bar to show error state
        const errorSavedSubtitles = loadSubtitlesFromStorage(currentVideoId) || [];
        const totalSubtitles = localStorage.getItem(`original_subtitles_count_${currentVideoId}`) || subtitles.length;
        updatePersistentProgressBar((i / chunks.length) * 100, `${errorSavedSubtitles.length} زیرنویس از ${totalSubtitles} ذخیره شده - خطا رخ داد`, `در حال ترجمه`);
        
        // If we have some translated chunks, save them and enable display
        if (translatedChunks.length > 0) {
          // Merge with existing subtitles instead of overwriting
          const existingSubtitles = loadSubtitlesFromStorage(currentVideoId) || [];
          const mergedSubtitles = mergeSubtitles(existingSubtitles, translatedChunks);
          
          translatedSubtitles = [...mergedSubtitles];
          saveSubtitlesToStorage(currentVideoId, translatedSubtitles);
          
          console.log(`[CHUNKS] Error: Saved ${mergedSubtitles.length} total subtitles after ${i} chunks`);
          
        setTimeout(() => {
            addTranslateButton();
            showNotification(`خطا در بخش ${chunkNumber} - ${i} بخش ترجمه شده قابل مشاهده است - دکمه نمایش زیرنویس آماده است!`);
          }, 500);
        }
        
        // Don't hide progress bar immediately, let user see the error state
        setTimeout(() => {
          // hideProgressBar();
        }, 5000);
        
        throw new Error(`ترجمه در بخش ${chunkNumber} متوقف شد: ${chunkError.message}`);
      }
    }
    
         // All chunks completed successfully
     // Clear progress data
     localStorage.removeItem(progressKey);
     
     // Update persistent progress bar to show completion
     updatePersistentProgress();
     
     // Final progress update
     const finalSavedSubtitles = loadSubtitlesFromStorage(currentVideoId) || [];
     const totalSubtitles = localStorage.getItem(`original_subtitles_count_${currentVideoId}`) || subtitles.length;
     updatePersistentProgressBar(100, `${finalSavedSubtitles.length} زیرنویس از ${totalSubtitles} ذخیره شده`, `ترجمه کامل`);
    
    console.log(`[CHUNKS] All chunks translated successfully. Total: ${translatedChunks.length} subtitles`);
    
    // Update UI to show final subtitle display button
    setTimeout(() => {
      // No need to merge again since it's done after each chunk
      // Just update UI
          addTranslateButton();
      showNotification('ترجمه کامل شد - زیرنویس‌ها به‌روزرسانی شدند!');
      
      // Reset refresh button after successful completion
      resetRefreshButton();
      
      // Ensure subtitles are displayed
      if (!isDisplayingSubtitles) {
            toggleSubtitleDisplay(true);
        showNotification('زیرنویس‌ها به صورت خودکار فعال شدند!');
      }
    }, 100);
    
    // No need to hide progress bar since we're using persistent progress bar
  } catch (error) {
    console.error('[CHUNKS] Error during chunked translation:', error);
    
    // Reset refresh button on error
    resetRefreshButton();
    
    // Don't hide progress bar immediately on error, let user see the state
    // setTimeout(() => {
    //   hideProgressBar();
    // }, 3000);
    throw error;
  }
  
  // No need to hide progress bar since we're using persistent progress bar
  
  // Return the final merged subtitles
  return translatedSubtitles;
}


// Clear translation progress for current video
function clearTranslationProgress() {
  if (currentVideoId) {
    const progressKey = `translation_progress_${currentVideoId}`;
    localStorage.removeItem(progressKey);
    console.log('[PROGRESS] Cleared translation progress for video:', currentVideoId);
    
    // Update persistent progress bar
    updatePersistentProgress();
  }
}

// Check if there's incomplete translation progress
function hasIncompleteTranslation() {
  if (!currentVideoId) return false;
  
  try {
    // First check if there are any saved subtitles at all
    const savedSubtitles = loadSubtitlesFromStorage(currentVideoId);
    if (!savedSubtitles || savedSubtitles.length === 0) {
      console.log('[INCOMPLETE] No saved subtitles found, returning false');
      return false;
    }
    
    // Check if there's incomplete translation progress
    const progressKey = `translation_progress_${currentVideoId}`;
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      const progressData = JSON.parse(savedProgress);
      if (progressData.completedChunks < progressData.totalChunks) {
        console.log('[INCOMPLETE] Found incomplete translation progress');
        return true;
      }
    }
    
    // Also check if the saved subtitles don't cover the full video
    const videoDuration = getVideoDuration();
    if (videoDuration) {
      const coverage = calculateSubtitleTimeCoverage(savedSubtitles);
      const isComplete = coverage.endTime >= videoDuration - 30; // 30 seconds tolerance
      if (!isComplete) {
        console.log(`[INCOMPLETE] Saved subtitles don't cover full video: ${coverage.endTime}s / ${videoDuration}s`);
        return true;
      }
    }
  } catch (e) {
    console.warn('[PROGRESS] Error checking incomplete translation:', e);
  }
  
  return false;
}

// Add time range controls to main settings box
function addTimeRangeControls() {
  // Get settings content container
  const settingsContent = document.getElementById('subtitle-settings-content');
  if (!settingsContent) return;
  
  // Remove any existing time range controls
  const existingControls = settingsContent.querySelector('.subtitle-time-range');
  if (existingControls) {
    existingControls.remove();
  }
  
  // Create time range controls container
  const timeRangeContainer = document.createElement('div');
  timeRangeContainer.className = 'subtitle-time-range';
  
  // Create title
  const title = document.createElement('div');
  title.textContent = 'شروع و پایان ترجمه';
  title.className = 'subtitle-time-range-title';
  timeRangeContainer.appendChild(title);
  
  // Load existing values or set defaults
  let startTime = parseInt(localStorage.getItem('translationStartTime') || '0');
  let endTime = parseInt(localStorage.getItem('translationEndTime') || '0');
  
  // Convert from old format if needed
  const startTimeStr = localStorage.getItem('translationStartTime') || '';
  const endTimeStr = localStorage.getItem('translationEndTime') || '';
  
  if (startTimeStr.includes(':')) {
    startTime = parseTimeToSeconds(startTimeStr);
  }
  if (endTimeStr.includes(':')) {
    endTime = parseTimeToSeconds(endTimeStr);
  }
  
  // Create start time control
  const startControl = document.createElement('div');
  startControl.className = 'subtitle-time-range-control';
  
  const startLabel = document.createElement('span');
  startLabel.textContent = 'شروع (ثانیه):';
  startControl.appendChild(startLabel);
  
  const startControls = document.createElement('div');
  startControls.style.display = 'flex';
  startControls.style.alignItems = 'center';
  
  const decreaseStart = document.createElement('button');
  decreaseStart.textContent = '-';
  decreaseStart.title = 'کاهش زمان شروع (10 ثانیه)';
  
  // Add hold functionality for decrease start button
  let decreaseStartInterval;
  decreaseStart.addEventListener('mousedown', () => {
    startTime = Math.max(0, startTime - 10);
    updateTimeRangeDisplay();
    saveTimeRange();
    showNotification(`زمان شروع: ${startTime} ثانیه`);
    
    decreaseStartInterval = setInterval(() => {
      startTime = Math.max(0, startTime - 10);
      updateTimeRangeDisplay();
      saveTimeRange();
      showNotification(`زمان شروع: ${startTime} ثانیه`);
    }, 200);
  });
  
  decreaseStart.addEventListener('mouseup', () => {
    if (decreaseStartInterval) {
      clearInterval(decreaseStartInterval);
      decreaseStartInterval = null;
    }
  });
  
  decreaseStart.addEventListener('mouseleave', () => {
    if (decreaseStartInterval) {
      clearInterval(decreaseStartInterval);
      decreaseStartInterval = null;
    }
  });
  
  const startValue = document.createElement('span');
  startValue.className = 'subtitle-time-range-value';
  startValue.id = 'start-time-value';
  startValue.textContent = startTime.toString();
  
  const increaseStart = document.createElement('button');
  increaseStart.textContent = '+';
  increaseStart.title = 'افزایش زمان شروع (10 ثانیه)';
  
  // Add hold functionality for increase start button
  let increaseStartInterval;
  increaseStart.addEventListener('mousedown', () => {
    startTime += 10;
    updateTimeRangeDisplay();
    saveTimeRange();
    showNotification(`زمان شروع: ${startTime} ثانیه`);
    
    increaseStartInterval = setInterval(() => {
      startTime += 10;
      updateTimeRangeDisplay();
      saveTimeRange();
      showNotification(`زمان شروع: ${startTime} ثانیه`);
    }, 200);
  });
  
  increaseStart.addEventListener('mouseup', () => {
    if (increaseStartInterval) {
      clearInterval(increaseStartInterval);
      increaseStartInterval = null;
    }
  });
  
  increaseStart.addEventListener('mouseleave', () => {
    if (increaseStartInterval) {
      clearInterval(increaseStartInterval);
      increaseStartInterval = null;
    }
  });
  
  startControls.appendChild(decreaseStart);
  startControls.appendChild(startValue);
  startControls.appendChild(increaseStart);
  startControl.appendChild(startControls);
  
  // Create end time control
  const endControl = document.createElement('div');
  endControl.className = 'subtitle-time-range-control';
  
  const endLabel = document.createElement('span');
  endLabel.textContent = 'پایان (ثانیه):';
  endControl.appendChild(endLabel);
  
  const endControls = document.createElement('div');
  endControls.style.display = 'flex';
  endControls.style.alignItems = 'center';
  
  const decreaseEnd = document.createElement('button');
  decreaseEnd.textContent = '-';
  decreaseEnd.title = 'کاهش زمان پایان (10 ثانیه)';
  
  // Add hold functionality for decrease end button
  let decreaseEndInterval;
  decreaseEnd.addEventListener('mousedown', () => {
    endTime = Math.max(0, endTime - 10);
    updateTimeRangeDisplay();
    saveTimeRange();
    showNotification(`زمان پایان: ${endTime} ثانیه`);
    
    decreaseEndInterval = setInterval(() => {
      endTime = Math.max(0, endTime - 10);
      updateTimeRangeDisplay();
      saveTimeRange();
      showNotification(`زمان پایان: ${endTime} ثانیه`);
    }, 200);
  });
  
  decreaseEnd.addEventListener('mouseup', () => {
    if (decreaseEndInterval) {
      clearInterval(decreaseEndInterval);
      decreaseEndInterval = null;
    }
  });
  
  decreaseEnd.addEventListener('mouseleave', () => {
    if (decreaseEndInterval) {
      clearInterval(decreaseEndInterval);
      decreaseEndInterval = null;
    }
  });
  
  const endValue = document.createElement('span');
  endValue.className = 'subtitle-time-range-value';
  endValue.id = 'end-time-value';
  endValue.textContent = endTime.toString();
  
  const increaseEnd = document.createElement('button');
  increaseEnd.textContent = '+';
  increaseEnd.title = 'افزایش زمان پایان (10 ثانیه)';
  
  // Add hold functionality for increase end button
  let increaseEndInterval;
  increaseEnd.addEventListener('mousedown', () => {
    endTime += 10;
    updateTimeRangeDisplay();
    saveTimeRange();
    showNotification(`زمان پایان: ${endTime} ثانیه`);
    
    increaseEndInterval = setInterval(() => {
      endTime += 10;
      updateTimeRangeDisplay();
      saveTimeRange();
      showNotification(`زمان پایان: ${endTime} ثانیه`);
    }, 200);
  });
  
  increaseEnd.addEventListener('mouseup', () => {
    if (increaseEndInterval) {
      clearInterval(increaseEndInterval);
      increaseEndInterval = null;
    }
  });
  
  increaseEnd.addEventListener('mouseleave', () => {
    if (increaseEndInterval) {
      clearInterval(increaseEndInterval);
      increaseEndInterval = null;
    }
  });
  
  endControls.appendChild(decreaseEnd);
  endControls.appendChild(endValue);
  endControls.appendChild(increaseEnd);
  endControl.appendChild(endControls);
  
  // Add reset button
  const resetControl = document.createElement('div');
  resetControl.style.textAlign = 'center';
  resetControl.style.marginTop = '5px';
  
  const resetButton = document.createElement('button');
  resetButton.textContent = 'پاک کردن بازه';
  resetButton.style.backgroundColor = '#f44336';
  resetButton.style.color = 'white';
  resetButton.style.border = 'none';
  resetButton.style.borderRadius = '4px';
  resetButton.style.padding = '4px 8px';
  resetButton.style.cursor = 'pointer';
  resetButton.style.fontSize = '11px';
  resetButton.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
  resetButton.addEventListener('click', () => {
    startTime = 0;
    endTime = 0;
    updateTimeRangeDisplay();
    saveTimeRange();
    showNotification('بازه زمانی پاک شد - کل ویدیو ترجمه خواهد شد');
  });
  
  resetControl.appendChild(resetButton);
  
  // Add info text
  const infoText = document.createElement('div');
  infoText.className = 'subtitle-time-info';
  infoText.textContent = 'هر دو صفر باشند تا کل ویدیو ترجمه شود';
  
  // Add everything to time range container
  timeRangeContainer.appendChild(startControl);
  timeRangeContainer.appendChild(endControl);
  timeRangeContainer.appendChild(resetControl);
  timeRangeContainer.appendChild(infoText);
  
  // Insert at the beginning of settings content (before all buttons)
  settingsContent.insertBefore(timeRangeContainer, settingsContent.firstChild);
  
  // Helper functions
  function updateTimeRangeDisplay() {
    const startValueElement = document.getElementById('start-time-value');
    const endValueElement = document.getElementById('end-time-value');
    
    if (startValueElement) {
      startValueElement.textContent = startTime.toString();
    }
    if (endValueElement) {
      endValueElement.textContent = endTime.toString();
    }
  }
  
  function saveTimeRange() {
    localStorage.setItem('translationStartTime', startTime.toString());
    localStorage.setItem('translationEndTime', endTime.toString());
  }
  
  console.log('Enhanced time range controls added to main settings box');
}

// Helper function to parse time string to seconds (for backward compatibility)
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  
  // If it's already a number, return it
  if (!isNaN(timeStr)) return parseInt(timeStr);
  
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    // mm:ss format
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    // hh:mm:ss format
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}

// Clear saved subtitles
function clearSavedSubtitles() {
  // Show confirmation dialog
  if (confirm('آیا از پاک کردن زیرنویس ذخیره شده این ویدیو اطمینان دارید؟')) {
    if (!currentVideoId) {
      showNotification('خطا: شناسه ویدیو یافت نشد');
      return;
    }
    
    try {
      // Clear saved subtitles for current video
      const storageKey = `youtube_subtitles_${currentVideoId}`;
      localStorage.removeItem(storageKey);
      
      // Also check for backup key
      const backupKey = `youtube_subtitles_backup_${currentVideoId}`;
      localStorage.removeItem(backupKey);
      
      // Clear translation progress as well
      const progressKey = `translation_progress_${currentVideoId}`;
      localStorage.removeItem(progressKey);
      
      console.log(`[CLEAR] Cleared saved subtitles and progress for video: ${currentVideoId}`);
      
      // Reset UI state
      isDisplayingSubtitles = false;
      isSubtitleVisible = false;
        translatedSubtitles = [];
      
      // Remove subtitle overlay
      removeExistingOverlay();
      
      // Reset progress bar to zero
      updatePersistentProgressBar(0, 'ترجمه نشده', 'پیشرفت ترجمه ویدیو');
      
      // Rebuild UI to show translate button
      removeSettingsBox();
      const settingsContent = createSettingsBox();
      if (settingsContent) {
        setTimeout(() => addTranslateButton(), 300);
      }
      
      showNotification('زیرنویس ذخیره شده این ویدیو پاک شد');
    } catch (error) {
      console.error('[CLEAR] Error clearing saved subtitles:', error);
      showNotification('خطا در پاک کردن زیرنویس: ' + error.message);
    }
  }
}

// Show saved subtitles viewer window
function showSavedSubtitlesViewer() {
  console.log('[VIEWER] Opening saved subtitles viewer');
  
  if (!currentVideoId) {
    showNotification('خطا: شناسه ویدیو یافت نشد');
    return;
  }
  
  // Load saved subtitles
  const savedSubtitles = loadSubtitlesFromStorage(currentVideoId);
  if (!savedSubtitles || savedSubtitles.length === 0) {
    showNotification('زیرنویس ذخیره شده‌ای برای این ویدیو یافت نشد');
    return;
  }
  
  // Remove existing viewer if any
  const existingViewer = document.getElementById('subtitle-viewer-modal');
  if (existingViewer) {
    existingViewer.remove();
  }
  
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'subtitle-viewer-modal';
  modalOverlay.style.position = 'fixed';
  modalOverlay.style.top = '0';
  modalOverlay.style.left = '0';
  modalOverlay.style.width = '100%';
  modalOverlay.style.height = '100%';
  modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  modalOverlay.style.zIndex = '10000000';
  modalOverlay.style.display = 'flex';
  modalOverlay.style.alignItems = 'center';
  modalOverlay.style.justifyContent = 'center';
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
  modalContent.style.borderRadius = '8px';
  modalContent.style.padding = '20px';
  modalContent.style.width = '340px';
  modalContent.style.maxHeight = '80vh';
  modalContent.style.direction = 'rtl';
  modalContent.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
  modalContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
  modalContent.style.display = 'flex';
  modalContent.style.flexDirection = 'column';
  
  // Create header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '15px';
  header.style.paddingBottom = '10px';
  header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
  
  const title = document.createElement('h3');
  title.textContent = `زیرنویس ذخیره شده (${savedSubtitles.length} مورد)`;
  title.style.color = 'white';
  title.style.margin = '0';
  title.style.fontSize = '16px';
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.padding = '0';
  closeButton.style.width = '30px';
  closeButton.style.height = '30px';
  closeButton.addEventListener('click', () => modalOverlay.remove());
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create refresh button
  const refreshButton = document.createElement('button');
  refreshButton.textContent = 'رفرش زیرنویس';
  refreshButton.style.backgroundColor = '#2196F3';
  refreshButton.style.color = 'white';
  refreshButton.style.border = 'none';
  refreshButton.style.borderRadius = '4px';
  refreshButton.style.padding = '8px 16px';
  refreshButton.style.fontSize = '14px';
  refreshButton.style.cursor = 'pointer';
  refreshButton.style.marginBottom = '10px';
  refreshButton.style.width = '100%';
  refreshButton.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
  refreshButton.addEventListener('click', () => {
    // Refresh the subtitle viewer with updated data
    modalOverlay.remove();
    showSavedSubtitlesViewer();
  });
  refreshButton.addEventListener('mouseenter', () => {
    refreshButton.style.backgroundColor = '#1976D2';
  });
  refreshButton.addEventListener('mouseleave', () => {
    refreshButton.style.backgroundColor = '#2196F3';
  });

  // Create clear button
  const clearButton = document.createElement('button');
  clearButton.textContent = 'پاک کردن زیرنویس';
  clearButton.style.backgroundColor = '#f44336';
  clearButton.style.color = 'white';
  clearButton.style.border = 'none';
  clearButton.style.borderRadius = '4px';
  clearButton.style.padding = '8px 16px';
  clearButton.style.fontSize = '14px';
  clearButton.style.cursor = 'pointer';
  clearButton.style.marginBottom = '15px';
  clearButton.style.width = '100%';
  clearButton.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
  clearButton.addEventListener('click', () => {
    modalOverlay.remove();
    clearSavedSubtitles();
  });
  clearButton.addEventListener('mouseenter', () => {
    clearButton.style.backgroundColor = '#d32f2f';
  });
  clearButton.addEventListener('mouseleave', () => {
    clearButton.style.backgroundColor = '#f44336';
  });
  
  // Create subtitles container with modern scroll
  const subtitlesContainer = document.createElement('div');
  subtitlesContainer.style.maxHeight = '50vh';
  subtitlesContainer.style.overflowY = 'auto';
  subtitlesContainer.style.padding = '10px';
  subtitlesContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
  subtitlesContainer.style.borderRadius = '4px';
  subtitlesContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  
  // Modern scrollbar styles
  subtitlesContainer.style.scrollbarWidth = 'thin';
  subtitlesContainer.style.scrollbarColor = '#673AB7 rgba(255, 255, 255, 0.1)';
  
  // Add webkit scrollbar styles
  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.textContent = `
    #subtitle-viewer-modal div::-webkit-scrollbar {
      width: 8px;
    }
    #subtitle-viewer-modal div::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    #subtitle-viewer-modal div::-webkit-scrollbar-thumb {
      background: #673AB7;
      border-radius: 4px;
    }
    #subtitle-viewer-modal div::-webkit-scrollbar-thumb:hover {
      background: #5E35B1;
    }
  `;
  document.head.appendChild(scrollbarStyle);
  
  // Add subtitles to container
  savedSubtitles.forEach((subtitle, index) => {
    const subtitleItem = document.createElement('div');
    subtitleItem.style.marginBottom = '12px';
    subtitleItem.style.padding = '8px';
    subtitleItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    subtitleItem.style.borderRadius = '4px';
    subtitleItem.style.borderLeft = '3px solid #673AB7';
    
    const timeInfo = document.createElement('div');
    timeInfo.style.color = '#673AB7';
    timeInfo.style.fontSize = '12px';
    timeInfo.style.marginBottom = '4px';
    timeInfo.textContent = `${formatSecondsToTime(subtitle.startTime)} - ${formatSecondsToTime(subtitle.endTime)}`;
    
    const textContent = document.createElement('div');
    textContent.style.color = 'white';
    textContent.style.fontSize = '14px';
    textContent.style.lineHeight = '1.4';
    textContent.textContent = subtitle.text;
    
    subtitleItem.appendChild(timeInfo);
    subtitleItem.appendChild(textContent);
    subtitlesContainer.appendChild(subtitleItem);
  });
  
  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(refreshButton);
  modalContent.appendChild(clearButton);
  modalContent.appendChild(subtitlesContainer);
  modalOverlay.appendChild(modalContent);
  
  // Add to page
  document.body.appendChild(modalOverlay);
  
  // Close on overlay click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.remove();
    }
  });
  
  console.log(`[VIEWER] Displayed ${savedSubtitles.length} saved subtitles`);
}

// Force create settings box with body as container (fallback)
function forceCreateSettingsBox() {
  console.log('[FORCE] Force creating settings box with video container...');
  
  // Remove existing settings box if any
  removeSettingsBox();
  
  // Try to find video container first, fallback to body
  let container = findYouTubeVideoContainer();
  if (!container) {
    console.log('[FORCE] No video container found, using body as fallback');
    container = document.body;
  } else {
    console.log('[FORCE] Using video container for positioning');
  }
  
  // Create settings box container
  const settingsBox = document.createElement('div');
  settingsBox.className = 'subtitle-settings-box';
  settingsBox.id = 'subtitle-settings-box';
  
  // Make it more visible with additional styles
  // Use absolute positioning if we have video container, fixed if using body
  if (container === document.body) {
    settingsBox.style.position = 'fixed';
  } else {
    settingsBox.style.position = 'absolute';
  }
  settingsBox.style.top = '10px';
  settingsBox.style.left = '10px';
  settingsBox.style.zIndex = '2147483647';
  settingsBox.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
  settingsBox.style.border = '2px solid #673AB7';
  
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
  gearButton.innerHTML = `⚙️`;
  gearButton.title = 'تنظیمات کلید API';
  gearButton.addEventListener('click', showApiKeyPanel);
  
  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'subtitle-settings-toggle';
  toggleButton.textContent = '×';
  toggleButton.title = 'بستن پنل تنظیمات';
  toggleButton.addEventListener('click', toggleSettingsBox);
  
  // Add buttons to controls
  controls.appendChild(gearButton);
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
  
  // Add to container
  container.appendChild(settingsBox);
  
  // Create collapsed button (+ button)
  const collapsedButton = document.createElement('div');
  collapsedButton.className = 'collapsed-button';
  collapsedButton.id = 'subtitle-collapsed-button';
  collapsedButton.textContent = '+';
  collapsedButton.title = 'باز کردن تنظیمات زیرنویس';
  collapsedButton.addEventListener('click', toggleSettingsBox);
  
  // Use same positioning as settings box
  if (container === document.body) {
    collapsedButton.style.position = 'fixed';
  } else {
    collapsedButton.style.position = 'absolute';
  }
  collapsedButton.style.top = '10px';
  collapsedButton.style.left = '10px';
  collapsedButton.style.zIndex = '2147483647';
  
  // Initial state: Always show settings box open by default, hide the + button
  content.classList.remove('collapsed');
  settingsBox.style.display = 'block';
  collapsedButton.style.display = 'none';
  
  // Add to container
  container.appendChild(collapsedButton);
  
  console.log('[FORCE] Force created settings box successfully');
  
  // Add translate button
  setTimeout(() => {
    addTranslateButton();
    showNotification('پنل تنظیمات اکستنشن ایجاد شد');
  }, 300);
  
  return content;
}

// Show notification function
function showNotification(message) {
  console.log('[NOTIFICATION]', message);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = 'rgba(140, 0, 0, 0.9)';
  notification.style.color = 'white';
  notification.style.padding = '10px 15px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '2147483647';
  notification.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
  notification.style.fontSize = '14px';
  notification.style.direction = 'rtl';
  notification.style.maxWidth = '300px';
  notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
  notification.textContent = message;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Setup navigation observer function
function setupNavigationObserver() {
  console.log('[OBSERVER] Setting up navigation observer...');
  
  // Disconnect existing observer if any
  if (navigationObserver) {
    navigationObserver.disconnect();
  }
  
  // Create new observer
  navigationObserver = new MutationObserver((mutations) => {
    const currentUrl = window.location.href;
    
    // Check if URL changed
    if (currentUrl !== lastProcessedUrl) {
      if (currentUrl.includes('youtube.com/watch')) {
        console.log('[OBSERVER] URL changed, reinitializing...');
        lastProcessedUrl = currentUrl;
        
        // Update current video ID
        const newVideoId = new URLSearchParams(window.location.search).get('v');
        if (newVideoId && newVideoId !== currentVideoId) {
          currentVideoId = newVideoId;
          console.log('[OBSERVER] Video ID changed to:', currentVideoId);
        }
        
        // Small delay to let YouTube load
        setTimeout(() => {
          init();
        }, 1000);
      } else if (lastProcessedUrl.includes('youtube.com/watch') && !currentUrl.includes('youtube.com/watch')) {
        // User left YouTube video page completely
        console.log('[EXIT] 🚪 User completely left YouTube video page');
        console.log('[EXIT] From:', lastProcessedUrl);
        console.log('[EXIT] To:', currentUrl);
        clearCurrentVideoData();
        lastProcessedUrl = currentUrl;
      }
    }
  });
  
  // Start observing
  navigationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Create API key panel function
function createApiKeyPanel() {
  console.log('[API] Creating API key panel...');
  
  // Remove existing API panel if any
  const existingPanel = document.getElementById('api-key-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // Find the video container
  const videoContainer = findYouTubeVideoContainer();
  if (!videoContainer) {
    console.error('Could not find video container for API panel');
    return;
  }
  
  // Create backdrop overlay first
  const backdrop = document.createElement('div');
  backdrop.id = 'api-panel-backdrop';
  backdrop.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.5) !important;
    z-index: 999999999 !important;
    display: none !important;
  `;
  
  // Close panel when clicking on backdrop
  backdrop.addEventListener('click', hideApiKeyPanel);
  
  // Create API key panel with styling similar to main extension
  const apiPanel = document.createElement('div');
  apiPanel.id = 'api-key-panel';
  apiPanel.className = 'api-key-panel';
  apiPanel.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    background: #1a1a1a !important;
    border: 1px solid #333 !important;
    border-radius: 8px !important;
    padding: 16px !important;
    width: 380px !important;
    max-width: 90vw !important;
    z-index: 1000000000 !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif !important;
    direction: rtl !important;
    display: none !important;
    color: #fff !important;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #333;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'تنظیمات API';
  title.style.cssText = `
    margin: 0;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
  `;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    background: #333;
    border: none;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
  `;
  closeButton.addEventListener('click', hideApiKeyPanel);
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = '#555';
  });
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = '#333';
  });
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create content area
  const content = document.createElement('div');
  content.style.cssText = `
    color: #fff;
    line-height: 1.4;
  `;
  
  // API Provider section
  const providerSection = document.createElement('div');
  providerSection.style.cssText = `
    margin-bottom: 12px;
  `;
  
  const providerLabel = document.createElement('label');
  providerLabel.textContent = 'ارائه‌دهنده API:';
  providerLabel.style.cssText = `
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    text-align: right;
  `;
  
  const providerSelect = document.createElement('select');
  providerSelect.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1px solid #555;
    border-radius: 4px;
    background: #2a2a2a;
    color: #fff;
    font-size: 14px;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    box-sizing: border-box;
    outline: none;
    cursor: pointer;
  `;
  
  // Add provider options
  const providers = [
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'gemini', label: 'Gemini (مستقیم)' }
  ];
  
  const currentProvider = localStorage.getItem('api_provider') || 'openrouter';
  
  providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider.value;
    option.textContent = provider.label;
    if (provider.value === currentProvider) {
      option.selected = true;
    }
    providerSelect.appendChild(option);
  });
  
  providerSection.appendChild(providerLabel);
  providerSection.appendChild(providerSelect);
  
  // API Key Links section (moved here from bottom)
  const apiLinksSection = document.createElement('div');
  apiLinksSection.style.cssText = `
    margin-top: 8px;
    margin-bottom: 12px;
  `;
  
  const apiLinkContainer = document.createElement('div');
  apiLinkContainer.style.cssText = `
    display: flex;
    justify-content: center;
  `;
  
  const apiLink = document.createElement('a');
  apiLink.target = '_blank';
  apiLink.style.cssText = `
    color: #4CAF50;
    text-decoration: none;
    font-size: 12px;
    padding: 4px 8px;
    border: 1px solid #4CAF50;
    border-radius: 4px;
    transition: all 0.2s;
    text-align: center;
    display: block;
  `;
  
  // Function to update API link based on selected provider
  function updateApiLink() {
    const selectedProvider = providerSelect.value;
    
    if (selectedProvider === 'gemini') {
      apiLink.href = 'https://aistudio.google.com/app/apikey';
      apiLink.textContent = 'دریافت کلید Gemini API';
    } else {
      apiLink.href = 'https://openrouter.ai/keys';
      apiLink.textContent = 'دریافت کلید OpenRouter API';
    }
  }
  
  // Add hover effects
  apiLink.addEventListener('mouseenter', () => {
    apiLink.style.background = '#4CAF50';
    apiLink.style.color = 'white';
  });
  apiLink.addEventListener('mouseleave', () => {
    apiLink.style.background = 'transparent';
    apiLink.style.color = '#4CAF50';
  });
  
  // Update link when provider changes
  providerSelect.addEventListener('change', updateApiLink);
  
  // Set initial link
  updateApiLink();
  
  apiLinkContainer.appendChild(apiLink);
  apiLinksSection.appendChild(apiLinkContainer);
  
  // API Token section
  const tokenSection = document.createElement('div');
  tokenSection.style.cssText = `
    margin-bottom: 12px;
  `;
  
  const tokenLabel = document.createElement('label');
  tokenLabel.textContent = 'API Token:';
  tokenLabel.style.cssText = `
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    text-align: right;
  `;
  
  const tokenInput = document.createElement('input');
  tokenInput.type = 'text';
  tokenInput.placeholder = 'کلید API خود را وارد کنید...';
  tokenInput.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1px solid #555;
    border-radius: 4px;
    background: #2a2a2a;
    color: #fff;
    font-size: 14px;
    font-family: monospace;
    box-sizing: border-box;
    outline: none;
    text-align: right;
  `;
  
  tokenSection.appendChild(tokenLabel);
  tokenSection.appendChild(tokenInput);
  
  // Model section
  const modelSection = document.createElement('div');
  modelSection.style.cssText = `
    margin-bottom: 16px;
  `;
  
  const modelLabel = document.createElement('label');
  modelLabel.textContent = 'مدل:';
  modelLabel.style.cssText = `
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    text-align: right;
  `;
  
  const modelInput = document.createElement('input');
  modelInput.type = 'text';
  modelInput.placeholder = 'نام مدل...';
  modelInput.value = 'deepseek/deepseek-chat-v3-0324:free';
  modelInput.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1px solid #555;
    border-radius: 4px;
    background: #2a2a2a;
    color: #fff;
    font-size: 14px;
    font-family: monospace;
    box-sizing: border-box;
    outline: none;
  `;
  
  modelSection.appendChild(modelLabel);
  modelSection.appendChild(modelInput);
  
  // Chunk Duration section
  const chunkSection = document.createElement('div');
  chunkSection.style.cssText = `
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid #333;
    border-radius: 6px;
    background: #222;
  `;
  
  const chunkTitle = document.createElement('div');
  chunkTitle.textContent = 'مدت زمان هر تکه(بخش) برای ترجمه';
  chunkTitle.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    text-align: center;
    color: #fff;
  `;
  
  const chunkControls = document.createElement('div');
  chunkControls.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 12px;
  `;
  
  const decreaseBtn = document.createElement('button');
  decreaseBtn.textContent = '-';
  decreaseBtn.style.cssText = `
    background: #6c5ce7;
    color: white;
    border: none;
    border-radius: 6px;
    width: 40px;
    height: 40px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const durationDisplay = document.createElement('div');
  durationDisplay.style.cssText = `
    background: #333;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 18px;
    font-weight: bold;
    min-width: 40px;
    text-align: center;
  `;
  
  const increaseBtn = document.createElement('button');
  increaseBtn.textContent = '+';
  increaseBtn.style.cssText = `
    background: #6c5ce7;
    color: white;
    border: none;
    border-radius: 6px;
    width: 40px;
    height: 40px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const durationLabel = document.createElement('div');
  durationLabel.textContent = 'مدت (دقیقه):';
  durationLabel.style.cssText = `
    font-size: 14px;
    color: #ccc;
  `;
  
  const chunkInfo = document.createElement('div');
  chunkInfo.textContent = 'برای ترجمه سریعتر و بهتر ویدیو تکه تکه ترجمه میشود.';
  chunkInfo.style.cssText = `
    font-size: 12px;
    color: #888;
    text-align: center;
    line-height: 1.4;
    margin-top: 8px;
  `;
  
  // Get current chunk duration
  let currentChunkDuration = parseInt(localStorage.getItem('chunkDurationMinutes')) || 5;
  
  function updateChunkDisplay() {
    durationDisplay.textContent = currentChunkDuration;
  }
  
  // Event listeners for chunk duration controls
  decreaseBtn.addEventListener('click', () => {
    if (currentChunkDuration > 1) {
      currentChunkDuration--;
      updateChunkDisplay();
    }
  });
  
  increaseBtn.addEventListener('click', () => {
    if (currentChunkDuration < 30) {
      currentChunkDuration++;
      updateChunkDisplay();
    }
  });
  
  // Hover effects
  decreaseBtn.addEventListener('mouseenter', () => {
    decreaseBtn.style.background = '#5a4fcf';
  });
  decreaseBtn.addEventListener('mouseleave', () => {
    decreaseBtn.style.background = '#6c5ce7';
  });
  
  increaseBtn.addEventListener('mouseenter', () => {
    increaseBtn.style.background = '#5a4fcf';
  });
  increaseBtn.addEventListener('mouseleave', () => {
    increaseBtn.style.background = '#6c5ce7';
  });
  
  // Initialize display
  updateChunkDisplay();
  
  // Add reset to default button
  // const resetChunkBtn = document.createElement('button');
  // resetChunkBtn.textContent = 'بازگشت به پیشفرض (5 دقیقه)';
  // resetChunkBtn.style.cssText = `
  //   background: #2196F3;
  //   color: white;
  //   border: none;
  //   border-radius: 4px;
  //   padding: 6px 12px;
  //   font-size: 12px;
  //   cursor: pointer;
  //   margin-top: 8px;
  //   width: 100%;
  //   font-family: 'Vazirmatn', 'Tahoma', sans-serif;
  //   transition: background-color 0.2s;
  // `;
  
  // resetChunkBtn.addEventListener('click', () => {
  //   currentChunkDuration = 5;
  //   updateChunkDisplay();
  // });
  
  // resetChunkBtn.addEventListener('mouseenter', () => {
  //   resetChunkBtn.style.background = '#1976D2';
  // });
  // resetChunkBtn.addEventListener('mouseleave', () => {
  //   resetChunkBtn.style.background = '#2196F3';
  // });
  
  // Assemble chunk section
  chunkControls.appendChild(decreaseBtn);
  chunkControls.appendChild(durationLabel);
  chunkControls.appendChild(durationDisplay);
  chunkControls.appendChild(increaseBtn);
  
  chunkSection.appendChild(chunkTitle);
  chunkSection.appendChild(chunkControls);
  // chunkSection.appendChild(resetChunkBtn);
  chunkSection.appendChild(chunkInfo);
  
  // Function to update UI based on selected provider
  function updateProviderUI() {
    const selectedProvider = providerSelect.value;
    
    if (selectedProvider === 'gemini') {
      // Gemini mode
      tokenInput.value = localStorage.getItem('geminiApiKey') || '';
      tokenInput.placeholder = 'کلید Gemini API خود را وارد کنید...';
      modelInput.disabled = true;
      modelInput.style.opacity = '0.5';
      modelInput.style.cursor = 'not-allowed';
      modelInput.value = 'gemini-2.0-flash';
    } else {
      // OpenRouter mode
      tokenInput.value = localStorage.getItem('openrouter_api_key') || '';
      tokenInput.placeholder = 'کلید OpenRouter API خود را وارد کنید...';
      modelInput.disabled = false;
      modelInput.style.opacity = '1';
      modelInput.style.cursor = 'text';
      modelInput.value = localStorage.getItem('openrouter_model') || 'deepseek/deepseek-chat-v3-0324:free';
    }
  }
  
  // Add event listener for provider change
  providerSelect.addEventListener('change', updateProviderUI);
  
  // Set initial UI state
  updateProviderUI();
  
  // Buttons section
  const buttonsSection = document.createElement('div');
  buttonsSection.style.cssText = `
    display: flex;
    gap: 8px;
    margin-top: 16px;
  `;
  
  const saveButton = document.createElement('button');
  saveButton.textContent = 'ذخیره';
  saveButton.style.cssText = `
    flex: 1;
    padding: 10px 16px;
    background: #ff6b35;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    transition: background-color 0.2s;
  `;
  
  const resetButton = document.createElement('button');
  resetButton.textContent = 'ریست';
  resetButton.style.cssText = `
    padding: 10px 16px;
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    transition: background-color 0.2s;
  `;
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'انصراف';
  cancelButton.style.cssText = `
    flex: 1;
    padding: 10px 16px;
    background: #555;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    transition: background-color 0.2s;
  `;
  
  // Add hover effects
  saveButton.addEventListener('mouseenter', () => {
    saveButton.style.background = '#e55a2b';
  });
  saveButton.addEventListener('mouseleave', () => {
    saveButton.style.background = '#ff6b35';
  });
  
  resetButton.addEventListener('mouseenter', () => {
    resetButton.style.background = '#777';
  });
  resetButton.addEventListener('mouseleave', () => {
    resetButton.style.background = '#666';
  });
  
  cancelButton.addEventListener('mouseenter', () => {
    cancelButton.style.background = '#666';
  });
  cancelButton.addEventListener('mouseleave', () => {
    cancelButton.style.background = '#555';
  });
  
  // Add event listeners
  saveButton.addEventListener('click', () => {
    const selectedProvider = providerSelect.value;
    const apiToken = tokenInput.value.trim();
    const modelName = modelInput.value.trim();
    
    if (!apiToken) {
      showNotification('⚠️ لطفاً API Token را وارد کنید');
      tokenInput.focus();
      return;
    }
    
    // Save settings based on provider
    localStorage.setItem('api_provider', selectedProvider);
    
    // Save chunk duration setting
    localStorage.setItem('chunkDurationMinutes', currentChunkDuration.toString());
    
    if (selectedProvider === 'gemini') {
      localStorage.setItem('geminiApiKey', apiToken);
      localStorage.setItem('openrouter_model', 'gemini-2.0-flash');
      showNotification('✅ تنظیمات Gemini و مدت زمان بخش‌ها ذخیره شد');
    } else {
      localStorage.setItem('openrouter_api_key', apiToken);
      if (modelName) {
        localStorage.setItem('openrouter_model', modelName);
      }
      showNotification('✅ تنظیمات OpenRouter و مدت زمان بخش‌ها ذخیره شد');
    }
    
    hideApiKeyPanel();
  });
  
  resetButton.addEventListener('click', () => {
    const selectedProvider = providerSelect.value;
    
    if (selectedProvider === 'gemini') {
      localStorage.removeItem('geminiApiKey');
      tokenInput.value = '';
      showNotification('🔄 تنظیمات Gemini ریست شد');
    } else {
      localStorage.removeItem('openrouter_api_key');
      localStorage.setItem('openrouter_model', 'deepseek/deepseek-chat-v3-0324:free');
      tokenInput.value = '';
      modelInput.value = 'deepseek/deepseek-chat-v3-0324:free';
      showNotification('🔄 تنظیمات OpenRouter ریست شد');
    }
  });
  
  cancelButton.addEventListener('click', hideApiKeyPanel);
  
  // Add Enter key support
  tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveButton.click();
    }
  });
  
  modelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveButton.click();
    }
  });
  
  buttonsSection.appendChild(saveButton);
  buttonsSection.appendChild(resetButton);
  buttonsSection.appendChild(cancelButton);
  
  // Version section
  const versionSection = document.createElement('div');
  versionSection.style.cssText = `
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #333;
    text-align: center;
  `;
  
  const versionText = document.createElement('div');
  versionText.textContent = 'نسخه: 1.0';
  versionText.style.cssText = `
    font-size: 12px;
    color: #888;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
  `;
  
  versionSection.appendChild(versionText);
  
  // Contact section
  const contactSection = document.createElement('div');
  contactSection.style.cssText = `
    margin-top: 8px;
    text-align: center;
  `;
  
  const contactText = document.createElement('div');
  contactText.textContent = 'لطفا باگ‌ها و انتقادات و پیشنهادات را به ایمیل';
  contactText.style.cssText = `
    font-size: 11px;
    color: #666;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    margin-bottom: 2px;
  `;
  
  const emailText = document.createElement('div');
  emailText.textContent = 'mortezadalil@gmail.com';
  emailText.style.cssText = `
    font-size: 11px;
    color: #4CAF50;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    direction: ltr;
  `;
  
  const sendText = document.createElement('div');
  sendText.textContent = 'بفرستید';
  sendText.style.cssText = `
    font-size: 11px;
    color: #666;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    margin-top: 2px;
  `;
  
  contactSection.appendChild(contactText);
  contactSection.appendChild(emailText);
  contactSection.appendChild(sendText);
  
  // Assemble the panel
  content.appendChild(providerSection);
  content.appendChild(apiLinksSection);
  content.appendChild(tokenSection);
  content.appendChild(modelSection);
  content.appendChild(chunkSection);
  content.appendChild(buttonsSection);
  content.appendChild(versionSection);
  content.appendChild(contactSection);
  
  apiPanel.appendChild(header);
  apiPanel.appendChild(content);
  
  // Add to document.body instead of video container to ensure highest z-index
  document.body.appendChild(backdrop);
  document.body.appendChild(apiPanel);
  
  console.log('[API] Redesigned API settings panel created successfully');
}

// Show API key panel function
function showApiKeyPanel() {
  console.log('[API] Showing API key panel...');
  
  // Create panel if it doesn't exist
  let apiPanel = document.getElementById('api-key-panel');
  let backdrop = document.getElementById('api-panel-backdrop');
  
  if (!apiPanel) {
    createApiKeyPanel();
    apiPanel = document.getElementById('api-key-panel');
    backdrop = document.getElementById('api-panel-backdrop');
  }
  
  if (apiPanel && backdrop) {
    backdrop.style.setProperty('display', 'block', 'important');
    apiPanel.style.setProperty('display', 'block', 'important');
    
    // Focus on the input field
    const input = apiPanel.querySelector('input');
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }
}

// Hide API key panel function
function hideApiKeyPanel() {
  console.log('[API] Hiding API key panel...');
  
  const apiPanel = document.getElementById('api-key-panel');
  const backdrop = document.getElementById('api-panel-backdrop');
  
  if (apiPanel) {
    apiPanel.remove(); // Completely remove the panel from DOM
  }
  
  if (backdrop) {
    backdrop.remove(); // Completely remove the backdrop from DOM
  }
}

// Format seconds to time function
function formatSecondsToTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Start the extension when page loads
console.log('[STARTUP] YouTube Subtitle Translator loading...');

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 1000);
  });
} else {
  // Page already loaded
  setTimeout(init, 1000);
}

// Also try to activate when window loads
window.addEventListener('load', () => {
    setTimeout(() => {
    const existingBox = document.getElementById('subtitle-settings-box');
    if (!existingBox) {
      console.log('[STARTUP] Window loaded but no settings box found, activating...');
      activateSubtitleTranslator();
    }
  }, 2000);
});

console.log('[STARTUP] YouTube Subtitle Translator script loaded successfully');
console.log('[STARTUP] If you don\'t see the settings panel, run: activateSubtitleTranslator()');

// Dummy implementations for missing functions
function addSyncControls() {
  console.log('[SYNC] Sync controls not implemented yet');
}

async function refreshSubtitles() {
  console.log('[REFRESH] Refresh subtitles function called');
  
  // Set translation in progress flag
  isTranslationInProgress = true;
  
  // Disable the refresh button during translation
  const refreshButton = document.getElementById('subtitle-refresh-button');
  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.textContent = 'در حال دریافت ادامه...';
    refreshButton.style.opacity = '0.6';
    refreshButton.style.cursor = 'not-allowed';
  }
  
  if (!currentVideoId) {
    showNotification('خطا: شناسه ویدیو یافت نشد');
    resetRefreshButton();
    return;
  }
  
  // Check if we have existing translations
  const existingSubtitles = loadSubtitlesFromStorage(currentVideoId);
  if (!existingSubtitles || existingSubtitles.length === 0) {
    showNotification('زیرنویس موجود یافت نشد - ترجمه کامل شروع می‌شود');
    translateSubtitlesWithOpenRouter();
    return;
  }
  
  // Calculate where existing translation ends
  const coverage = calculateSubtitleTimeCoverage(existingSubtitles);
  const videoDuration = getVideoDuration();
  
  if (!videoDuration) {
    showNotification('خطا: مدت زمان ویدیو قابل تشخیص نیست');
    resetRefreshButton();
    return;
  }
  
  // Check if translation is already complete
  if (coverage.endTime >= videoDuration - 30) { // 30 seconds tolerance
    showNotification('ترجمه این ویدیو قبلاً تکمیل شده است');
    resetRefreshButton();
    return;
  }
  
  console.log(`[REFRESH] Existing translation covers ${coverage.startTime}s to ${coverage.endTime}s`);
  console.log(`[REFRESH] Video duration: ${videoDuration}s`);
  console.log(`[REFRESH] Will translate from ${coverage.endTime}s to end`);
  
  // Store the total number of original subtitles for progress calculation
  try {
    const allSubtitles = await extractYouTubeSubtitles(currentVideoId);
    if (allSubtitles && allSubtitles.length > 0) {
      const originalSubtitlesKey = `original_subtitles_count_${currentVideoId}`;
      localStorage.setItem(originalSubtitlesKey, allSubtitles.length.toString());
      console.log(`[REFRESH] Stored total subtitle count: ${allSubtitles.length}`);
    }
  } catch (error) {
    console.warn('[REFRESH] Could not extract subtitles for total count:', error);
  }
  
  // Set time range to continue from where existing translation ends
  localStorage.setItem('translationStartTime', Math.floor(coverage.endTime).toString());
  localStorage.setItem('translationEndTime', '0'); // 0 means to the end
  
  showNotification(`ادامه ترجمه از ${Math.floor(coverage.endTime / 60)}:${Math.floor(coverage.endTime % 60).toString().padStart(2, '0')}`);
  
  // Start translation from the end point
  translateSubtitlesWithOpenRouter();
}

// Reset refresh button to normal state
function resetRefreshButton() {
  // Clear translation in progress flag
  isTranslationInProgress = false;
  
  const refreshButton = document.getElementById('subtitle-refresh-button');
  if (refreshButton) {
    refreshButton.disabled = false;
    refreshButton.textContent = 'دریافت ادامه زیرنویس';
    refreshButton.style.opacity = '1';
    refreshButton.style.cursor = 'pointer';
  }
}

function filterSubtitlesByTimeRange(subtitles) {
  console.log('[FILTER] Filtering subtitles by time range');
  
  if (!subtitles || subtitles.length === 0) {
    console.log('[FILTER] No subtitles to filter');
    return [];
  }
  
  // Get time range settings
  const startTimeStr = localStorage.getItem('translationStartTime') || '';
  const endTimeStr = localStorage.getItem('translationEndTime') || '';
  
  // If no time range is set, return all subtitles
  if (!startTimeStr && !endTimeStr) {
    console.log('[FILTER] No time range set, returning all subtitles');
    return subtitles;
  }
  
  let startSeconds = 0;
  let endSeconds = Infinity;
  
  // Parse start time
  if (startTimeStr) {
    if (startTimeStr.includes(':')) {
      startSeconds = parseTimeToSeconds(startTimeStr);
    } else {
      startSeconds = parseInt(startTimeStr) || 0;
    }
  }
  
  // Parse end time
  if (endTimeStr) {
    if (endTimeStr.includes(':')) {
      endSeconds = parseTimeToSeconds(endTimeStr);
    } else {
      endSeconds = parseInt(endTimeStr) || Infinity;
    }
  }
  
  // If both are 0, return all subtitles
  if (startSeconds === 0 && endSeconds === 0) {
    console.log('[FILTER] Both start and end are 0, returning all subtitles');
    return subtitles;
  }
  
  // If end is 0 but start is set, translate from start to end of video
  if (endSeconds === 0 && startSeconds > 0) {
    endSeconds = Infinity;
    console.log(`[FILTER] End time is 0, translating from ${startSeconds}s to end of video`);
  }
  
  // Filter subtitles based on time range
  const filteredSubtitles = subtitles.filter(subtitle => {
    // Check if subtitle overlaps with the specified time range
    const subtitleStart = subtitle.startTime;
    const subtitleEnd = subtitle.endTime;
    
    // Subtitle overlaps if:
    // - It starts before the end time AND
    // - It ends after the start time
    const overlaps = subtitleStart < endSeconds && subtitleEnd > startSeconds;
    
    return overlaps;
  });
  
  console.log(`[FILTER] Filtered ${subtitles.length} subtitles to ${filteredSubtitles.length} based on time range ${startSeconds}s-${endSeconds}s`);
  
  return filteredSubtitles;
}

function extractYouTubeSubtitles(videoId) {
  console.log('[EXTRACT] Extracting YouTube subtitles for video:', videoId);
  
  return new Promise(async (resolve, reject) => {
    try {
      // Method 0: Try new .NET API first (SRT format)
      console.log('[EXTRACT] Method 0: Trying .NET API...');
      try {
        const response = await fetch('https://getsub.bot724.top/fetchCaption', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: `https://www.youtube.com/watch?v=${videoId}`
        });
        
        if (response.ok) {
          const srtContent = await response.text();
          console.log('[EXTRACT] API response length:', srtContent.length);
          
          if (srtContent && srtContent.trim().length > 0) {
            const apiSubtitles = parseSrtToSubtitles(srtContent);
            if (apiSubtitles && apiSubtitles.length > 0) {
              console.log(`[EXTRACT] ✅ API Success: ${apiSubtitles.length} subtitles`);
              resolve(apiSubtitles);
              return;
            }
          }
        }
        console.log('[EXTRACT] API failed or returned empty content');
      } catch (apiError) {
        console.log('[EXTRACT] API Error:', apiError.message);
      }

      // If API failed, show error message instead of using fallback methods
      console.error('[EXTRACT] API extraction failed');
      showNotification('استخراج زیرنویس فعلا امکانپذیر نیست');
      reject(new Error('استخراج زیرنویس فعلا امکانپذیر نیست'));
      
      /*
      // Method 1: Try to get subtitles from YouTube's internal API
      const subtitles = await tryExtractFromYouTubeAPI(videoId);
      if (subtitles && subtitles.length > 0) {
        console.log(`[EXTRACT] Successfully extracted ${subtitles.length} subtitles from YouTube API`);
        resolve(subtitles);
        return;
      }
      
      // Method 2: Try to get caption tracks info and fetch them
      const captionSubtitles = await tryExtractFromCaptionTracks(videoId);
      if (captionSubtitles && captionSubtitles.length > 0) {
        console.log(`[EXTRACT] Successfully extracted ${captionSubtitles.length} subtitles from caption tracks`);
        resolve(captionSubtitles);
        return;
      }
      
      // Method 3: Try to extract from video page
      const pageSubtitles = await tryExtractFromVideoPage();
      if (pageSubtitles && pageSubtitles.length > 0) {
        console.log(`[EXTRACT] Successfully extracted ${pageSubtitles.length} subtitles from video page`);
        resolve(pageSubtitles);
        return;
      }
      
      // Method 4: Try to get from YouTube's timedtext API
      const timedTextSubtitles = await tryExtractFromTimedTextAPI(videoId);
      if (timedTextSubtitles && timedTextSubtitles.length > 0) {
        console.log(`[EXTRACT] Successfully extracted ${timedTextSubtitles.length} subtitles from TimedText API`);
        resolve(timedTextSubtitles);
        return;
      }
      
      // Method 5: Create sample subtitles as fallback for testing
      console.log('[EXTRACT] No subtitles found, creating sample subtitles for testing...');
      const sampleSubtitles = createSampleSubtitles();
      if (sampleSubtitles && sampleSubtitles.length > 0) {
        console.log(`[EXTRACT] Created ${sampleSubtitles.length} sample subtitles for testing`);
        showNotification('زیرنویس یافت نشد - از زیرنویس نمونه استفاده می‌شود');
        resolve(sampleSubtitles);
        return;
      }
      
      // If all methods fail
      console.error('[EXTRACT] All subtitle extraction methods failed');
      reject(new Error('No subtitles found for this video. The video may not have subtitles or they may be disabled.'));
      */
      
    } catch (error) {
      console.error('[EXTRACT] Error during subtitle extraction:', error);
      reject(error);
    }
  });
}

// Try to extract from caption tracks info
async function tryExtractFromCaptionTracks(videoId) {
  try {
    console.log('[EXTRACT] Trying to extract from caption tracks...');
    
    // Look for caption tracks in various places
    const captionSources = [
      () => window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks,
      () => window.ytplayer?.config?.args?.player_response ? JSON.parse(window.ytplayer.config.args.player_response)?.captions?.playerCaptionsTracklistRenderer?.captionTracks : null,
      () => {
        // Try to find in page data
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent;
          if (content.includes('captionTracks')) {
            const match = content.match(/"captionTracks"\s*:\s*(\[.*?\])/);
            if (match) {
              try {
                return JSON.parse(match[1]);
              } catch (e) {
                continue;
              }
            }
          }
        }
        return null;
      }
    ];
    
    let captionTracks = null;
    for (const source of captionSources) {
      try {
        captionTracks = source();
        if (captionTracks && captionTracks.length > 0) {
          console.log(`[EXTRACT] Found ${captionTracks.length} caption tracks`);
          break;
              }
            } catch (e) {
        continue;
      }
    }
    
    if (!captionTracks || captionTracks.length === 0) {
      console.log('[EXTRACT] No caption tracks found');
  return null;
}
  
    // Find the best track
    let bestTrack = captionTracks.find(track => 
      track.languageCode === 'en' || track.languageCode === 'en-US'
    );
    
    if (!bestTrack) {
      bestTrack = captionTracks.find(track => track.kind === 'asr');
    }
    
    if (!bestTrack) {
      bestTrack = captionTracks[0];
    }
    
    if (!bestTrack || !bestTrack.baseUrl) {
      console.log('[EXTRACT] No valid caption track found');
  return null;
}

    console.log('[EXTRACT] Using caption track:', bestTrack.name?.simpleText || bestTrack.languageCode);
    
    // Fetch the captions
    try {
      const response = await fetch(bestTrack.baseUrl);
      if (!response.ok) {
        console.error('[EXTRACT] Failed to fetch captions:', response.status);
        return null;
      }
      
      const xmlText = await response.text();
      console.log('[EXTRACT] Fetched caption XML, length:', xmlText.length);
      
      // Parse XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const textElements = xmlDoc.getElementsByTagName('text');
      
      if (textElements.length === 0) {
        console.log('[EXTRACT] No text elements in caption XML');
        return null;
      }
      
      const subtitles = [];
      for (let i = 0; i < textElements.length; i++) {
        const element = textElements[i];
        const start = parseFloat(element.getAttribute('start') || '0');
        const duration = parseFloat(element.getAttribute('dur') || '3');
        const text = element.textContent || '';
        
        if (text.trim()) {
          const cleanText = text
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .trim();
          
          if (cleanText) {
            subtitles.push({
              startTime: start,
              endTime: start + duration,
              duration: duration,
              text: cleanText
            });
          }
        }
      }
      
      return subtitles.length > 0 ? subtitles : null;
      
    } catch (fetchError) {
      console.error('[EXTRACT] Error fetching caption track:', fetchError);
      return null;
    }
    
  } catch (error) {
    console.error('[EXTRACT] Error in tryExtractFromCaptionTracks:', error);
    return null;
  }
}

// Try to extract subtitles from YouTube's internal API
async function tryExtractFromYouTubeAPI(videoId) {
  try {
    console.log('[EXTRACT] Trying YouTube internal API...');
    
    // Method 1: Look for ytInitialPlayerResponse in window object
    if (window.ytInitialPlayerResponse) {
      console.log('[EXTRACT] Found ytInitialPlayerResponse in window object');
      const playerResponse = window.ytInitialPlayerResponse;
      const subtitles = await extractFromPlayerResponse(playerResponse);
      if (subtitles && subtitles.length > 0) {
        return subtitles;
      }
    }
    
    // Method 2: Look for subtitle tracks in the page scripts
    const scripts = document.querySelectorAll('script');
    let playerResponse = null;
    
    for (const script of scripts) {
      const content = script.textContent || script.innerText;
      
      // Try different patterns to find playerResponse
      const patterns = [
        /var\s+ytInitialPlayerResponse\s*=\s*({.+?});/,
        /window\["ytInitialPlayerResponse"\]\s*=\s*({.+?});/,
        /ytInitialPlayerResponse\s*=\s*({.+?});/,
        /"playerResponse"\s*:\s*({.+?})(?=,|\})/,
        /playerResponse["']\s*:\s*({.+?})(?=,|\})/
      ];
      
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches && matches[1]) {
          try {
            playerResponse = JSON.parse(matches[1]);
            console.log('[EXTRACT] Found playerResponse using pattern:', pattern.source);
            break;
          } catch (e) {
            console.log('[EXTRACT] Failed to parse playerResponse from pattern:', pattern.source);
            continue;
          }
        }
      }
      
      if (playerResponse) break;
    }
    
    if (!playerResponse) {
      console.log('[EXTRACT] Could not find playerResponse in page scripts');
      return null;
    }
    
    return await extractFromPlayerResponse(playerResponse);
    
    } catch (error) {
    console.error('[EXTRACT] Error in tryExtractFromYouTubeAPI:', error);
    return null;
  }
}

// Extract subtitles from playerResponse object
async function extractFromPlayerResponse(playerResponse) {
  try {
    console.log('[EXTRACT] Extracting from playerResponse...');
    
    // Extract captions from player response
    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captions || captions.length === 0) {
      console.log('[EXTRACT] No caption tracks found in playerResponse');
      return null;
    }
    
    console.log(`[EXTRACT] Found ${captions.length} caption tracks`);
    
    // Find the best caption track (prefer English, then auto-generated, then any)
    let captionTrack = null;
    
    // Priority 1: English captions
    captionTrack = captions.find(track => 
      track.languageCode === 'en' || 
      track.languageCode === 'en-US' ||
      track.languageCode === 'en-GB'
    );
    
    // Priority 2: Auto-generated captions
    if (!captionTrack) {
      captionTrack = captions.find(track => track.kind === 'asr');
    }
    
    // Priority 3: Any available caption
    if (!captionTrack) {
      captionTrack = captions[0];
    }
    
    if (!captionTrack || !captionTrack.baseUrl) {
      console.log('[EXTRACT] No valid caption track with baseUrl found');
      return null;
    }
    
    console.log('[EXTRACT] Using caption track:', captionTrack.name?.simpleText || captionTrack.languageCode);
    
    // Fetch the subtitle XML
    const response = await fetch(captionTrack.baseUrl);
    if (!response.ok) {
      console.error('[EXTRACT] Failed to fetch subtitle XML:', response.status);
      return null;
    }
    
    const xmlText = await response.text();
    console.log('[EXTRACT] Fetched subtitle XML, length:', xmlText.length);
    
    // Parse the XML to extract subtitles
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const textElements = xmlDoc.getElementsByTagName('text');
    
    if (textElements.length === 0) {
      console.log('[EXTRACT] No text elements found in subtitle XML');
      return null;
    }
    
    const subtitles = [];
    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i];
      const start = parseFloat(element.getAttribute('start') || '0');
      const duration = parseFloat(element.getAttribute('dur') || '3');
      const text = element.textContent || '';
      
      if (text.trim()) {
        // Clean up the text (remove HTML tags, decode entities)
        const cleanText = text
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .trim();
        
        if (cleanText) {
      subtitles.push({
            startTime: start,
            endTime: start + duration,
            duration: duration,
            text: cleanText
          });
        }
      }
    }
    
    console.log(`[EXTRACT] Successfully extracted ${subtitles.length} subtitles`);
    return subtitles;
    
  } catch (error) {
    console.error('[EXTRACT] Error in extractFromPlayerResponse:', error);
    return null;
  }
}

// Try to extract subtitles from video page elements
async function tryExtractFromVideoPage() {
  try {
    console.log('[EXTRACT] Trying to extract from video page elements...');
    
    // Method 1: Try to find and click subtitle button to load subtitles
    const subtitleButton = document.querySelector('.ytp-subtitles-button, .ytp-cc-button');
    if (subtitleButton && !subtitleButton.classList.contains('ytp-button-active')) {
      console.log('[EXTRACT] Found subtitle button, clicking to enable subtitles...');
      subtitleButton.click();
      
      // Wait a bit for subtitles to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Method 2: Look for subtitle elements that might be already loaded
    const subtitleSelectors = [
      '.ytp-caption-segment',
      '.captions-text',
      '.caption-line',
      '.ytp-caption-window-container .ytp-caption-segment',
      '.html5-captions-text',
      '.caption-window .caption-text'
    ];
    
    let subtitleElements = [];
    for (const selector of subtitleSelectors) {
      subtitleElements = document.querySelectorAll(selector);
      if (subtitleElements.length > 0) {
        console.log(`[EXTRACT] Found ${subtitleElements.length} subtitle elements using selector: ${selector}`);
        break;
      }
    }
    
    if (subtitleElements.length === 0) {
      console.log('[EXTRACT] No subtitle elements found on page');
      
      // Method 3: Try to extract from video player's internal state
      const video = document.querySelector('video');
      if (video && video.textTracks && video.textTracks.length > 0) {
        console.log(`[EXTRACT] Found ${video.textTracks.length} text tracks in video element`);
        
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          if (track.kind === 'subtitles' || track.kind === 'captions') {
            console.log(`[EXTRACT] Found ${track.kind} track:`, track.label || track.language);
            
            // Enable the track
            track.mode = 'showing';
            
            // Wait for cues to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (track.cues && track.cues.length > 0) {
              const subtitles = [];
              for (let j = 0; j < track.cues.length; j++) {
                const cue = track.cues[j];
                if (cue.text && cue.text.trim()) {
                  subtitles.push({
                    startTime: cue.startTime,
                    endTime: cue.endTime,
                    duration: cue.endTime - cue.startTime,
                    text: cue.text.replace(/<[^>]*>/g, '').trim()
                  });
                }
              }
              
              if (subtitles.length > 0) {
                console.log(`[EXTRACT] Extracted ${subtitles.length} subtitles from text track`);
                return subtitles;
              }
            }
          }
        }
      }
      
      return null;
    }
    
    // Method 4: Extract from found subtitle elements
    const subtitles = [];
    let currentTime = 0;
    
    subtitleElements.forEach((element, index) => {
      const text = element.textContent || element.innerText;
      if (text && text.trim()) {
        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        if (cleanText) {
          subtitles.push({
            startTime: currentTime,
            endTime: currentTime + 3, // Default 3 second duration
            duration: 3,
            text: cleanText
          });
          currentTime += 3;
        }
      }
    });
    
    if (subtitles.length > 0) {
      console.log(`[EXTRACT] Extracted ${subtitles.length} subtitles from page elements`);
      return subtitles;
    }
    
    return null;
    
  } catch (error) {
    console.error('[EXTRACT] Error in tryExtractFromVideoPage:', error);
    return null;
  }
}

// Try to extract from YouTube's TimedText API
async function tryExtractFromTimedTextAPI(videoId) {
  try {
    console.log('[EXTRACT] Trying TimedText API...');
    
    // Try different URL formats and language codes
    const urlFormats = [
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=vtt`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&fmt=vtt`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=ttml`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&asr_langs=en&caps=asr&exp=xfm&xorp=true&xoaf=5&hl=en&ip=0.0.0.0&ipbits=0&expire=19000000000&sparams=ip,ipbits,expire,v,asr_langs,caps,exp,xoaf&signature=dummy&key=yttt1&lang=en&fmt=srv3`,
      // Try auto-generated captions
      `https://www.youtube.com/api/timedtext?v=${videoId}&kind=asr&lang=en&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&kind=asr&lang=en-US&fmt=srv3`
    ];
    
    for (const url of urlFormats) {
      try {
        console.log('[EXTRACT] Trying URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const xmlText = await response.text();
          console.log('[EXTRACT] Received response, length:', xmlText.length);
          
          if (xmlText && xmlText.trim() && !xmlText.includes('error') && !xmlText.includes('not found')) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const textElements = xmlDoc.getElementsByTagName('text');
    
            if (textElements.length > 0) {
    const subtitles = [];
              for (let i = 0; i < textElements.length; i++) {
                const element = textElements[i];
                const start = parseFloat(element.getAttribute('start') || '0');
                const duration = parseFloat(element.getAttribute('dur') || '3');
                const text = element.textContent || '';
                
                if (text.trim()) {
                  const cleanText = text
                    .replace(/<[^>]*>/g, '')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&apos;/g, "'")
                    .replace(/&#39;/g, "'")
                    .replace(/&nbsp;/g, ' ')
                    .trim();
                  
                  if (cleanText) {
      subtitles.push({
                      startTime: start,
                      endTime: start + duration,
                      duration: duration,
                      text: cleanText
                    });
                  }
                }
              }
              
              if (subtitles.length > 0) {
                console.log(`[EXTRACT] Successfully extracted ${subtitles.length} subtitles from TimedText API`);
    return subtitles;
              }
            }
          }
        } else {
          console.log(`[EXTRACT] TimedText API returned ${response.status} for URL:`, url);
        }
      } catch (urlError) {
        console.log(`[EXTRACT] Failed to fetch from URL ${url}:`, urlError.message);
        continue;
      }
    }
    
    console.log('[EXTRACT] All TimedText API attempts failed');
    return null;
    
  } catch (error) {
    console.error('[EXTRACT] Error in tryExtractFromTimedTextAPI:', error);
    return null;
  }
}

// Convert subtitles to SRT format instead of XML
function convertSubtitlesToSrt(subtitles) {
  console.log('[CONVERT] Converting subtitles to SRT format');
  
  if (!subtitles || subtitles.length === 0) {
    console.warn('[CONVERT] No subtitles to convert');
    return '';
  }
  
  let srt = '';
  
  subtitles.forEach((subtitle, index) => {
    const startTime = formatSecondsToSrtTime(subtitle.startTime);
    const endTime = formatSecondsToSrtTime(subtitle.endTime);
    
    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${subtitle.text}\n\n`;
  });
  
  console.log(`[CONVERT] Converted ${subtitles.length} subtitles to SRT`);
  return srt.trim();
}

// Helper function to format seconds to SRT time format
function formatSecondsToSrtTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

// Translate with OpenRouter API - Updated for SRT
async function translateWithOpenRouter(srt) {
  console.log('[TRANSLATE] Translating with OpenRouter API (SRT format)');
  
  return new Promise(async (resolve, reject) => {
    try {
      // Get API key and model from settings
      const apiKey = localStorage.getItem('openrouter_api_key');
      const model = localStorage.getItem('openrouter_model') || 'anthropic/claude-3.5-sonnet';
      
      if (!apiKey) {
        reject(new Error('OpenRouter API key not found. Please set it in settings.'));
        return;
      }
      
      // Get time range info for context
      const startTime = localStorage.getItem('translationStartTime') || '';
      const endTime = localStorage.getItem('translationEndTime') || '';
      let timeRangeInfo = '';
      
      if (startTime || endTime) {
        const startDisplay = startTime ? `${startTime}s` : '0s';
        const endDisplay = endTime ? `${endTime}s` : 'end';
        timeRangeInfo = `\n\nNote: This is a time range from ${startDisplay} to ${endDisplay} of the video.`;
      }
      
      // Updated prompt for SRT format
      const customPrompt = getTranslationPrompt();
      const srtPrompt = customPrompt.replace(/XML/g, 'SRT').replace(/xml/g, 'srt');
      const prompt = `${srtPrompt}\n\nSRT to translate:\n${srt}${timeRangeInfo}`;
      
      console.log('[TRANSLATE] Using SRT prompt');
      console.log('[TRANSLATE] API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
      console.log('[TRANSLATE] Prompt length:', prompt.length);
      
      // Make request to OpenRouter API
      const requestBody = {
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8192,
        top_p: 0.95
      };
      
      console.log('[TRANSLATE] Sending request to OpenRouter API...');
  
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'YouTube Subtitle Translator'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('[TRANSLATE] Response status:', response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TRANSLATE] OpenRouter API error response:', errorText);
        reject(new Error(`OpenRouter API error: ${response.status} - ${errorText}`));
        return;
      }
  
      const data = await response.json();
      console.log('[TRANSLATE] ==================== OPENROUTER RESPONSE ====================');
      
      if (!data.choices || data.choices.length === 0) {
        console.error('[TRANSLATE] No choices in OpenRouter response:', data);
        reject(new Error('No translation choices received from OpenRouter'));
        return;
      }
      
      const translatedText = data.choices[0]?.message?.content;
      
      if (!translatedText) {
        console.error('[TRANSLATE] No translated text in OpenRouter response:', data);
        reject(new Error('No translated text received from OpenRouter'));
        return;
      }
      
      console.log('[TRANSLATE] Translation completed successfully');
      console.log('[TRANSLATE] Translated text length:', translatedText.length);
      console.log('[TRANSLATE] ========================================================');
      
      resolve(translatedText);
      
    } catch (error) {
      console.error('[TRANSLATE] Error in translateWithOpenRouter:', error);
      reject(error);
    }
  });
}

// Parse translated SRT response
function parseTranslatedSrt(srtText) {
  console.log('[PARSE] Parsing translated SRT to subtitle objects');
  
  if (!srtText || srtText.trim() === '') {
    console.warn('[PARSE] Empty SRT provided');
    return [];
  }
  
  try {
    // Clean up the SRT if it contains extra text
    let cleanSrt = srtText;
    
    // Try to extract SRT content from response if it's wrapped in other text
    const srtMatch = srtText.match(/(\d+\s*\n[0-9:,\s\-\>]+\n[\s\S]*?)(?=\n\d+\s*\n[0-9:,\s\-\>]+\n|\n*$)/g);
    if (srtMatch && srtMatch.length > 0) {
      cleanSrt = srtMatch.join('\n\n');
    }
    
    return parseSrtToSubtitles(cleanSrt);
    
  } catch (error) {
    console.error('[PARSE] Error parsing translated SRT:', error);
    
    // Fallback: try to extract text using regex
    try {
      console.log('[PARSE] Attempting regex fallback parsing...');
      const subtitleBlocks = srtText.split(/\n\s*\n/);
      const subtitles = [];
      
      subtitleBlocks.forEach((block, index) => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
          const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
          if (timeMatch) {
            const startTime = srtTimeStringToSeconds(timeMatch[1]);
            const endTime = srtTimeStringToSeconds(timeMatch[2]);
            const text = lines.slice(2).join('\n').trim();
            
            if (text) {
              subtitles.push({
                startTime: startTime,
                endTime: endTime,
                duration: endTime - startTime,
                text: text
              });
            }
          }
        }
      });
      
      console.log(`[PARSE] Regex fallback extracted ${subtitles.length} subtitles`);
      return subtitles;
    } catch (regexError) {
      console.error('[PARSE] Regex fallback also failed:', regexError);
    }
    
    return [];
  }
}

function translateWithGemini(xml) {
  console.log('[TRANSLATE] Translating with Gemini API');
  
  return new Promise(async (resolve, reject) => {
    try {
      // Get API key
      const apiKey = localStorage.getItem('geminiApiKey') ;
      
      if (!apiKey) {
        reject(new Error('Gemini API key not found'));
        return;
      }
      
      // Get time range info for context
      const startTime = localStorage.getItem('translationStartTime') || '';
      const endTime = localStorage.getItem('translationEndTime') || '';
      let timeRangeInfo = '';
      
      if (startTime || endTime) {
        const startDisplay = startTime ? `${startTime}s` : '0s';
        const endDisplay = endTime ? `${endTime}s` : 'end';
        timeRangeInfo = `\n\nNote: This is a time range from ${startDisplay} to ${endDisplay} of the video.`;
      }
      
      // Prepare the prompt
      const prompt = getTranslationPrompt() + `\n\nXML to translate:\n${xml}`;
      
      console.log('[TRANSLATE] ==================== GEMINI REQUEST ====================');
      console.log('[TRANSLATE] API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
      console.log('[TRANSLATE] Prompt length:', prompt.length);
      console.log('[TRANSLATE] Complete prompt being sent:');
      console.log('-----------------------------------------------------------');
      console.log(prompt);
      console.log('-----------------------------------------------------------');
      
      // Make request to Gemini API
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      };
      
      console.log('[TRANSLATE] Request body:', JSON.stringify(requestBody, null, 2));
      console.log('[TRANSLATE] Sending request to Gemini API...');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('[TRANSLATE] Response status:', response.status);
      console.log('[TRANSLATE] Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
        const errorText = await response.text();
        console.error('[TRANSLATE] Gemini API error response:', errorText);
        reject(new Error(`Gemini API error: ${response.status} - ${errorText}`));
        return;
  }
  
  const data = await response.json();
      console.log('[TRANSLATE] ==================== GEMINI RESPONSE ====================');
      console.log('[TRANSLATE] Full response data:', JSON.stringify(data, null, 2));
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('[TRANSLATE] No candidates in Gemini response:', data);
        reject(new Error('No translation candidates received from Gemini'));
        return;
      }
      
      const translatedText = data.candidates[0]?.content?.parts?.[0]?.text;
      
      if (!translatedText) {
        console.error('[TRANSLATE] No translated text in Gemini response:', data);
        reject(new Error('No translated text received from Gemini'));
        return;
      }
      
      console.log('[TRANSLATE] Translation completed successfully');
      console.log('[TRANSLATE] Translated text length:', translatedText.length);
      console.log('[TRANSLATE] Translated text preview (first 500 chars):');
      console.log(translatedText.substring(0, 500) + (translatedText.length > 500 ? '...' : ''));
      console.log('[TRANSLATE] ========================================================');
      
      resolve(translatedText);
      
    } catch (error) {
      console.error('[TRANSLATE] Error in translateWithGemini:', error);
      reject(error);
    }
  });
}

function parseTranslatedXml(xml) {
  console.log('[PARSE] Parsing translated XML to subtitle objects');
  
  if (!xml || xml.trim() === '') {
    console.warn('[PARSE] Empty XML provided');
    return [];
  }
  
  try {
    // Clean up the XML if it contains extra text
    let cleanXml = xml;
    
    // Try to extract XML from response if it's wrapped in other text
    const xmlMatch = xml.match(/<\?xml[\s\S]*?<\/transcript>/i) || xml.match(/<transcript[\s\S]*?<\/transcript>/i);
    if (xmlMatch) {
      cleanXml = xmlMatch[0];
    }
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(cleanXml, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('[PARSE] XML parsing error:', parserError.textContent);
      return [];
    }
    
    // Extract text elements
    const textElements = xmlDoc.getElementsByTagName('text');
    const subtitles = [];
    
    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i];
      const startTime = parseFloat(element.getAttribute('start') || '0');
      const duration = parseFloat(element.getAttribute('dur') || '3');
      const endTime = parseFloat(element.getAttribute('end') || (startTime + duration));
      const text = element.textContent || element.innerText || '';
      
      if (text.trim()) {
        subtitles.push({
          startTime: startTime,
          endTime: endTime,
          duration: duration,
          text: text.trim()
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
        });
      }
    }
    
    console.log(`[PARSE] Successfully parsed ${subtitles.length} subtitles from XML`);
    return subtitles;
    
  } catch (error) {
    console.error('[PARSE] Error parsing translated XML:', error);
    
    // Fallback: try to extract text using regex
    try {
      console.log('[PARSE] Attempting regex fallback parsing...');
      const textMatches = xml.match(/<text[^>]*>(.*?)<\/text>/gi);
      
      if (textMatches && textMatches.length > 0) {
        const subtitles = [];
        let currentTime = 0;
        
        textMatches.forEach((match, index) => {
          const textContent = match.replace(/<[^>]*>/g, '').trim();
          if (textContent) {
            subtitles.push({
              startTime: currentTime,
              endTime: currentTime + 3,
              duration: 3,
              text: textContent
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
            });
            currentTime += 3;
          }
        });
        
        console.log(`[PARSE] Regex fallback extracted ${subtitles.length} subtitles`);
        return subtitles;
      }
    } catch (regexError) {
      console.error('[PARSE] Regex fallback also failed:', regexError);
    }
    
    return [];
  }
}

function directTranslateSubtitlesGemini(xml, nodes, apiKey) {
  console.log('[DIRECT] Direct translate with Gemini');
  return Promise.resolve('<xml></xml>');
}

function createSubtitleOverlay() {
  console.log('[OVERLAY] Creating subtitle overlay');
  
  // Remove any existing overlay first
  removeExistingOverlay();
  
  // Find the video container
  const videoContainer = findYouTubeVideoContainer();
    if (!videoContainer) {
    console.error('[OVERLAY] Could not find video container for subtitle overlay');
      return;
    }
    
  // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'subtitle-overlay';
  overlay.id = 'subtitle-overlay';
  
  // Create subtitle context container (for previous, current, next)
  const contextContainer = document.createElement('div');
  contextContainer.className = 'subtitle-context';
  contextContainer.id = 'subtitle-context';
  
  // Create previous subtitle element
  const previousSubtitle = document.createElement('div');
  previousSubtitle.className = 'subtitle-previous';
  previousSubtitle.id = 'subtitle-previous';
  previousSubtitle.style.display = 'none';
  
  // Create current subtitle element
  const currentSubtitle = document.createElement('div');
  currentSubtitle.className = 'subtitle-text';
  currentSubtitle.id = 'subtitle-current';
  currentSubtitle.style.display = 'none';
  
  // Create next subtitle element
  const nextSubtitle = document.createElement('div');
  nextSubtitle.className = 'subtitle-next';
  nextSubtitle.id = 'subtitle-next';
  nextSubtitle.style.display = 'none';
  
  // Add elements to context container
  contextContainer.appendChild(previousSubtitle);
  contextContainer.appendChild(currentSubtitle);
  contextContainer.appendChild(nextSubtitle);
  
  // Add context container to overlay
  overlay.appendChild(contextContainer);
  
  // Position the overlay
  const verticalPosition = subtitleVerticalPosition || 80;
  overlay.style.bottom = `${verticalPosition}px`;
  
  // Add to video container
    videoContainer.appendChild(overlay);
    
  console.log('[OVERLAY] Subtitle overlay created successfully');
  return overlay;
}

function removeExistingOverlay() {
  console.log('[OVERLAY] Removing existing overlay');
  
  const existingOverlay = document.getElementById('subtitle-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
    console.log('[OVERLAY] Existing overlay removed');
  }
  
  // Don't remove original subtitle overlay here - let it be managed independently
  // removeOriginalSubtitleOverlay();
}

function startSubtitleUpdates() {
  console.log('[UPDATES] Starting subtitle updates');
  
  // Stop any existing interval
  if (subtitleUpdateInterval) {
    clearInterval(subtitleUpdateInterval);
  }
  
  // Start new interval to update subtitles every 100ms
  subtitleUpdateInterval = setInterval(() => {
    updateCurrentSubtitle();
  }, 100);
  
  console.log('[UPDATES] Subtitle update interval started');
}

function stopSubtitleUpdates() {
  console.log('[UPDATES] Stopping subtitle updates');
  
  if (subtitleUpdateInterval) {
    clearInterval(subtitleUpdateInterval);
    subtitleUpdateInterval = null;
    console.log('[UPDATES] Subtitle update interval stopped');
  }
}

function updateCurrentSubtitle() {
    try {
      // Get current video time
      const video = document.querySelector('video');
    if (!video) {
      return;
    }
      
      const currentTime = video.currentTime;
      
    // Find current subtitle and context
    const subtitleContext = findCurrentSubtitle(currentTime);
    
    // Get subtitle elements
    const previousElement = document.getElementById('subtitle-previous');
    const currentElement = document.getElementById('subtitle-current');
    const nextElement = document.getElementById('subtitle-next');
    
    if (!previousElement || !currentElement || !nextElement) {
      return;
    }
    
    // Update previous subtitle
    if (subtitleContext.previous && showPreviousNextSubtitles) {
      previousElement.textContent = subtitleContext.previous.text;
      previousElement.style.display = 'block';
  } else {
      previousElement.style.display = 'none';
    }
    
    // Update current subtitle
    if (subtitleContext.current) {
      currentElement.textContent = subtitleContext.current.text;
      currentElement.style.display = 'block';
    } else if (subtitleContext.upcoming) {
      // Show upcoming subtitle with prefix
      currentElement.textContent = 'قریب: ' + subtitleContext.upcoming.text;
      currentElement.style.display = 'block';
      currentElement.style.opacity = '0.6';
    } else {
      currentElement.style.display = 'none';
      currentElement.style.opacity = '1';
    }
    
    // Update next subtitle
    if (subtitleContext.next && showPreviousNextSubtitles) {
      nextElement.textContent = subtitleContext.next.text;
      nextElement.style.display = 'block';
} else {
      nextElement.style.display = 'none';
    }
    
    // Update original subtitle overlay if enabled
    if (showOriginalLanguage) {
      updateOriginalSubtitleContent();
    }
    
  } catch (error) {
    console.error('[UPDATES] Error updating current subtitle:', error);
  }
}

function findCurrentSubtitle(currentTime) {
  if (!translatedSubtitles || translatedSubtitles.length === 0) {
    return { previous: null, current: null, next: null, upcoming: null };
  }
  
  // Apply time offset and multiplier
  const adjustedTime = (currentTime + subtitleTimeOffset) * subtitleTimeMultiplier;
  
  let currentIndex = -1;
  
  // Find current subtitle
  for (let i = 0; i < translatedSubtitles.length; i++) {
    const subtitle = translatedSubtitles[i];
    if (adjustedTime >= subtitle.startTime && adjustedTime <= subtitle.endTime) {
      currentIndex = i;
      break;
    }
  }
  
  let previous = null;
  let current = null;
  let next = null;
  let upcoming = null;
  
  if (currentIndex >= 0) {
    // We have a current subtitle
    current = translatedSubtitles[currentIndex];
    
    if (currentIndex > 0) {
      previous = translatedSubtitles[currentIndex - 1];
    }
    
    if (currentIndex < translatedSubtitles.length - 1) {
      next = translatedSubtitles[currentIndex + 1];
    }
  } else {
    // No current subtitle, find upcoming one
    upcoming = findUpcomingSubtitle(adjustedTime);
    
    // Find the subtitle that would be previous to the upcoming one
    if (upcoming) {
      const upcomingIndex = translatedSubtitles.indexOf(upcoming);
      if (upcomingIndex > 0) {
        previous = translatedSubtitles[upcomingIndex - 1];
      }
    }
  }
  
  return { previous, current, next, upcoming };
}

function findUpcomingSubtitle(currentTime) {
  if (!translatedSubtitles || translatedSubtitles.length === 0) {
    return null;
  }
  
  // Find the next subtitle that will start after current time
  for (let i = 0; i < translatedSubtitles.length; i++) {
    const subtitle = translatedSubtitles[i];
    if (subtitle.startTime > currentTime) {
      return subtitle;
    }
  }
  
  return null;
}

// Create sample subtitles for testing when no real subtitles are found
function createSampleSubtitles() {
  console.log('[SAMPLE] Creating sample subtitles for testing...');
  
  const sampleTexts = [
    "Welcome to this YouTube video.",
    "Today we're going to learn something new.",
    "This is an example of subtitle translation.",
    "The extension will translate these subtitles to Persian.",
    "You can adjust the timing and synchronization.",
    "This helps test the translation functionality.",
    "Thank you for watching this video.",
    "Don't forget to like and subscribe.",
    "See you in the next video.",
    "Have a great day!"
  ];
  
  const subtitles = [];
  let currentTime = 0;
  
  sampleTexts.forEach((text, index) => {
    const duration = 3 + Math.random() * 2; // 3-5 seconds duration
    subtitles.push({
      startTime: currentTime,
      endTime: currentTime + duration,
      duration: duration,
      text: text
    });
    currentTime += duration + 0.5; // Small gap between subtitles
  });
  
  console.log(`[SAMPLE] Created ${subtitles.length} sample subtitles`);
  return subtitles;
}

// Merge new subtitles with existing ones, avoiding duplicates
function mergeSubtitles(existingSubtitles, newSubtitles) {
  console.log(`[MERGE] Merging ${existingSubtitles.length} existing with ${newSubtitles.length} new subtitles`);
  
  if (!existingSubtitles || existingSubtitles.length === 0) {
    console.log('[MERGE] No existing subtitles, returning new subtitles');
    return newSubtitles;
  }
  
  if (!newSubtitles || newSubtitles.length === 0) {
    console.log('[MERGE] No new subtitles, returning existing subtitles');
    return existingSubtitles;
  }
  
  // Create a map of existing subtitles by time range for quick lookup
  const existingMap = new Map();
  existingSubtitles.forEach(sub => {
    const timeKey = `${sub.startTime.toFixed(2)}-${sub.endTime.toFixed(2)}`;
    existingMap.set(timeKey, sub);
  });
  
  // Start with existing subtitles
  const mergedSubtitles = [...existingSubtitles];
  let addedCount = 0;
  let replacedCount = 0;
  
  // Add new subtitles that don't already exist
  newSubtitles.forEach(newSub => {
    const timeKey = `${newSub.startTime.toFixed(2)}-${newSub.endTime.toFixed(2)}`;
    
    if (existingMap.has(timeKey)) {
      // Replace existing subtitle with new one (in case of better translation)
      const existingIndex = mergedSubtitles.findIndex(sub => 
        sub.startTime.toFixed(2) === newSub.startTime.toFixed(2) && 
        sub.endTime.toFixed(2) === newSub.endTime.toFixed(2)
      );
      if (existingIndex !== -1) {
        mergedSubtitles[existingIndex] = newSub;
        replacedCount++;
      }
    } else {
      // Add new subtitle
      mergedSubtitles.push(newSub);
      addedCount++;
    }
  });
  
  // Sort by start time to maintain order
  mergedSubtitles.sort((a, b) => a.startTime - b.startTime);
  
  console.log(`[MERGE] Result: ${mergedSubtitles.length} total subtitles (${addedCount} added, ${replacedCount} replaced)`);
  
  return mergedSubtitles;
}

// Get chunk duration from settings
function getChunkDurationMinutes() {
  const savedDuration = localStorage.getItem('chunkDurationMinutes');
  if (savedDuration) {
    const duration = parseInt(savedDuration);
    // Validate range (1-30 minutes)
    if (duration >= 1 && duration <= 30) {
      return duration;
    }
  }
  // Default to 5 minutes
  return 5;
}

// Helper function to determine which API to use
function getTranslationApiInfo() {
  const apiProvider = localStorage.getItem('api_provider') || 'openrouter';
  const selectedModel = localStorage.getItem('openrouter_model') || 'deepseek/deepseek-chat-v3-0324:free';
  
  if (apiProvider === 'gemini') {
    return {
      api: 'gemini',
      model: 'gemini-2.0-flash',
      displayName: 'Gemini Direct API'
    };
  } else {
    return {
      api: 'openrouter',
      model: selectedModel,
      displayName: 'OpenRouter API'
    };
  }
}

// Load original language display setting
function loadOriginalLanguageSetting() {
  try {
    const saved = localStorage.getItem('showOriginalLanguage');
    console.log('[LOAD_ORIGINAL] Saved value from localStorage:', saved);
    
    if (saved !== null) {
      showOriginalLanguage = saved === 'true';
    } else {
      // If no value is saved, keep the default value (false)
      showOriginalLanguage = false;
    }
    
    console.log('[LOAD_ORIGINAL] Final showOriginalLanguage value:', showOriginalLanguage);
    return showOriginalLanguage;
  } catch (error) {
    console.error('[LOAD_ORIGINAL] Error loading original language setting:', error);
    // If there's an error, clear the problematic value and use default
    try {
      localStorage.removeItem('showOriginalLanguage');
    } catch (clearError) {
      console.error('[LOAD_ORIGINAL] Error clearing localStorage:', clearError);
    }
    showOriginalLanguage = false;
    return false;
  }
}

// Save original language display setting
function saveOriginalLanguageSetting(show) {
  localStorage.setItem('showOriginalLanguage', show.toString());
  showOriginalLanguage = show;
}

// Toggle original language display
async function toggleOriginalLanguage() {
  showOriginalLanguage = !showOriginalLanguage;
  saveOriginalLanguageSetting(showOriginalLanguage);
  
  console.log(`[ORIGINAL] Toggling original language display to: ${showOriginalLanguage}`);
  console.log(`[ORIGINAL] Current video ID: ${currentVideoId}`);
  console.log(`[ORIGINAL] Original subtitles available: ${originalSubtitles ? originalSubtitles.length : 0}`);
  
  // Update checkbox state
  const checkbox = document.querySelector('.original-language-checkbox');
  if (checkbox) {
    checkbox.checked = showOriginalLanguage;
  }
  
  if (showOriginalLanguage) {
    // User wants to show original language
    
    // First, ensure we have original subtitles
    if (!originalSubtitles || originalSubtitles.length === 0) {
      console.log('[ORIGINAL] No original subtitles available, extracting...');
      showNotification('در حال استخراج زیرنویس اصلی...');
      
      if (currentVideoId) {
        try {
          const extractedSubtitles = await extractYouTubeSubtitles(currentVideoId);
          if (extractedSubtitles && extractedSubtitles.length > 0) {
            originalSubtitles = extractedSubtitles;
            console.log(`[ORIGINAL] Successfully extracted ${originalSubtitles.length} original subtitles`);
            showNotification(`استخراج ${originalSubtitles.length} زیرنویس اصلی موفق بود`);
          } else {
            console.error('[ORIGINAL] Failed to extract original subtitles');
            showNotification('خطا: نتوانستیم زیرنویس اصلی را استخراج کنیم');
            // Reset checkbox
            showOriginalLanguage = false;
            saveOriginalLanguageSetting(false);
            if (checkbox) checkbox.checked = false;
            return;
          }
        } catch (error) {
          console.error('[ORIGINAL] Error extracting original subtitles:', error);
          showNotification('خطا در استخراج زیرنویس اصلی: ' + error.message);
          // Reset checkbox
          showOriginalLanguage = false;
          saveOriginalLanguageSetting(false);
          if (checkbox) checkbox.checked = false;
          return;
        }
      } else {
        showNotification('خطا: شناسه ویدیو یافت نشد');
        // Reset checkbox
        showOriginalLanguage = false;
        saveOriginalLanguageSetting(false);
        if (checkbox) checkbox.checked = false;
        return;
      }
    }
    
    // Now create and show the overlay
    console.log('[ORIGINAL] Creating original subtitle overlay...');
    removeOriginalSubtitleOverlay(); // Remove any existing overlay
    
    const overlay = createOriginalSubtitleOverlay();
    if (overlay) {
      overlay.style.display = 'block';
      console.log('[ORIGINAL] Original subtitle overlay created and shown');
      showNotification('نمایش زبان اصلی فعال شد');
      
      // Start updating content immediately
      updateOriginalSubtitleContent();
    } else {
      console.error('[ORIGINAL] Failed to create original subtitle overlay');
      showNotification('خطا در ایجاد نمایشگر زیرنویس اصلی');
    }
    
  } else {
    // User wants to hide original language
    console.log('[ORIGINAL] Hiding original language display');
    removeOriginalSubtitleOverlay();
    showNotification('نمایش زبان اصلی غیرفعال شد');
  }
}

// Create original language controls
function createOriginalLanguageControls() {
  // Don't load setting here - it's already loaded in init()
  // loadOriginalLanguageSetting();
  
  // Create container
  const container = document.createElement('div');
  container.className = 'original-language-controls';
  
  // Create label
  const label = document.createElement('div');
  label.className = 'original-language-label';
  label.textContent = 'نمایش زبان اصلی:';
  
  // Create checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'original-language-checkbox';
  checkbox.checked = showOriginalLanguage;
  checkbox.addEventListener('change', toggleOriginalLanguage);
  
  // Add debug info
  checkbox.title = `زیرنویس اصلی: ${originalSubtitles ? originalSubtitles.length : 0} عدد`;
  
  // Assemble container
  container.appendChild(label);
  container.appendChild(checkbox);
  
  return container;
}

// Create original subtitle overlay
function createOriginalSubtitleOverlay() {
  console.log('[ORIGINAL] Creating original subtitle overlay...');
  
  // Remove existing overlay first
  removeOriginalSubtitleOverlay();
  
  // Find video container
  const videoContainer = findYouTubeVideoContainer();
  if (!videoContainer) {
    console.error('[ORIGINAL] Could not find video container for original subtitle overlay');
    return null;
  }
  
  console.log('[ORIGINAL] Found video container:', videoContainer);
  
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'original-subtitle-overlay';
  overlay.id = 'original-subtitle-overlay';
  overlay.style.top = originalSubtitleVerticalPosition + 'px';
  overlay.style.display = 'none'; // Start hidden
  overlay.textContent = ''; // Start empty
  
  // Add to video container
  videoContainer.appendChild(overlay);
  
  console.log('[ORIGINAL] Original subtitle overlay created and added to container');
  console.log('[ORIGINAL] Overlay element:', overlay);
  
  return overlay;
}

// Remove original subtitle overlay
function removeOriginalSubtitleOverlay() {
  const overlay = document.getElementById('original-subtitle-overlay');
  if (overlay) {
    overlay.remove();
    console.log('[ORIGINAL] Original subtitle overlay removed');
  }
}

// Update original subtitle content
function updateOriginalSubtitleContent() {
  if (!showOriginalLanguage) {
    return;
  }
  
  const overlay = document.getElementById('original-subtitle-overlay');
  if (!overlay) {
    console.log('[ORIGINAL_CONTENT] No overlay found');
    return;
  }
  
  if (!originalSubtitles || originalSubtitles.length === 0) {
    console.log('[ORIGINAL_CONTENT] No original subtitles available');
    overlay.style.display = 'none';
    return;
  }
  
  // Get current video time
  const video = document.querySelector('video');
  if (!video) {
    console.log('[ORIGINAL_CONTENT] No video element found');
    overlay.style.display = 'none';
    return;
  }
  
  const currentTime = video.currentTime;
  
  // Find current original subtitle
  const currentOriginal = findCurrentOriginalSubtitle(currentTime);
  
  if (currentOriginal && currentOriginal.text) {
    overlay.textContent = currentOriginal.text;
    overlay.style.display = 'block';
    console.log(`[ORIGINAL_CONTENT] Showing: "${currentOriginal.text.substring(0, 50)}..."`);
  } else {
    overlay.style.display = 'none';
    console.log('[ORIGINAL_CONTENT] No current original subtitle - hiding overlay');
  }
}

// Find current original subtitle
function findCurrentOriginalSubtitle(currentTime) {
  if (!originalSubtitles || originalSubtitles.length === 0) {
    return null;
  }
  
  if (typeof currentTime !== 'number' || isNaN(currentTime)) {
    console.warn('[ORIGINAL_FIND] Invalid current time:', currentTime);
    return null;
  }
  
  // Apply time offset and multiplier (same as translated subtitles)
  const adjustedTime = (currentTime + subtitleTimeOffset) * subtitleTimeMultiplier;
  
  for (let i = 0; i < originalSubtitles.length; i++) {
    const subtitle = originalSubtitles[i];
    
    // Validate subtitle timing
    if (typeof subtitle.startTime !== 'number' || typeof subtitle.endTime !== 'number') {
      continue;
    }
    
    if (adjustedTime >= subtitle.startTime && adjustedTime <= subtitle.endTime) {
      return subtitle;
    }
  }
  
  return null;
}

// Original subtitle position management functions
function loadOriginalSubtitlePosition() {
  try {
    const saved = localStorage.getItem('youtube_translator_original_position');
    if (saved) {
      originalSubtitleVerticalPosition = parseInt(saved);
      console.log('Loaded original subtitle position:', originalSubtitleVerticalPosition);
    }
  } catch (error) {
    console.error('Error loading original subtitle position:', error);
  }
}

function saveOriginalSubtitlePosition(position) {
  try {
    originalSubtitleVerticalPosition = position;
    localStorage.setItem('youtube_translator_original_position', position.toString());
    console.log('Saved original subtitle position:', position);
  } catch (error) {
    console.error('Error saving original subtitle position:', error);
  }
}

function updateOriginalSubtitlePosition() {
  const overlay = document.querySelector('.original-subtitle-overlay');
  if (overlay) {
    overlay.style.top = originalSubtitleVerticalPosition + 'px';
    console.log('Updated original subtitle position to:', originalSubtitleVerticalPosition);
  }
  
  // Update position display
  const positionValue = document.querySelector('.original-position-value');
  if (positionValue) {
    positionValue.textContent = originalSubtitleVerticalPosition + 'px';
  }
}

function moveOriginalSubtitleUp() {
  const newPosition = Math.max(10, originalSubtitleVerticalPosition - 10);
  saveOriginalSubtitlePosition(newPosition);
  updateOriginalSubtitlePosition();
  showNotification('موقعیت زبان اصلی به بالا منتقل شد');
}

function moveOriginalSubtitleDown() {
  const newPosition = Math.min(150, originalSubtitleVerticalPosition + 10);
  saveOriginalSubtitlePosition(newPosition);
  updateOriginalSubtitlePosition();
  showNotification('موقعیت زبان اصلی به پایین منتقل شد');
}

function createOriginalPositionControls() {
  const controls = document.createElement('div');
  controls.className = 'original-position-controls';
  
  const label = document.createElement('div');
  label.className = 'original-position-label';
  label.textContent = 'موقعیت زبان اصلی';
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'original-position-buttons';
  
  const upButton = document.createElement('button');
  upButton.className = 'original-position-button';
  upButton.textContent = '+';
  upButton.title = 'انتقال به بالا';
  upButton.onclick = moveOriginalSubtitleUp;
  
  const positionValue = document.createElement('div');
  positionValue.className = 'original-position-value';
  positionValue.textContent = originalSubtitleVerticalPosition + 'px';
  
  const downButton = document.createElement('button');
  downButton.className = 'original-position-button';
  downButton.textContent = '-';
  downButton.title = 'انتقال به پایین';
  downButton.onclick = moveOriginalSubtitleDown;
  
  buttonsContainer.appendChild(upButton);
  buttonsContainer.appendChild(positionValue);
  buttonsContainer.appendChild(downButton);
  
  controls.appendChild(label);
  controls.appendChild(buttonsContainer);
  
  return controls;
}

// Load subtitle position from localStorage
function loadSubtitlePosition() {
  const savedPosition = localStorage.getItem('subtitleVerticalPosition');
  if (savedPosition) {
    const position = parseInt(savedPosition);
    if (position >= 20 && position <= 200) {
      subtitleVerticalPosition = position;
      return position;
    }
  }
  // Default position
  subtitleVerticalPosition = 80;
  return 80;
}

// Save subtitle position to localStorage
function saveSubtitlePosition(position) {
  localStorage.setItem('subtitleVerticalPosition', position.toString());
  subtitleVerticalPosition = position;
}

// Update subtitle overlay position
function updateSubtitlePosition() {
  const overlay = document.querySelector('.subtitle-overlay');
  if (overlay) {
    overlay.style.bottom = `${subtitleVerticalPosition}px`;
  }
  
  // Update position display
  const positionValue = document.querySelector('.subtitle-position-value');
  if (positionValue) {
    positionValue.textContent = `${subtitleVerticalPosition}px`;
  }
}

// Move subtitle up
function moveSubtitleUp() {
  if (subtitleVerticalPosition < 200) {
    subtitleVerticalPosition += 10;
    saveSubtitlePosition(subtitleVerticalPosition);
    updateSubtitlePosition();
  }
}

// Move subtitle down
function moveSubtitleDown() {
  if (subtitleVerticalPosition > 20) {
    subtitleVerticalPosition -= 10;
    saveSubtitlePosition(subtitleVerticalPosition);
    updateSubtitlePosition();
  }
}

// Create subtitle position controls
function createSubtitlePositionControls() {
  // Load current position
  loadSubtitlePosition();
  
  // Create container
  const container = document.createElement('div');
  container.className = 'subtitle-position-controls';
  
  // Create label
  const label = document.createElement('div');
  label.className = 'subtitle-position-label';
  label.textContent = 'جابجایی زیرنویس:';
  
  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'subtitle-position-buttons';
  
  // Create up button
  const upButton = document.createElement('button');
  upButton.className = 'subtitle-position-button';
  upButton.textContent = '+';
  upButton.title = 'بالا بردن زیرنویس';
  upButton.addEventListener('click', moveSubtitleUp);
  
  // Create position display
  const positionValue = document.createElement('div');
  positionValue.className = 'subtitle-position-value';
  positionValue.textContent = `${subtitleVerticalPosition}px`;
  
  // Create down button
  const downButton = document.createElement('button');
  downButton.className = 'subtitle-position-button';
  downButton.textContent = '-';
  downButton.title = 'پایین آوردن زیرنویس';
  downButton.addEventListener('click', moveSubtitleDown);
  
  // Assemble buttons
  buttonsContainer.appendChild(upButton);
  buttonsContainer.appendChild(positionValue);
  buttonsContainer.appendChild(downButton);
  
  // Assemble container
  container.appendChild(label);
  container.appendChild(buttonsContainer);
  
  return container;
}

// Load saved settings

// Test functions for debugging
window.testOriginalLanguage = function() {
  console.log('=== TESTING ORIGINAL LANGUAGE FUNCTIONALITY ===');
  console.log('Current state:', {
    showOriginalLanguage,
    currentVideoId,
    originalSubtitlesCount: originalSubtitles ? originalSubtitles.length : 0
  });
  
  // Force toggle
  toggleOriginalLanguage();
  
  showNotification('تست زبان اصلی - بررسی کنسول را ببینید');
};

window.forceShowOriginalTest = function() {
  console.log('=== FORCE SHOWING TEST ORIGINAL SUBTITLE ===');
  
  // Remove any existing overlay
  removeOriginalSubtitleOverlay();
  
  // Create new overlay
  const overlay = createOriginalSubtitleOverlay();
  if (overlay) {
    overlay.textContent = 'TEST ORIGINAL SUBTITLE - This should be visible at the top';
    overlay.style.display = 'block';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
    overlay.style.color = 'white';
    overlay.style.fontSize = '20px';
    overlay.style.fontWeight = 'bold';
    overlay.style.zIndex = '999999999';
    overlay.style.border = '3px solid yellow';
    
    console.log('Test overlay created with high visibility styling');
    showNotification('تست زیرنویس اصلی - باید متن قرمز در بالای ویدیو ببینید');
    
    // Auto hide after 10 seconds
setTimeout(() => {
      overlay.style.display = 'none';
      console.log('Test overlay hidden');
    }, 10000);
  } else {
    console.error('Failed to create test overlay');
    showNotification('خطا در ایجاد تست زیرنویس اصلی');
  }
};

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
    init();
  }

// Default translation prompt
const DEFAULT_TRANSLATION_PROMPT = `Please translate the following English subtitle XML to Persian (Farsi). Keep the exact same XML structure and timing attributes. Only translate the text content inside the <text> tags. Make sure the translation is natural, conversational, and appropriate for the context. Preserve any formatting, punctuation, and maintain the same tone as the original.`;

// Get translation prompt from localStorage or return default
function getTranslationPrompt() {
  const savedPrompt = localStorage.getItem('translation_prompt');
  return savedPrompt || DEFAULT_TRANSLATION_PROMPT;
}

// Save translation prompt to localStorage
function saveTranslationPrompt(prompt) {
  localStorage.setItem('translation_prompt', prompt);
}

// Reset translation prompt to default
function resetTranslationPrompt() {
  localStorage.removeItem('translation_prompt');
}

// Create prompt editing panel
function createPromptPanel() {
  const panel = document.createElement('div');
  panel.id = 'prompt-panel';
  panel.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background-color: #1a1a1a;
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 600px;
    max-height: 80%;
    overflow-y: auto;
    border: 1px solid rgba(255, 255, 255, 0.2);
    direction: rtl;
    text-align: right;
  `;

  const title = document.createElement('h3');
  title.textContent = 'ویرایش پرامپت ترجمه';
  title.style.cssText = `
    color: white;
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: bold;
  `;

  const textarea = document.createElement('textarea');
  textarea.value = getTranslationPrompt();
  textarea.style.cssText = `
    width: 100%;
    height: 200px;
    background-color: #2a2a2a;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    color: white;
    padding: 12px;
    font-size: 14px;
    font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif;
    resize: vertical;
    direction: ltr;
    text-align: left;
    box-sizing: border-box;
    margin: 0;
    outline: none;
  `;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 12px;
    margin-top: 16px;
    justify-content: flex-end;
  `;

  const saveButton = document.createElement('button');
  saveButton.textContent = 'ذخیره';
  saveButton.style.cssText = `
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif;
    transition: background-color 0.2s;
  `;
  saveButton.addEventListener('mouseenter', () => {
    saveButton.style.backgroundColor = '#45a049';
  });
  saveButton.addEventListener('mouseleave', () => {
    saveButton.style.backgroundColor = '#4CAF50';
  });
  saveButton.addEventListener('click', () => {
    saveTranslationPrompt(textarea.value);
    showNotification('پرامپت ترجمه ذخیره شد');
    hidePromptPanel();
  });

  const resetButton = document.createElement('button');
  resetButton.textContent = 'بازگردانی به حالت پیش‌فرض';
  resetButton.style.cssText = `
    background-color: #ff9800;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif;
    transition: background-color 0.2s;
  `;
  resetButton.addEventListener('mouseenter', () => {
    resetButton.style.backgroundColor = '#f57c00';
  });
  resetButton.addEventListener('mouseleave', () => {
    resetButton.style.backgroundColor = '#ff9800';
  });
  resetButton.addEventListener('click', () => {
    if (confirm('آیا می‌خواهید پرامپت را به حالت پیش‌فرض بازگردانید؟')) {
      resetTranslationPrompt();
      textarea.value = DEFAULT_TRANSLATION_PROMPT;
      showNotification('پرامپت به حالت پیش‌فرض بازگردانده شد');
    }
  });

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'لغو';
  cancelButton.style.cssText = `
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    cursor: pointer;
    font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif;
    transition: background-color 0.2s;
  `;
  cancelButton.addEventListener('mouseenter', () => {
    cancelButton.style.backgroundColor = '#da190b';
  });
  cancelButton.addEventListener('mouseleave', () => {
    cancelButton.style.backgroundColor = '#f44336';
  });
  cancelButton.addEventListener('click', hidePromptPanel);

  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(resetButton);
  buttonContainer.appendChild(cancelButton);

  content.appendChild(title);
  content.appendChild(textarea);
  content.appendChild(buttonContainer);
  panel.appendChild(content);

  // Close panel when clicking outside
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      hidePromptPanel();
    }
  });

  return panel;
}

// Show prompt editing panel
function showPromptPanel() {
  // Remove existing panel if any
  hidePromptPanel();
  
  const panel = createPromptPanel();
  document.body.appendChild(panel);
}

// Hide prompt editing panel
function hidePromptPanel() {
  const existingPanel = document.getElementById('prompt-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
}

// Load previous/next subtitles setting from localStorage
function loadPreviousNextSubtitlesSetting() {
  try {
    const saved = localStorage.getItem('showPreviousNextSubtitles');
    if (saved !== null) {
      showPreviousNextSubtitles = saved === 'true';
  } else {
      showPreviousNextSubtitles = true; // Default to true
    }
    console.log(`[SETTINGS] Loaded previous/next subtitles setting: ${showPreviousNextSubtitles}`);
  } catch (error) {
    console.error('[SETTINGS] Error loading previous/next subtitles setting:', error);
    showPreviousNextSubtitles = true; // Default to true on error
    // Clean up corrupted localStorage
    try {
      localStorage.removeItem('showPreviousNextSubtitles');
    } catch (cleanupError) {
      console.error('[SETTINGS] Error cleaning up corrupted localStorage:', cleanupError);
    }
  }
}

// Save previous/next subtitles setting to localStorage
function savePreviousNextSubtitlesSetting(show) {
  try {
    localStorage.setItem('showPreviousNextSubtitles', show.toString());
    console.log(`[SETTINGS] Saved previous/next subtitles setting: ${show}`);
  } catch (error) {
    console.error('[SETTINGS] Error saving previous/next subtitles setting:', error);
  }
}

// Toggle previous/next subtitles display
function togglePreviousNextSubtitles() {
  showPreviousNextSubtitles = !showPreviousNextSubtitles;
  savePreviousNextSubtitlesSetting(showPreviousNextSubtitles);
  
  console.log(`[PREV_NEXT] Toggling previous/next subtitles display to: ${showPreviousNextSubtitles}`);
  
  // Update checkbox state
  const checkbox = document.querySelector('.previous-next-subtitles-checkbox');
  if (checkbox) {
    checkbox.checked = showPreviousNextSubtitles;
  }
  
  // Update subtitle display immediately
  const previousElement = document.getElementById('subtitle-previous');
  const nextElement = document.getElementById('subtitle-next');
  
  if (previousElement && nextElement) {
    if (showPreviousNextSubtitles) {
      // Show elements if they have content
      if (previousElement.textContent) {
        previousElement.style.display = 'block';
      }
      if (nextElement.textContent) {
        nextElement.style.display = 'block';
      }
      showNotification('نمایش زیرنویس‌های قبل و بعد فعال شد');
} else {
      // Hide elements
      previousElement.style.display = 'none';
      nextElement.style.display = 'none';
      showNotification('نمایش زیرنویس‌های قبل و بعد غیرفعال شد');
    }
  }
}

// Create previous/next subtitles controls
function createPreviousNextSubtitlesControls() {
  // Create container
  const container = document.createElement('div');
  container.className = 'original-language-controls'; // Reuse same styling
  
  // Create label
  const label = document.createElement('div');
  label.className = 'original-language-label';
  label.textContent = 'نمایش زیرنویس قبل و بعد:';
  
  // Create checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'previous-next-subtitles-checkbox';
  checkbox.style.width = '16px';
  checkbox.style.height = '16px';
  checkbox.style.accentColor = '#4CAF50';
  checkbox.style.cursor = 'pointer';
  checkbox.style.margin = '0';
  checkbox.checked = showPreviousNextSubtitles;
  checkbox.addEventListener('change', togglePreviousNextSubtitles);
  
  // Add title for clarity
  checkbox.title = 'فعال/غیرفعال کردن نمایش زیرنویس‌های قبل و بعد از زیرنویس اصلی';
  
  // Assemble container
  container.appendChild(label);
  container.appendChild(checkbox);
  
  return container;
}

// Parse SRT content to subtitle objects
function parseSrtToSubtitles(srtContent) {
  console.log('[PARSE] Parsing SRT content to subtitle objects');
  
  if (!srtContent || srtContent.trim() === '') {
    console.warn('[PARSE] Empty SRT content provided');
    return [];
  }

  try {
    const subtitles = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;
      
      // Line 1: Subtitle index (ignore)
      // Line 2: Time range
      // Line 3+: Subtitle text
      
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) continue;
      
      const startTime = srtTimeStringToSeconds(timeMatch[1]);
      const endTime = srtTimeStringToSeconds(timeMatch[2]);
      const text = lines.slice(2).join('\n').trim();
      
      if (text && startTime !== null && endTime !== null) {
        subtitles.push({
          startTime: startTime,
          endTime: endTime,
          duration: endTime - startTime,
          text: text
        });
      }
    }
    
    console.log(`[PARSE] Successfully parsed ${subtitles.length} subtitles from SRT`);
    return subtitles;
    
  } catch (error) {
    console.error('[PARSE] Error parsing SRT content:', error);
    return [];
  }
}

// Convert SRT time string to seconds
function srtTimeStringToSeconds(timeString) {
  try {
    // Format: HH:MM:SS,mmm
    const match = timeString.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!match) return null;
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const milliseconds = parseInt(match[4], 10);
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  } catch (error) {
    console.error('[PARSE] Error parsing time string:', timeString, error);
    return null;
  }
}

// Convert subtitles to XML format for Gemini API
function convertSubtitlesToXml(subtitles) {
  console.log('[CONVERT] Converting subtitles to XML format');
  
  if (!subtitles || subtitles.length === 0) {
    console.warn('[CONVERT] No subtitles to convert');
    return '<?xml version="1.0" encoding="utf-8" ?><transcript></transcript>';
  }
  
  let xml = '<?xml version="1.0" encoding="utf-8" ?>\n<transcript>\n';
  
  subtitles.forEach((subtitle) => {
    const startTime = subtitle.startTime.toFixed(3);
    const duration = (subtitle.endTime - subtitle.startTime).toFixed(3);
    const endTime = subtitle.endTime.toFixed(3);
    
    // Escape XML characters in text
    const escapedText = subtitle.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    xml += `  <text start="${startTime}" dur="${duration}" end="${endTime}">${escapedText}</text>\n`;
  });
  
  xml += '</transcript>';
  
  console.log(`[CONVERT] Converted ${subtitles.length} subtitles to XML`);
  return xml;
}

// Force cancel all translation requests and reset states
function forceCancelAllTranslationRequests() {
  console.log('🛑 [FORCE_CANCEL] Starting force cancellation of all translation requests...');
  
  try {
    // Step 1: Override XMLHttpRequest to block translation requests
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      xhr.open = function(method, url, ...args) {
        // Block translation API requests
        if (url && (url.includes('openrouter.ai') || url.includes('generativelanguage.googleapis.com'))) {
          console.log('🚫 [FORCE_CANCEL] Blocked translation request to:', url);
          // Create a dummy request that immediately fails
          this.status = 0;
          this.readyState = 4;
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Translation request cancelled'));
          }, 0);
          return;
        }
        return originalOpen.apply(this, [method, url, ...args]);
      };
      
      xhr.send = function(...args) {
        // Additional check on send
        if (this.responseURL && (this.responseURL.includes('openrouter.ai') || this.responseURL.includes('generativelanguage.googleapis.com'))) {
          console.log('🚫 [FORCE_CANCEL] Blocked translation request on send');
          return;
        }
        return originalSend.apply(this, args);
      };
      
      return xhr;
    };

    // Step 2: Override fetch to block translation requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (url && (url.includes('openrouter.ai') || url.includes('generativelanguage.googleapis.com'))) {
        console.log('🚫 [FORCE_CANCEL] Blocked fetch request to:', url);
        return Promise.reject(new Error('Translation request cancelled'));
      }
      return originalFetch.apply(this, arguments);
    };

    // Step 3: Clear all timers and intervals (with safety limit)
    let timerCount = 0;
    const maxTimers = 1000; // Safety limit
    
    // Clear timeouts
    for (let i = 1; i < maxTimers; i++) {
      try {
        clearTimeout(i);
        timerCount++;
      } catch (e) {
        // Ignore errors for non-existent timers
      }
    }
    
    // Clear intervals
    for (let i = 1; i < maxTimers; i++) {
      try {
        clearInterval(i);
        timerCount++;
      } catch (e) {
        // Ignore errors for non-existent intervals
      }
    }
    
    console.log(`🧹 [FORCE_CANCEL] Cleared ${timerCount} timers/intervals`);

    // Step 4: Reset all translation-related global states
    translatedSubtitles = [];
    originalSubtitles = [];
    isDisplayingSubtitles = false;
    isSubtitleVisible = false;
    
    // Step 5: Hide progress bars
    const progressBar = document.querySelector('.translation-progress-bar');
    if (progressBar) {
      progressBar.style.display = 'none';
    }
    
    const persistentProgressBar = document.querySelector('.persistent-progress-bar');
    if (persistentProgressBar) {
      persistentProgressBar.style.display = 'none';
    }

    // Step 6: Clear translation progress from localStorage
    const currentVideoId = getCurrentVideoId();
    if (currentVideoId) {
      const progressKey = `translation_progress_${currentVideoId}`;
      localStorage.removeItem(progressKey);
      console.log('🗑️ [FORCE_CANCEL] Cleared translation progress for video:', currentVideoId);
    }

    // Step 7: Stop subtitle updates
    if (subtitleUpdateInterval) {
      clearInterval(subtitleUpdateInterval);
      subtitleUpdateInterval = null;
      console.log('⏹️ [FORCE_CANCEL] Stopped subtitle updates');
    }

    // Step 8: Remove overlays
    removeExistingOverlay();
    removeOriginalSubtitleOverlay();

    // Step 9: Show Persian notification
    showNotification('❌ تمام درخواست‌های ترجمه لغو شدند');

    console.log('✅ [FORCE_CANCEL] Force cancellation completed successfully');

    // Step 10: Restore normal functionality after 30 seconds
    setTimeout(() => {
      try {
        window.XMLHttpRequest = originalXHR;
        window.fetch = originalFetch;
        console.log('🔄 [FORCE_CANCEL] Restored normal network functionality');
        showNotification('🔄 عملکرد شبکه بازگردانی شد');
      } catch (e) {
        console.error('❌ [FORCE_CANCEL] Error restoring network functionality:', e);
      }
    }, 30000);

  } catch (error) {
    console.error('❌ [FORCE_CANCEL] Error during force cancellation:', error);
    showNotification('❌ خطا در لغو درخواست‌ها');
  }
}

// Helper function to get current video ID
function getCurrentVideoId() {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('v');
  } catch (e) {
    console.error('[VIDEO_ID] Error getting current video ID:', e);
    return null;
  }
}