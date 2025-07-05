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
// Clear only original subtitles (not translated)
function clearOriginalSubtitles() {
  
  // Show confirmation dialog
  if (confirm('آیا از پاک کردن زیرنویس اصلی این ویدیو اطمینان دارید؟ (ترجمه حفظ می‌شود)')) {
    if (!currentVideoId) {
      showNotification('خطا: شناسه ویدیو یافت نشد');
      return;
    }
    
    try {
      // Clear only original language subtitles
      const originalLanguageKey = `originalLanguage_${currentVideoId}`;
      localStorage.removeItem(originalLanguageKey);
      
      // DON'T clear translated subtitles or progress - keep them
      
      // Update progress bar and status based on what's left
      const hasTranslated = loadSubtitlesFromStorage(currentVideoId) && loadSubtitlesFromStorage(currentVideoId).length > 0;
      if (hasTranslated) {
        // Keep current progress since translated subtitles exist
        const progress = calculateVideoTranslationProgress();
        updatePersistentProgressBar(progress.percentage, progress.status, progress.percentage < 100 ? 'بخشی از زیرنویس ترجمه شده است' : 'ترجمه کامل');
      } else {
        updatePersistentProgressBar(0, 'زیرنویس دریافت نشده', 'پیشرفت ترجمه ویدیو');
      }
      
      // Update original language status
      setTimeout(() => {
        updateOriginalLanguageStatus();
        // Also update button text
        const translateButton = document.querySelector('.subtitle-translate-button');
        if (translateButton && !translateButton.disabled) {
          translateButton.textContent = getTranslateButtonText();
        }
        // Refresh the entire UI
        addTranslateButton();
      }, 100);
      
      showNotification('زیرنویس اصلی پاک شد (ترجمه حفظ شد)');
    } catch (error) {
      console.error('[CLEAR_ORIGINAL] Error clearing original subtitles:', error);
      showNotification('خطا در پاک کردن زیرنویس اصلی: ' + error.message);
    }
  }
}

// Clear only translated subtitles (not original)
function clearTranslatedSubtitles() {
  
  // Show confirmation dialog
  if (confirm('آیا از پاک کردن ترجمه زیرنویس این ویدیو اطمینان دارید؟ (زیرنویس اصلی حفظ می‌شود)')) {
    if (!currentVideoId) {
      showNotification('خطا: شناسه ویدیو یافت نشد');
      return;
    }
    
    try {
      // Clear only translated subtitles for current video
      const storageKey = `youtube_subtitles_${currentVideoId}`;
      localStorage.removeItem(storageKey);
      
      // Also check for backup key
      const backupKey = `youtube_subtitles_backup_${currentVideoId}`;
      localStorage.removeItem(backupKey);
      
      // Clear translation progress as well
      const progressKey = `translation_progress_${currentVideoId}`;
      localStorage.removeItem(progressKey);
      
      // DON'T clear original language subtitles - keep them
      
      // Reset UI state for translated subtitles only
      isDisplayingSubtitles = false;
      isSubtitleVisible = false;
      translatedSubtitles = [];
      
      // Remove subtitle overlay
      removeExistingOverlay();
      
      // Update progress bar based on what's left
      const hasOriginal = hasOriginalLanguageSubtitles(currentVideoId);
      if (hasOriginal) {
        updatePersistentProgressBar(0, 'زیرنویس اصلی موجود است', 'پیشرفت ترجمه ویدیو');
      } else {
        updatePersistentProgressBar(0, 'زیرنویس دریافت نشده', 'پیشرفت ترجمه ویدیو');
      }
      
      // Update original language status
      setTimeout(() => {
        updateOriginalLanguageStatus();
        // Also update button text
        const translateButton = document.querySelector('.subtitle-translate-button');
        if (translateButton && !translateButton.disabled) {
          translateButton.textContent = getTranslateButtonText();
        }
        // Refresh the entire UI
        addTranslateButton();
      }, 100);
      
      showNotification('ترجمه زیرنویس پاک شد (زیرنویس اصلی حفظ شد)');
    } catch (error) {
      console.error('[CLEAR_TRANSLATED] Error clearing translated subtitles:', error);
      showNotification('خطا در پاک کردن ترجمه: ' + error.message);
    }
  }
}

// Clear all subtitles (both translated and original)
function clearSavedSubtitles() {
  
  // Show confirmation dialog
  if (confirm('آیا از پاک کردن تمام زیرنویس‌های ذخیره شده این ویدیو اطمینان دارید؟ (شامل زیرنویس اصلی و ترجمه)')) {
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
      
      // Clear original language subtitles as well
      const originalLanguageKey = `originalLanguage_${currentVideoId}`;
      localStorage.removeItem(originalLanguageKey);
      
      // Reset UI state
      isDisplayingSubtitles = false;
      isSubtitleVisible = false;
        translatedSubtitles = [];
      
      // Remove subtitle overlay
      removeExistingOverlay();
      
      // Reset progress bar to zero
      updatePersistentProgressBar(0, 'زیرنویس دریافت نشده', 'پیشرفت ترجمه ویدیو');
      
      // Update original language status
      setTimeout(() => {
        updateOriginalLanguageStatus();
        // Also update button text
        const translateButton = document.querySelector('.subtitle-translate-button');
        if (translateButton && !translateButton.disabled) {
          translateButton.textContent = getTranslateButtonText();
        }
        // Refresh the entire UI
        addTranslateButton();
      }, 100);
      
      showNotification('تمام زیرنویس‌های ذخیره شده این ویدیو پاک شد');
    } catch (error) {
      console.error('[CLEAR_ALL] Error clearing saved subtitles:', error);
      showNotification('خطا در پاک کردن زیرنویس: ' + error.message);
    }
  }
}

// Show saved subtitles viewer window
function showSavedSubtitlesViewer() {
  
  if (!currentVideoId) {
    showNotification('خطا: شناسه ویدیو یافت نشد');
    return;
  }
  
  // Load saved subtitles (translated)
  const savedSubtitles = loadSubtitlesFromStorage(currentVideoId);
  
  // Load original subtitles
  const originalSubtitlesData = getOriginalLanguageSubtitles(currentVideoId);
  
  // Check if we have ANY subtitles (translated or original)
  const hasTranslated = savedSubtitles && savedSubtitles.length > 0;
  const hasOriginal = originalSubtitlesData && originalSubtitlesData.trim().length > 0;
  
  
  if (!hasTranslated && !hasOriginal) {
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
  // Set title based on what subtitles we have
  let titleText = 'زیرنویس ذخیره شده';
  if (hasTranslated && hasOriginal) {
    titleText = `زیرنویس ذخیره شده (${savedSubtitles.length} ترجمه + اصلی)`;
  } else if (hasTranslated) {
    titleText = `زیرنویس ذخیره شده (${savedSubtitles.length} ترجمه)`;
  } else if (hasOriginal) {
    titleText = 'زیرنویس ذخیره شده (فقط اصلی)';
  }
  title.textContent = titleText;
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

  // Create clear button - only show if we have translated subtitles
  const clearButton = document.createElement('button');
  clearButton.textContent = 'پاک کردن ترجمه';
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
  
  if (!hasTranslated) {
    clearButton.disabled = true;
    clearButton.style.opacity = '0.5';
    clearButton.style.cursor = 'not-allowed';
    clearButton.title = 'زیرنویس ترجمه شده موجود نیست';
  } else {
  clearButton.addEventListener('click', () => {
    modalOverlay.remove();
      clearTranslatedSubtitles();
  });
  clearButton.addEventListener('mouseenter', () => {
    clearButton.style.backgroundColor = '#d32f2f';
  });
  clearButton.addEventListener('mouseleave', () => {
    clearButton.style.backgroundColor = '#f44336';
  });
  }

  // Create clear original button - only show if we have original subtitles but no translated subtitles
  const clearOriginalButton = document.createElement('button');
  clearOriginalButton.textContent = 'پاک کردن زیرنویس اصلی';
  clearOriginalButton.style.backgroundColor = '#FF5722';
  clearOriginalButton.style.color = 'white';
  clearOriginalButton.style.border = 'none';
  clearOriginalButton.style.borderRadius = '4px';
  clearOriginalButton.style.padding = '8px 16px';
  clearOriginalButton.style.fontSize = '14px';
  clearOriginalButton.style.cursor = 'pointer';
  clearOriginalButton.style.marginBottom = '15px';
  clearOriginalButton.style.width = '100%';
  clearOriginalButton.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
  
  // Only show this button if we have original subtitles but no translated subtitles
  if (hasOriginal && !hasTranslated) {
    clearOriginalButton.addEventListener('click', () => {
      modalOverlay.remove();
      clearOriginalSubtitles();
    });
    clearOriginalButton.addEventListener('mouseenter', () => {
      clearOriginalButton.style.backgroundColor = '#E64A19';
    });
    clearOriginalButton.addEventListener('mouseleave', () => {
      clearOriginalButton.style.backgroundColor = '#FF5722';
    });
  } else {
    // Hide the button if conditions are not met
    clearOriginalButton.style.display = 'none';
  }

  // Load original language subtitles for both download and display
  const originalSubtitlesContent = getOriginalLanguageSubtitles(currentVideoId);

  // Create download buttons container
  const downloadContainer = document.createElement('div');
  downloadContainer.style.display = 'flex';
  downloadContainer.style.gap = '10px';
  downloadContainer.style.marginBottom = '15px';

  // Create download original button
  const downloadOriginalButton = document.createElement('button');
  downloadOriginalButton.textContent = 'دانلود زیرنویس اصلی';
  downloadOriginalButton.style.backgroundColor = '#FF9800';
  downloadOriginalButton.style.color = 'white';
  downloadOriginalButton.style.border = 'none';
  downloadOriginalButton.style.borderRadius = '4px';
  downloadOriginalButton.style.padding = '8px 16px';
  downloadOriginalButton.style.fontSize = '14px';
  downloadOriginalButton.style.cursor = 'pointer';
  downloadOriginalButton.style.flex = '1';
  downloadOriginalButton.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
  
  // Check if original subtitles exist
  if (!hasOriginal) {
    downloadOriginalButton.disabled = true;
    downloadOriginalButton.style.opacity = '0.5';
    downloadOriginalButton.style.cursor = 'not-allowed';
    downloadOriginalButton.title = 'زیرنویس اصلی موجود نیست';
  } else {
    downloadOriginalButton.addEventListener('click', () => {
      downloadSubtitleFile(originalSubtitlesData, `${currentVideoId}_original.srt`);
      showNotification('دانلود زیرنویس اصلی شروع شد');
    });
  }
  
  downloadOriginalButton.addEventListener('mouseenter', () => {
    if (!downloadOriginalButton.disabled) {
      downloadOriginalButton.style.backgroundColor = '#F57C00';
    }
  });
  downloadOriginalButton.addEventListener('mouseleave', () => {
    if (!downloadOriginalButton.disabled) {
      downloadOriginalButton.style.backgroundColor = '#FF9800';
    }
  });

  // Create download translation button
  const downloadTranslationButton = document.createElement('button');
  downloadTranslationButton.textContent = 'دانلود ترجمه زیرنویس';
  downloadTranslationButton.style.backgroundColor = '#4CAF50';
  downloadTranslationButton.style.color = 'white';
  downloadTranslationButton.style.border = 'none';
  downloadTranslationButton.style.borderRadius = '4px';
  downloadTranslationButton.style.padding = '8px 16px';
  downloadTranslationButton.style.fontSize = '14px';
  downloadTranslationButton.style.cursor = 'pointer';
  downloadTranslationButton.style.flex = '1';
  downloadTranslationButton.style.fontFamily = "'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif";
  
  // Check if translated subtitles exist
  if (!hasTranslated) {
    downloadTranslationButton.disabled = true;
    downloadTranslationButton.style.opacity = '0.5';
    downloadTranslationButton.style.cursor = 'not-allowed';
    downloadTranslationButton.title = 'زیرنویس ترجمه شده موجود نیست';
  } else {
    downloadTranslationButton.addEventListener('click', () => {
      const translatedSrt = convertSubtitlesToSrt(savedSubtitles);
      downloadSubtitleFile(translatedSrt, `${currentVideoId}_translated.srt`);
      showNotification('دانلود ترجمه زیرنویس شروع شد');
    });
    downloadTranslationButton.addEventListener('mouseenter', () => {
      downloadTranslationButton.style.backgroundColor = '#45A049';
    });
    downloadTranslationButton.addEventListener('mouseleave', () => {
      downloadTranslationButton.style.backgroundColor = '#4CAF50';
    });
  }

  // Add buttons to download container
  downloadContainer.appendChild(downloadOriginalButton);
  downloadContainer.appendChild(downloadTranslationButton);
  
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
  
  // Load original language subtitles for subtitle matching
  let originalSubtitles = [];
  if (originalSubtitlesData) {
    originalSubtitles = parseSrtToSubtitles(originalSubtitlesData);
  }
  
  // Determine which subtitles to display
  let subtitlesToDisplay = [];
  if (hasTranslated) {
    subtitlesToDisplay = savedSubtitles;
  } else if (hasOriginal) {
    subtitlesToDisplay = originalSubtitles;
  }
  
  // Add subtitles to container
  subtitlesToDisplay.forEach((subtitle, index) => {
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
    timeInfo.style.direction = 'ltr';
    timeInfo.textContent = `${formatSecondsToTime(subtitle.startTime)} - ${formatSecondsToTime(subtitle.endTime)}`;
    
    subtitleItem.appendChild(timeInfo);
    
    // If displaying translated subtitles, show original as secondary text
    if (hasTranslated) {
      // Find matching original subtitle by time
      const matchingOriginal = originalSubtitles.find(orig => 
        Math.abs(orig.startTime - subtitle.startTime) < 1.0
      );
      
      // Add original text if found
      if (matchingOriginal) {
        const originalContent = document.createElement('div');
        originalContent.style.color = '#FFB74D';
        originalContent.style.fontSize = '13px';
        originalContent.style.lineHeight = '1.4';
        originalContent.style.marginBottom = '6px';
        originalContent.style.padding = '4px 6px';
        originalContent.style.backgroundColor = 'rgba(255, 183, 77, 0.1)';
        originalContent.style.borderRadius = '3px';
        originalContent.style.fontStyle = 'italic';
        originalContent.style.direction = 'ltr';
        originalContent.textContent = `${matchingOriginal.text}`;
        
        subtitleItem.appendChild(originalContent);
      }
      
      // Main translated text
    const textContent = document.createElement('div');
    textContent.style.color = 'white';
    textContent.style.fontSize = '14px';
    textContent.style.lineHeight = '1.4';
    textContent.textContent = subtitle.text;
    
    subtitleItem.appendChild(textContent);
    } else {
      // If displaying only original subtitles, show them as main content
      const textContent = document.createElement('div');
      textContent.style.color = '#FFB74D';  // Use original color as main color
      textContent.style.fontSize = '14px';
      textContent.style.lineHeight = '1.4';
      textContent.style.direction = 'ltr';
      textContent.textContent = subtitle.text;
      
             subtitleItem.appendChild(textContent);
     }
    
    subtitlesContainer.appendChild(subtitleItem);
  });
  
  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(refreshButton);
  modalContent.appendChild(clearButton);
  
  // Add clear original button only if it should be visible
  if (hasOriginal && !hasTranslated) {
    modalContent.appendChild(clearOriginalButton);
  }
  
  modalContent.appendChild(downloadContainer);
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
  
}

// Download subtitle file function
function downloadSubtitleFile(content, filename) {
  try {
    // Create a blob with the subtitle content
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element for download
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    
    // Add to document, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the temporary URL
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('[DOWNLOAD] Error downloading subtitle file:', error);
    showNotification('خطا در دانلود فایل: ' + error.message);
  }
}

// Force create settings box with body as container (fallback)
function forceCreateSettingsBox() {
  
  // Remove existing settings box if any
  removeSettingsBox();
  
  // Try to find video container first, fallback to body
  let container = findYouTubeVideoContainer();
  if (!container) {
    container = document.body;
  } else {
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
  
  
  // Add translate button (without notification since we already showed one in init)
  setTimeout(() => {
    addTranslateButton();
  }, 300);
  
  return content;
}

// Show notification function
function showNotification(message) {
  
  // Create or get notification container
  let notificationContainer = document.getElementById('youtube-translator-notifications');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'youtube-translator-notifications';
    notificationContainer.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      max-width: 320px !important;
    `;
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    background-color: rgba(30, 84, 0, 0.9) !important;
    color: white !important;
    padding: 10px 15px !important;
    border-radius: 5px !important;
    font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', 'Arial', sans-serif !important;
    font-size: 14px !important;
    direction: rtl !important;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
    pointer-events: auto !important;
    opacity: 0 !important;
    transform: translateX(100%) !important;
    transition: all 0.3s ease !important;
    word-wrap: break-word !important;
    line-height: 1.4 !important;
  `;
  notification.textContent = message;
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      // Animate out
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
          
          // Remove container if no notifications left
          if (notificationContainer.children.length === 0) {
            notificationContainer.remove();
    }
        }
      }, 300);
    }
  }, 5000);
}

// Setup navigation observer function
function setupNavigationObserver() {
  
  // Disconnect existing observer if any
  if (navigationObserver) {
    navigationObserver.disconnect();
  }
  
  // Create new observer
  navigationObserver = new MutationObserver((mutations) => {
    const currentUrl = window.location.href;
    
    // Extract video IDs for comparison instead of full URLs
    let currentVideoId = null;
    let lastVideoId = null;
    
    try {
      currentVideoId = new URLSearchParams(new URL(currentUrl).search).get('v');
      lastVideoId = lastProcessedUrl ? new URLSearchParams(new URL(lastProcessedUrl).search).get('v') : null;
    } catch (e) {
      return;
    }
    
    // Only log when video ID actually changes
    if (currentVideoId !== lastVideoId) {
    }
    
    // Check if video ID actually changed (ignore URL parameter changes like &sttick=0)
    const videoIdChanged = currentVideoId !== lastVideoId;
    
    if (videoIdChanged && currentUrl.includes('youtube.com/watch')) {
        lastProcessedUrl = currentUrl;
        
        // Update current video ID
      if (currentVideoId && currentVideoId !== globalThis.currentVideoId) {
        globalThis.currentVideoId = currentVideoId;
        }
        
        // Small delay to let YouTube load
        setTimeout(() => {
        if (!isInitializing) {
          init();
        } else {
        }
        }, 1000);
    } else if (lastProcessedUrl && lastProcessedUrl.includes('youtube.com/watch') && !currentUrl.includes('youtube.com/watch')) {
        // User left YouTube video page completely
        clearCurrentVideoData();
        lastProcessedUrl = currentUrl;
    } else if (currentUrl === lastProcessedUrl) {
      // Same URL, no change needed
    } else {
      // URL changed but same video ID
      lastProcessedUrl = currentUrl;
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
  
  // Activation Code section
  const activationSection = document.createElement('div');
  activationSection.style.cssText = `
    margin-top: 16px;
    padding: 12px;
    background: rgba(255, 107, 53, 0.1);
    border: 1px solid rgba(255, 107, 53, 0.3);
    border-radius: 6px;
  `;
  
  const activationTitle = document.createElement('div');
  activationTitle.textContent = 'کد فعالسازی رفع محدودیت';
  activationTitle.style.cssText = `
    color: #ff6b35;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
  `;
  
  const activationInput = document.createElement('input');
  activationInput.type = 'text';
  activationInput.placeholder = 'کد فعالسازی خود را وارد کنید...';
  activationInput.value = localStorage.getItem('activation_code') || '';
  activationInput.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #555;
    border-radius: 4px;
    background: #2a2a2a;
    color: #fff;
    font-size: 13px;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    direction: ltr;
    text-align: left;
    box-sizing: border-box;
  `;
  
  const activationInfo = document.createElement('div');
  activationInfo.innerHTML = '⚠️  در حالت رایگان به دلیل محدودیت های سرور در تولید زیرنویس اصلی، احتمال محدودیت در درخواست ها وجود دارد.<br/>برای رفع این محدودیت، کد فعالسازی را وارد کنید.';
  activationInfo.style.cssText = `
    font-size: 11px;
    color: #ffcc00;
    text-align: center;
    line-height: 1.4;
    margin-top: 8px;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    background: rgba(255, 204, 0, 0.1);
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid rgba(255, 204, 0, 0.3);
  `;
  
  activationSection.appendChild(activationTitle);
  activationSection.appendChild(activationInput);
  activationSection.appendChild(activationInfo);
  
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
    const activationCode = activationInput.value.trim();
    
    if (!apiToken) {
      showNotification('⚠️ لطفاً API Token را وارد کنید');
      tokenInput.focus();
      return;
    }
    
    // Save settings based on provider
    localStorage.setItem('api_provider', selectedProvider);
    
    // Save chunk duration setting
    localStorage.setItem('chunkDurationMinutes', currentChunkDuration.toString());
    
    // Save activation code
    localStorage.setItem('activation_code', activationCode);
    
    if (selectedProvider === 'gemini') {
      localStorage.setItem('geminiApiKey', apiToken);
      localStorage.setItem('openrouter_model', 'gemini-2.0-flash');
      showNotification('✅ تنظیمات Gemini، کد فعالسازی و مدت زمان بخش‌ها ذخیره شد');
    } else {
      localStorage.setItem('openrouter_api_key', apiToken);
      if (modelName) {
        localStorage.setItem('openrouter_model', modelName);
      }
      showNotification('✅ تنظیمات OpenRouter، کد فعالسازی و مدت زمان بخش‌ها ذخیره شد');
    }
    
    hideApiKeyPanel();
  });
  
  resetButton.addEventListener('click', () => {
    const selectedProvider = providerSelect.value;
    
    // Reset activation code
    localStorage.removeItem('activation_code');
    activationInput.value = '';
    
    if (selectedProvider === 'gemini') {
      localStorage.removeItem('geminiApiKey');
      tokenInput.value = '';
      showNotification('🔄 تنظیمات Gemini و کد فعالسازی ریست شد');
    } else {
      localStorage.removeItem('openrouter_api_key');
      localStorage.setItem('openrouter_model', 'deepseek/deepseek-chat-v3-0324:free');
      tokenInput.value = '';
      modelInput.value = 'deepseek/deepseek-chat-v3-0324:free';
      showNotification('🔄 تنظیمات OpenRouter و کد فعالسازی ریست شد');
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
  
  activationInput.addEventListener('keypress', (e) => {
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
  content.appendChild(activationSection);
  content.appendChild(buttonsSection);
  content.appendChild(versionSection);
  content.appendChild(contactSection);
  
  apiPanel.appendChild(header);
  apiPanel.appendChild(content);
  
  // Add to document.body instead of video container to ensure highest z-index
  document.body.appendChild(backdrop);
  document.body.appendChild(apiPanel);
  
}

// Show API key panel function
function showApiKeyPanel() {
  
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

// Dummy implementations for missing functions
function addSyncControls() {
}

async function refreshSubtitles() {
  
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
  
  
  // Store the total number of original subtitles for progress calculation
  try {
    const allSubtitles = await extractYouTubeSubtitles(currentVideoId);
    if (allSubtitles && allSubtitles.length > 0) {
      const originalSubtitlesKey = `original_subtitles_count_${currentVideoId}`;
      localStorage.setItem(originalSubtitlesKey, allSubtitles.length.toString());
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
  
  // Show status in progress bar instead of button area
  const progress = calculateVideoTranslationProgress();
  // Only show "بخشی از زیرنویس ترجمه شده است" when progress is less than 100%
  const title = progress.percentage < 100 ? 'بخشی از زیرنویس ترجمه شده است' : 'ترجمه کامل';
  updatePersistentProgressBar(
    progress.percentage,
    progress.status,
    title
  );
}

function filterSubtitlesByTimeRange(subtitles) {
  
  if (!subtitles || subtitles.length === 0) {
    return [];
  }
  
  // Get time range settings
  const startTimeStr = localStorage.getItem('translationStartTime') || '';
  const endTimeStr = localStorage.getItem('translationEndTime') || '';
  
  // If no time range is set, return all subtitles
  if (!startTimeStr && !endTimeStr) {
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
    return subtitles;
  }
  
  // If end is 0 but start is set, translate from start to end of video
  if (endSeconds === 0 && startSeconds > 0) {
    endSeconds = Infinity;
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
  
  
  return filteredSubtitles;
}

