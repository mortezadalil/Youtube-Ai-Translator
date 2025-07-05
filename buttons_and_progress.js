function addTranslateButton() {
  
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

    // Debugging: Double-check localStorage directly FIRST
  try {
    const storageKey = `youtube_subtitles_${currentVideoId}`;
    const rawData = localStorage.getItem(storageKey);
    if (rawData) {
      const parsedData = JSON.parse(rawData);
        
        // Also check progress info
        const progress = calculateVideoTranslationProgress();
    }
  } catch (e) {
      console.error('[BUTTON_DEBUG] Error checking localStorage directly:', e);
    }
    
    cachedSubtitles = loadSubtitlesFromStorage(currentVideoId);
    hasCachedSubtitles = cachedSubtitles && cachedSubtitles.length > 0;
  }


  // BUGFIX: If we have saved subtitles, always treat them as cached subtitles
  // This fixes the issue where progress shows 23% but button shows "دریافت و ترجمه"
  if (!hasCachedSubtitles && currentVideoId) {
    const checkAgain = loadSubtitlesFromStorage(currentVideoId);
    if (checkAgain && checkAgain.length > 0) {
      hasCachedSubtitles = true;
      cachedSubtitles = checkAgain;
    }
  }

  // Function to check if we have any saved subtitles (original or translated)
  function hasAnySavedSubtitles(videoId) {
    if (!videoId) return false;
    
    // Check for translated subtitles
    const translatedSubtitles = loadSubtitlesFromStorage(videoId);
    if (translatedSubtitles && translatedSubtitles.length > 0) {
      return true;
    }
    
    // Check for original language subtitles
    const originalSubtitles = getOriginalLanguageSubtitles(videoId);
    if (originalSubtitles && originalSubtitles.trim().length > 0) {
      return true;
    }
    
    return false;
  }

  // Special case: If translation is in progress, show appropriate buttons
  if (isTranslationInProgress) {
    
    // Show disabled translate button
    const translateButton = document.createElement('button');
    translateButton.textContent = 'در حال ترجمه...';
    translateButton.className = 'subtitle-translate-button loading';
    translateButton.disabled = true;
    translateButton.style.opacity = '0.6';
    translateButton.style.cursor = 'not-allowed';
    buttonContainer.appendChild(translateButton);
    
    // Skip to controls section
  } else if (hasCachedSubtitles) {
    // If subtitles are cached and currently displaying/visible
    if (isDisplayingSubtitles && isSubtitleVisible) {
      // Subtitles are currently visible - show hide button
      const hideButton = document.createElement('button');
      hideButton.textContent = 'مخفی کردن زیرنویس';
      hideButton.className = 'subtitle-visibility-button bright-green';
      hideButton.addEventListener('click', toggleSubtitleVisibility);
      buttonContainer.appendChild(hideButton);
      
      // Add sync controls when subtitles are active and visible
      addSyncControls();
    } else {
      // Subtitles are cached but not displaying or not visible - show toggle button
      const showButton = document.createElement('button');
      showButton.textContent = 'نمایش زیرنویس فارسی (ذخیره شده)';
      showButton.className = 'subtitle-translate-button green';
      showButton.id = 'subtitle-toggle-display-button';
      showButton.addEventListener('click', () => {
        if (isDisplayingSubtitles && isSubtitleVisible) {
          // Currently showing - hide subtitles
          isSubtitleVisible = false;
          toggleSubtitleDisplay(false);
          showButton.textContent = 'نمایش زیرنویس فارسی (ذخیره شده)';
          showButton.className = 'subtitle-translate-button green';
        } else {
          // Currently hidden - show subtitles
          const cachedSubs = loadSubtitlesFromStorage(currentVideoId);
          if (cachedSubs && cachedSubs.length > 0) {
            translatedSubtitles = cachedSubs;
            isSubtitleVisible = true;
            toggleSubtitleDisplay(true);
            showButton.textContent = 'مخفی کردن زیرنویس';
            showButton.className = 'subtitle-translate-button red';
          }
        }
      });
      buttonContainer.appendChild(showButton);
    }
    
    // Add refresh button only if translation is incomplete
    const videoDuration = getVideoDuration();
    let shouldShowRefreshButton = false;
    
    if (videoDuration) {
      const coverage = calculateSubtitleTimeCoverage(cachedSubtitles);
      const isComplete = coverage.endTime >= videoDuration - 30; // 30 seconds tolerance
      shouldShowRefreshButton = !isComplete;
  } else {
      // If we can't determine video duration, assume incomplete and show refresh button
      shouldShowRefreshButton = true;
    }
    
    if (shouldShowRefreshButton) {
      
      // Create container for button and status
      const refreshContainer = document.createElement('div');
      refreshContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
      
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
        
        // Show translation in progress status in progress bar title
        const progress = calculateVideoTranslationProgress();
        updatePersistentProgressBar(
          progress.percentage,
          progress.status,
          'در حال دریافت ترجمه'
        );
      } else {
        // Show normal status in progress bar instead of button area
        const progress = calculateVideoTranslationProgress();
        // Only show "بخشی از زیرنویس ترجمه شده است" when progress is less than 100%
        const title = progress.percentage < 100 ? 'بخشی از زیرنویس ترجمه شده است' : 'ترجمه کامل';
        updatePersistentProgressBar(
          progress.percentage,
          progress.status,
          title
        );
        
        // Update original language status as well
        updateOriginalLanguageStatus();
      }
      
      refreshContainer.appendChild(refreshButton);
      buttonContainer.appendChild(refreshContainer);
    } else {
    }
    
  } else {
    
    // Check if there's incomplete translation progress (but only if there are some saved subtitles)
    const hasIncomplete = hasIncompleteTranslation();
    // IMPORTANT: Use consistent detection - if we got here, hasCachedSubtitles was false
    // But we should double-check for saved subtitles again because progress might exist
    const savedSubtitlesForProgress = currentVideoId ? loadSubtitlesFromStorage(currentVideoId) : null;
    const hasSavedSubtitles = savedSubtitlesForProgress && savedSubtitlesForProgress.length > 0;
    
    
    // No cached subtitles - show translate button
    const translateButton = document.createElement('button');
    if (hasIncomplete && hasSavedSubtitles) {
      // Only show "continue translation" if there are actually saved subtitles that are incomplete
      translateButton.textContent = 'ادامه ترجمه زیرنویس';
      translateButton.className = 'subtitle-translate-button orange';
      translateButton.title = 'ادامه ترجمه از جایی که متوقف شده';
    } else {
      // Show regular translation button for videos with no subtitles or incomplete progress only
      translateButton.textContent = getTranslateButtonText();
      
      // Set appropriate title based on status
      const currentVideoId = getCurrentVideoId();
      if (hasOriginalLanguageSubtitles(currentVideoId)) {
        translateButton.title = 'زیرنویس اصلی قبلاً دریافت شده - فقط ترجمه انجام می‌شود';
      } else {
        translateButton.title = 'دریافت زیرنویس از سرور و ترجمه آن';
      }
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
  
  // Add subtitle time synchronization controls (always visible)
  const timeSyncControls = createSubtitleTimeSyncControls();
  buttonContainer.appendChild(timeSyncControls);

  // Add subtitle position controls at the end (always visible)
  const positionControls = createSubtitlePositionControls();
  buttonContainer.appendChild(positionControls);
  
  // Add subtitle font size controls (always visible)
  const fontSizeControls = createSubtitleFontSizeControls();
  buttonContainer.appendChild(fontSizeControls);
  
  // Create a container for language and display controls to show them side by side
  const languageDisplayContainer = document.createElement('div');
  languageDisplayContainer.style.cssText = `
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    margin: 4px 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  
  // Add original language controls and previous/next controls side by side
  const originalLanguageControls = createOriginalLanguageControls();
  const previousNextControls = createPreviousNextSubtitlesControls();
  const originalPositionControls = createOriginalPositionControls();
  buttonContainer.appendChild(originalPositionControls);
  languageDisplayContainer.appendChild(originalLanguageControls);
  languageDisplayContainer.appendChild(previousNextControls);
  buttonContainer.appendChild(languageDisplayContainer);
  
  // Add original language position controls (always visible)

  // Always add "Show Saved Subtitles" button if any subtitles exist 
  if (currentVideoId && hasAnySavedSubtitles(currentVideoId)) {
    const savedSubtitlesButton = document.createElement('button');
    savedSubtitlesButton.textContent = 'نمایش زیرنویس ذخیره شده';
    savedSubtitlesButton.className = 'subtitle-show-saved-button';
    savedSubtitlesButton.style.backgroundColor = '#2196F3';
    savedSubtitlesButton.style.color = 'white';
    savedSubtitlesButton.style.border = 'none';
    savedSubtitlesButton.style.borderRadius = '4px';
    savedSubtitlesButton.style.fontSize = '12px';
    savedSubtitlesButton.style.cursor = 'pointer';
    savedSubtitlesButton.style.direction = 'rtl';
    savedSubtitlesButton.style.transition = 'background-color 0.2s';
    savedSubtitlesButton.style.padding = '6px 10px';
    savedSubtitlesButton.style.width = '100%';
    savedSubtitlesButton.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
    savedSubtitlesButton.style.marginTop = '6px';
    savedSubtitlesButton.style.marginBottom = '6px';
    savedSubtitlesButton.addEventListener('click', showSavedSubtitlesViewer);
    savedSubtitlesButton.addEventListener('mouseenter', () => {
      savedSubtitlesButton.style.backgroundColor = '#1976D2';
    });
    savedSubtitlesButton.addEventListener('mouseleave', () => {
      savedSubtitlesButton.style.backgroundColor = '#2196F3';
    });
    buttonContainer.appendChild(savedSubtitlesButton);
  } else {
  }

  // Update original language status at the end
  updateOriginalLanguageStatus();
  
}

// Toggle subtitle visibility
function toggleSubtitleVisibility() {
  try {
    // Toggle visibility state
    isSubtitleVisible = !isSubtitleVisible;
    
    // Update subtitle overlay visibility
    let overlay = document.querySelector('.subtitle-overlay');
    
    if (!overlay && isSubtitleVisible) {
      // If we need to show subtitles but there's no overlay, create one
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
  isDisplayingSubtitles = show;
  
  if (show) {
    // Create a fresh subtitle overlay
    removeExistingOverlay();
    createSubtitleOverlay();
    
    // Recreate original subtitle overlay if it was enabled
    if (showOriginalLanguage) {
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
    
    // Update the toggle button to show "مخفی کردن" state
    setTimeout(() => {
      const toggleButton = document.getElementById('subtitle-toggle-display-button');
      if (toggleButton) {
        toggleButton.textContent = 'مخفی کردن زیرنویس';
        toggleButton.className = 'subtitle-translate-button red';
      }
      
      // Double check if we have cached subtitles before updating buttons
      let hasCachedSubtitles = false;
      if (currentVideoId) {
        const cachedSubtitles = loadSubtitlesFromStorage(currentVideoId);
        if (cachedSubtitles && cachedSubtitles.length > 0) {
          hasCachedSubtitles = true;
        }
      }
      
      // Force the page to recognize we have cached subtitles
      if (!hasCachedSubtitles && translatedSubtitles && translatedSubtitles.length > 0) {
        saveSubtitlesToStorage(currentVideoId, translatedSubtitles);
      }
    }, 600);
  } else {
    // Stop subtitle updates
    stopSubtitleUpdates();
    
    // Remove the overlay completely
    removeExistingOverlay();
    
    // Reset isSubtitleVisible as well
    isSubtitleVisible = false;
    
    // Update the toggle button to show "نمایش" state instead of rebuilding entire UI
    setTimeout(() => {
      const toggleButton = document.getElementById('subtitle-toggle-display-button');
      if (toggleButton) {
        toggleButton.textContent = 'نمایش زیرنویس فارسی (ذخیره شده)';
        toggleButton.className = 'subtitle-translate-button green';
      }
    }, 200);
  }
}


// Function to extract and translate YouTube subtitles with Gemini
async function translateSubtitlesWithOpenRouter() {
  
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
        translatedSubtitles = cachedSubtitles;
              showNotification('استفاده از زیرنویس‌های ذخیره شده');
        toggleSubtitleDisplay(true);
        return;
            } else {
            }
          } else {
            // If we can't determine video duration, assume complete
            translatedSubtitles = cachedSubtitles;
            showNotification('استفاده از زیرنویس‌های ذخیره شده');
            toggleSubtitleDisplay(true);
            return;
          }
        } else {
        }
      }
    }
    
    // Update button to indicate loading only if no saved subtitles exist
    const translateButton = document.querySelector('.subtitle-translate-button');
    const existingSavedSubtitles = loadSubtitlesFromStorage(currentVideoId);
    
    if (translateButton && (!existingSavedSubtitles || existingSavedSubtitles.length === 0)) {
      // Only disable button if no saved subtitles exist
      translateButton.textContent = 'در حال دریافت و ترجمه ...';
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
    
          // Extract subtitles (extractYouTubeSubtitles will check cache first, then fetch if needed)
    const extractStartTime = performance.now();
    const subtitles = await extractYouTubeSubtitles(currentVideoId);
    const extractEndTime = performance.now();
    
    if (!subtitles || subtitles.length === 0) {
      throw new Error('Could not extract subtitles from video');
    }
    
    
    // Store the total number of original subtitles for progress calculation
    const originalSubtitlesKey = `original_subtitles_count_${currentVideoId}`;
    localStorage.setItem(originalSubtitlesKey, subtitles.length.toString());
    
    // Filter subtitles by time range if specified
    const filteredSubtitles = filterSubtitlesByTimeRange(subtitles);
    
    if (filteredSubtitles.length === 0) {
      throw new Error('No subtitles found in the specified time range');
    }
    
    if (filteredSubtitles.length !== subtitles.length) {
      
      // Show notification about time range filtering
      const startTime = localStorage.getItem('translationStartTime') || '';
      const endTime = localStorage.getItem('translationEndTime') || '';
      
      // Convert to readable format
      const startDisplay = startTime ? `${startTime}s` : '0s';
      const endDisplay = endTime ? `${endTime}s` : 'پایان';
      showNotification(`ترجمه بازه ${startDisplay} تا ${endDisplay} (${filteredSubtitles.length} زیرنویس)`);
    }
    
    // Convert filtered subtitles to SRT format instead of XML
    const srt = convertSubtitlesToSrt(filteredSubtitles);
    originalSubtitleXml = srt; // Keep the same variable name for compatibility
    
    // Store original subtitles for display
    originalSubtitles = filteredSubtitles;
    
    // Log the original SRT for debugging
    
    // Also log a sample of subtitles with their timing
    const sampleSize = Math.min(5, filteredSubtitles.length);
    for (let i = 0; i < sampleSize; i++) {
    }
    
    // Use chunked translation for better reliability and progress tracking
    
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
      translateButton.textContent = getTranslateButtonText();
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
          translateButton.textContent = getTranslateButtonText();
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
      
      
      // Check if we got enough subtitles
      if (parsedSubtitles.length >= filteredSubtitles.length * 0.6) {
        translationSuccess = true;
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
      translateButton.textContent = getTranslateButtonText();
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
    
    let saveSuccess = false;
    try {
      // Check if we have existing subtitles to merge with
      const existingSubtitles = loadSubtitlesFromStorage(currentVideoId);
      let finalSubtitles = parsedSubtitles;
      
      if (existingSubtitles && existingSubtitles.length > 0) {
        
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
          
          filteredExistingSubtitles = existingSubtitles.filter(sub => {
            // Keep subtitles that don't overlap with the specified time range
            const shouldKeep = sub.endTime <= startSeconds || sub.startTime >= endSeconds;
            if (!shouldKeep) removedCount++;
            return shouldKeep;
          });
          
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
        
        if (removedCount > 0 && addedCount > 0) {
          showNotification(`${removedCount} زیرنویس قدیمی جایگزین شد و ${addedCount} زیرنویس جدید اضافه شد`);
        } else if (addedCount > 0) {
          showNotification(`${addedCount} زیرنویس جدید به ${filteredExistingSubtitles.length} زیرنویس قبلی اضافه شد`);
        } else {
          //showNotification('همه زیرنویس‌ها از قبل موجود بودند');
        }
      } else {
      }
      
      // Update the global variable with merged subtitles
      translatedSubtitles = finalSubtitles;
      
      saveSuccess = saveSubtitlesToStorage(currentVideoId, finalSubtitles);
    } catch (saveError) {
      console.error('[TRANSLATE] Error during save operation:', saveError);
    }
    
    // Clear time range settings if this was a refresh operation
    const wasRefreshOperation = localStorage.getItem('translationStartTime') && localStorage.getItem('translationStartTime') !== '0';
    if (wasRefreshOperation) {
      localStorage.removeItem('translationStartTime');
      localStorage.removeItem('translationEndTime');
      
      // Reset refresh button after successful completion
      resetRefreshButton();
    }
    
    // Show success notification and display subtitles
    if (wasRefreshOperation) {
      showNotification('ترجمه ویدیو تکمیل شد - تمام بخش‌ها ترجمه شده‌اند');
    } else {
      showNotification('ترجمه زیرنویس با موفقیت انجام شد');
    }
    
    // Reset translation in progress flag first
    isTranslationInProgress = false;
    
    // Update UI to show completed translation state
    updateUIForTranslationEnd();
    
    // Immediately update UI to show subtitle display button
    setTimeout(() => {
      addTranslateButton(); // This will show the "Show Persian Subtitles" button
      showNotification('زیرنویس‌ها ترجمه شدند و به صورت خودکار فعال شدند!');
    }, 100); // Reduced delay for immediate response
    
    // Also automatically display subtitles
    toggleSubtitleDisplay(true);
  } catch (error) {
    console.error('[TRANSLATE] Error during subtitle translation:', error);
    
    // Reset translation in progress flag
    isTranslationInProgress = false;
    
    // Update UI to show error state
    updateUIForTranslationEnd();
    
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
      translateButton.textContent = getTranslateButtonText();
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
  progressStatus.textContent = 'زیرنویس دریافت نشده';
  
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
    // Check if translation is marked as complete (no incomplete translation progress)
    const progressKey = `translation_progress_${currentVideoId}`;
    const savedProgress = localStorage.getItem(progressKey);
    const isTranslationComplete = !savedProgress; // If no progress data, it means translation was completed and cleaned up
    
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
    
    // If translation is complete and we have reasonable coverage, show 100%
    if (isTranslationComplete && savedSubtitles.length > 0) {
      return { 
        percentage: 100, 
        status: 'ترجمه کامل انجام شد', 
        hasTranslation: true 
      };
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
      
      
      // BUGFIX: If we have progress data but no actual translated subtitles in storage,
      // and no translated subtitles in progress data, then this is stale progress data
      if (translatedCount === 0) {
        localStorage.removeItem(progressKey);
        return { percentage: 0, status: 'زیرنویس دریافت نشده', hasTranslation: false };
      }
      
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
  
  return { percentage: 0, status: 'زیرنویس دریافت نشده', hasTranslation: false };
}

// Update persistent progress display
function updatePersistentProgress() {
  const progress = calculateVideoTranslationProgress();
  
  let title = 'پیشرفت ترجمه ویدیو';
  if (progress.hasTranslation) {
    // If translation is complete (100%), use "ترجمه کامل"
    if (progress.percentage >= 100) {
    title = 'ترجمه کامل';
    } else {
      title = 'بخشی از زیرنویس ترجمه شده است';
    }
  }
  
  updatePersistentProgressBar(progress.percentage, progress.status, title);
  
  // Update original language status as well
  updateOriginalLanguageStatus();
}

// Update persistent progress bar during active translation
function updatePersistentProgressDuringTranslation(currentTranslatedSubtitles) {
  if (!currentVideoId || !currentTranslatedSubtitles || currentTranslatedSubtitles.length === 0) {
      return;
    }
    
  const videoDuration = getVideoDuration();
  if (!videoDuration) {
    // Fallback to showing subtitle count if video duration unavailable
    updatePersistentProgressBar(50, `${currentTranslatedSubtitles.length} زیرنویس در حال ترجمه...`, 'در حال دریافت ترجمه');
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
  
  updatePersistentProgressBar(percentage, status, 'در حال دریافت ترجمه');
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
  
  
  return chunks;
}

// Translate subtitles in chunks
async function translateSubtitlesInChunks(subtitles) {
  
  // Get chunk duration from settings
  const chunkDurationMinutes = getChunkDurationMinutes();
  
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
            
          } else {
            // Fallback: Find the last subtitle's end time
            const lastSubtitle = savedSubtitles[savedSubtitles.length - 1];
            const lastTimeInMinutes = lastSubtitle.end / 60; // Convert seconds to minutes
            
            // Calculate which chunk to start from (next chunk after the last translated time)
            startFromChunk = Math.ceil(lastTimeInMinutes / chunkDurationMinutes);
            
          }
          
          // Ensure we don't exceed the total number of chunks
          if (startFromChunk >= chunks.length) {
            startFromChunk = chunks.length;
          }
        } else {
          // No saved subtitles, use the old method as fallback
          startFromChunk = progressData.completedChunks;
        }
        
        existingTranslatedChunks = progressData.translatedSubtitles || [];
        
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
    showNotification('ترجمه این ویدیو قبلاً تکمیل شده است');
    updatePersistentProgressBar(100, 'ترجمه کامل انجام شد', 'ترجمه کامل');
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
    updatePersistentProgressBar(initialProgress, `${currentCount} زیرنویس از ${totalSubtitles} ذخیره شده`, 'در حال دریافت ترجمه');
  } else {
    // Starting fresh translation
    const totalSubtitles = localStorage.getItem(`original_subtitles_count_${currentVideoId}`) || subtitles.length;
    updatePersistentProgressBar(0, `0 زیرنویس از ${totalSubtitles} ذخیره شده`, 'در حال دریافت ترجمه');
  }
  
  const translatedChunks = [...existingTranslatedChunks];
  let firstChunkCompleted = startFromChunk > 0 || existingTranslatedChunks.length > 0;
  
  try {
    for (let i = startFromChunk; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkNumber = i + 1;
      
      
      // Update progress with current subtitle count
      const currentSavedSubtitles = loadSubtitlesFromStorage(currentVideoId) || [];
      const totalSubtitles = localStorage.getItem(`original_subtitles_count_${currentVideoId}`) || subtitles.length;
      const progressPercentage = (i / chunks.length) * 100;
      updatePersistentProgressBar(progressPercentage, `${currentSavedSubtitles.length} زیرنویس از ${totalSubtitles} ذخیره شده`, `در حال دریافت ترجمه`);
      
      try {
        // Convert chunk to appropriate format based on API
        const apiInfo = getTranslationApiInfo();
        let chunkData;
        let translatedData;
        
        if (apiInfo.api === 'gemini') {
          // Use XML format for Gemini API
          chunkData = convertSubtitlesToXml(chunk.subtitles);
          translatedData = await translateWithGemini(chunkData);
        } else {
          // Use SRT format for OpenRouter API
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
        const saveResult = saveSubtitlesToStorage(currentVideoId, translatedSubtitles);
        
        // Verify the save by loading back
        const verifyLoad = loadSubtitlesFromStorage(currentVideoId);
        
        
        // Update UI to show subtitle display button after each chunk completion
        setTimeout(() => {
          
          addSavedSubtitlesButtonIfNeeded(); // Force show saved subtitles button
          
          // Enable saved subtitles button after first successful translation
          if (!firstChunkCompleted) {
            enableSavedSubtitlesButton();
          }
          
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
     updatePersistentProgressBar(100, 'ترجمه کامل انجام شد', `ترجمه کامل`);
    
    
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
      return false;
    }
    
    // Check if there's incomplete translation progress
    const progressKey = `translation_progress_${currentVideoId}`;
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      const progressData = JSON.parse(savedProgress);
      if (progressData.completedChunks < progressData.totalChunks) {
        return true;
      }
    }
    
    // Also check if the saved subtitles don't cover the full video
    const videoDuration = getVideoDuration();
    if (videoDuration) {
      const coverage = calculateSubtitleTimeCoverage(savedSubtitles);
      const isComplete = coverage.endTime >= videoDuration - 30; // 30 seconds tolerance
      if (!isComplete) {
        return true;
      }
    }
  } catch (e) {
    console.warn('[PROGRESS] Error checking incomplete translation:', e);
  }
  
  return false;
}

// Add time range controls to main settings box
