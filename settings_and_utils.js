function createOriginalLanguageControls() {
  // Make sure we load the setting before creating the checkbox
  loadOriginalLanguageSetting();
  
  // Create container
  const container = document.createElement('div');
  container.className = 'original-language-controls';
  
  // Create label
  const label = document.createElement('div');
  label.className = 'original-language-label';
  label.textContent = 'زبان اصلی :';
  
  // Create checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'original-language-checkbox';
  console.log(`[CHECKBOX] Creating checkbox with showOriginalLanguage: ${showOriginalLanguage}`);
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
// Note: Original subtitle overlay functions moved to subtitle_engine.js

// Original subtitle position management functions
function loadOriginalSubtitlePosition() {
  try {
    const saved = localStorage.getItem('youtube_translator_original_position');
    if (saved) {
      originalSubtitleVerticalPosition = parseInt(saved);
    }
  } catch (error) {
    console.error('Error loading original subtitle position:', error);
  }
}

function saveOriginalSubtitlePosition(position) {
  try {
    originalSubtitleVerticalPosition = position;
    localStorage.setItem('youtube_translator_original_position', position.toString());
  } catch (error) {
    console.error('Error saving original subtitle position:', error);
  }
}

function updateOriginalSubtitlePosition() {
  const overlay = document.querySelector('.original-subtitle-overlay');
  if (overlay) {
    overlay.style.top = originalSubtitleVerticalPosition + 'px';
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
  try {
    const container = document.createElement('div');
    container.className = 'original-position-container';
  
  // Create position controls
  const controls = document.createElement('div');
  controls.className = 'original-position-controls';
  
  const label = document.createElement('div');
  label.className = 'original-position-label';
  label.textContent = 'جابجایی زبان اصلی';
  
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
  
  // Create status controls
  const statusControls = document.createElement('div');
  statusControls.className = 'original-status-controls';
  
  const statusLabel = document.createElement('div');
  statusLabel.className = 'original-status-label';
  statusLabel.textContent = 'وضعیت :';
  
  const statusValue = document.createElement('div');
  statusValue.className = 'original-status-value';
  
  // Set initial status using the same logic as updateOriginalLanguageStatus
  const currentVideoId = getCurrentVideoId();
  
  // Check translation progress first
  const progress = calculateVideoTranslationProgress();
  
  if (progress.hasTranslation && progress.percentage < 100) {
    // If we have partial translation (less than 100%)
    statusValue.textContent = 'بخشی از ترجمه دریافت شده';
    statusValue.style.color = '#FF9800'; // Orange color for partial
  } else if (progress.hasTranslation && progress.percentage >= 100) {
    // If we have complete translation (100%)
    statusValue.textContent = 'ترجمه کامل دریافت شده';
    statusValue.style.color = '#4CAF50'; // Green color for complete
  } else if (hasOriginalLanguageSubtitles(currentVideoId)) {
    // If we have original subtitles but no translation
    statusValue.textContent = 'زیرنویس اصلی موجود است';
    statusValue.style.color = '#4CAF50'; // Green color
  } else {
    // No subtitles at all
    statusValue.textContent = 'زیرنویس دریافت نشده';
    statusValue.style.color = '#ff6b6b'; // Red color
  }
  
  statusControls.appendChild(statusLabel);
  statusControls.appendChild(statusValue);
  
  // Add both controls to container
  container.appendChild(controls);
  container.appendChild(statusControls);
  
  return container;
  } catch (error) {
    console.error('[DEBUG] Error in createOriginalPositionControls:', error);
    // Return a simple container as fallback
    const fallbackContainer = document.createElement('div');
    fallbackContainer.textContent = 'خطا در بارگذاری کنترل‌ها';
    return fallbackContainer;
  }
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
  
  // Update position display - use specific ID to avoid conflicts
  const positionValue = document.getElementById('subtitle-position-display');
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
  label.textContent = 'جابجایی ترجمه:';
  
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
  positionValue.id = 'subtitle-position-display'; // Add unique ID
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

// Subtitle time offset management functions
function loadSubtitleTimeOffset() {
  try {
    const savedOffset = localStorage.getItem('subtitleTimeOffset');
    if (savedOffset !== null) {
      const offset = parseFloat(savedOffset);
      if (!isNaN(offset) && offset >= -30 && offset <= 30) {
        subtitleTimeOffset = offset;
        return offset;
      } else {
        subtitleTimeOffset = 0;
      }
    } else {
      subtitleTimeOffset = 0;
    }
  } catch (error) {
    console.error('Error loading subtitle time offset:', error);
    subtitleTimeOffset = 0;
  }
  return 0;
}

function saveSubtitleTimeOffset(offset) {
  localStorage.setItem('subtitleTimeOffset', offset.toString());
  subtitleTimeOffset = offset;
}

function increaseSubtitleTimeOffset() {
  if (subtitleTimeOffset < 30) {
    subtitleTimeOffset += 0.5;
    saveSubtitleTimeOffset(subtitleTimeOffset);
    updateSubtitleTimeOffsetDisplay();
    showNotification(`هماهنگی زمان: +${subtitleTimeOffset.toFixed(1)}s`);
  } else {
    showNotification('حداکثر تأخیر زمانی رسیده‌اید');
  }
}

function decreaseSubtitleTimeOffset() {
  if (subtitleTimeOffset > -30) {
    subtitleTimeOffset -= 0.5;
    saveSubtitleTimeOffset(subtitleTimeOffset);
    updateSubtitleTimeOffsetDisplay();
    showNotification(`هماهنگی زمان: ${subtitleTimeOffset.toFixed(1)}s`);
  } else {
    showNotification('حداقل تأخیر زمانی رسیده‌اید');
  }
}

function resetSubtitleTimeOffset() {
  subtitleTimeOffset = 0;
  saveSubtitleTimeOffset(subtitleTimeOffset);
  updateSubtitleTimeOffsetDisplay();
  showNotification('هماهنگی زمان بازنشانی شد');
}

function updateSubtitleTimeOffsetDisplay() {
  const offsetValue = document.querySelector('.subtitle-time-offset-value');
  if (offsetValue) {
    const sign = subtitleTimeOffset >= 0 ? '+' : '';
    offsetValue.textContent = `${sign}${subtitleTimeOffset.toFixed(1)}s`;
  }
}

// Create subtitle time synchronization controls
function createSubtitleTimeSyncControls() {
  // Load current time offset
  loadSubtitleTimeOffset();
  
  // Create container
  const container = document.createElement('div');
  container.className = 'subtitle-position-controls'; // Reuse same styling
  
  // Create label
  const label = document.createElement('div');
  label.className = 'subtitle-position-label';
  label.textContent = 'هماهنگی زمان:';
  
  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'subtitle-position-buttons';
  
  // Create forward button (increase delay)
  const forwardButton = document.createElement('button');
  forwardButton.className = 'subtitle-position-button';
  forwardButton.textContent = '+';
  forwardButton.title = 'تأخیر زیرنویس (+0.5 ثانیه)';
  forwardButton.addEventListener('click', increaseSubtitleTimeOffset);
  
  // Create time offset display
  const offsetValue = document.createElement('div');
  offsetValue.className = 'subtitle-time-offset-value subtitle-position-value'; // Reuse styling
  const sign = subtitleTimeOffset >= 0 ? '+' : '';
  offsetValue.textContent = `${sign}${subtitleTimeOffset.toFixed(1)}s`;
  
  // Create backward button (decrease delay)
  const backwardButton = document.createElement('button');
  backwardButton.className = 'subtitle-position-button';
  backwardButton.textContent = '-';
  backwardButton.title = 'تقدیم زیرنویس (-0.5 ثانیه)';
  backwardButton.addEventListener('click', decreaseSubtitleTimeOffset);
  
  // Create reset button
  const resetButton = document.createElement('button');
  resetButton.className = 'subtitle-position-button';
  resetButton.textContent = '0';
  resetButton.title = 'بازنشانی هماهنگی زمان';
  resetButton.style.minWidth = '30px';
  resetButton.addEventListener('click', resetSubtitleTimeOffset);
  
  // Assemble buttons
  buttonsContainer.appendChild(backwardButton);
  buttonsContainer.appendChild(offsetValue);
  buttonsContainer.appendChild(forwardButton);
  buttonsContainer.appendChild(resetButton);
  
  // Assemble container
  container.appendChild(label);
  container.appendChild(buttonsContainer);
  
  return container;
}

// Subtitle font size management functions
function loadSubtitleFontSize() {
  try {
    const savedSize = localStorage.getItem('subtitleFontSize');
    if (savedSize !== null) {
      const size = parseInt(savedSize);
      if (!isNaN(size) && size >= 10 && size <= 40) {
        subtitleFontSize = size;
        return size;
      } else {
        subtitleFontSize = 18;
      }
    } else {
      subtitleFontSize = 18;
    }
  } catch (error) {
    console.error('Error loading subtitle font size:', error);
    subtitleFontSize = 18;
  }
  return 18;
}

function saveSubtitleFontSize(size) {
  localStorage.setItem('subtitleFontSize', size.toString());
  subtitleFontSize = size;
}

function updateSubtitleFontSize() {
  
  // Update all subtitle text elements
  const subtitleCurrent = document.getElementById('subtitle-current');
  const subtitlePrevious = document.getElementById('subtitle-previous');
  const subtitleNext = document.getElementById('subtitle-next');
  
  if (subtitleCurrent) {
    subtitleCurrent.style.setProperty('font-size', `${subtitleFontSize}px`, 'important');
  } else {
  }
  
  if (subtitlePrevious) {
    subtitlePrevious.style.setProperty('font-size', `${Math.round(subtitleFontSize * 0.8)}px`, 'important');
  }
  
  if (subtitleNext) {
    subtitleNext.style.setProperty('font-size', `${Math.round(subtitleFontSize * 0.8)}px`, 'important');
  }
  
  // Update font size display in control panel
  const fontSizeValue = document.querySelector('.subtitle-font-size-value');
  if (fontSizeValue) {
    fontSizeValue.textContent = `${subtitleFontSize}px`;
  } else {
  }
  
  // Also update the overlay style (fallback)
  const overlay = document.querySelector('.subtitle-overlay');
  if (overlay) {
    overlay.style.fontSize = `${subtitleFontSize}px`;
  } else {
  }
}

function increaseSubtitleFontSize() {
  if (subtitleFontSize < 40) {
    subtitleFontSize += 2;
    saveSubtitleFontSize(subtitleFontSize);
    updateSubtitleFontSize();
    showNotification(`اندازه فونت: ${subtitleFontSize}px`);
  } else {
    showNotification('حداکثر اندازه فونت رسیده‌اید');
  }
}

function decreaseSubtitleFontSize() {
  if (subtitleFontSize > 10) {
    subtitleFontSize -= 2;
    saveSubtitleFontSize(subtitleFontSize);
    updateSubtitleFontSize();
    showNotification(`اندازه فونت: ${subtitleFontSize}px`);
  } else {
    showNotification('حداقل اندازه فونت رسیده‌اید');
  }
}

// Create subtitle font size controls
function createSubtitleFontSizeControls() {
  // Load current font size
  loadSubtitleFontSize();
  
  // Create container
  const container = document.createElement('div');
  container.className = 'subtitle-position-controls'; // Reuse same styling
  
  // Create label
  const label = document.createElement('div');
  label.className = 'subtitle-position-label';
  label.textContent = 'اندازه زیرنویس:';
  
  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'subtitle-position-buttons';
  
  // Create increase button
  const increaseButton = document.createElement('button');
  increaseButton.className = 'subtitle-position-button';
  increaseButton.textContent = '+';
  increaseButton.title = 'بزرگ کردن فونت';
  increaseButton.addEventListener('click', increaseSubtitleFontSize);
  
  // Create font size display
  const fontSizeValue = document.createElement('div');
  fontSizeValue.className = 'subtitle-font-size-value subtitle-position-value'; // Reuse styling
  fontSizeValue.textContent = `${subtitleFontSize}px`;
  
  // Create decrease button
  const decreaseButton = document.createElement('button');
  decreaseButton.className = 'subtitle-position-button';
  decreaseButton.textContent = '-';
  decreaseButton.title = 'کوچک کردن فونت';
  decreaseButton.addEventListener('click', decreaseSubtitleFontSize);
  
  // Assemble buttons
  buttonsContainer.appendChild(increaseButton);
  buttonsContainer.appendChild(fontSizeValue);
  buttonsContainer.appendChild(decreaseButton);
  
  // Assemble container
  container.appendChild(label);
  container.appendChild(buttonsContainer);
  
  return container;
}

// Load saved settings

// Test functions for debugging
window.testOriginalLanguage = function() {
  // Force toggle
  toggleOriginalLanguage();
  
  showNotification('تست زبان اصلی - بررسی کنسول را ببینید');
};

window.forceShowOriginalTest = function() {
  
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
    
    showNotification('تست زیرنویس اصلی - باید متن قرمز در بالای ویدیو ببینید');
    
    // Auto hide after 10 seconds
setTimeout(() => {
      overlay.style.display = 'none';
    }, 10000);
  } else {
    console.error('Failed to create test overlay');
    showNotification('خطا در ایجاد تست زیرنویس اصلی');
  }
};

// Initialize when page loads

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
} else {
  // Page already loaded, init immediately
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
  } catch (error) {
    console.error('[SETTINGS] Error saving previous/next subtitles setting:', error);
  }
}

// Toggle previous/next subtitles display
function togglePreviousNextSubtitles() {
  showPreviousNextSubtitles = !showPreviousNextSubtitles;
  savePreviousNextSubtitlesSetting(showPreviousNextSubtitles);
  
  
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
      showNotification('نمایش زیرنویس‌های قبل فعال شد');
} else {
      // Hide elements
      previousElement.style.display = 'none';
      nextElement.style.display = 'none';
      showNotification('نمایش زیرنویس‌های قبل غیرفعال شد');
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
  label.textContent = 'بخش قبلی';
  
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
  checkbox.title = 'فعال/غیرفعال کردن نمایش زیرنویس‌های قبل از زیرنویس اصلی';
  
  // Assemble container
  container.appendChild(label);
  container.appendChild(checkbox);
  
  return container;
}

// Parse SRT content to subtitle objects
function parseSrtToSubtitles(srtContent) {
  
  if (!srtContent || srtContent.trim() === '') {
    console.warn('[PARSE] Empty SRT content provided');
    return [];
  }

  try {
    
    const subtitles = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);
    
    console.log(`[PARSE] Parsing SRT with ${blocks.length} blocks`);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) {
        continue;
      }
      
      // Line 1: Subtitle index (ignore)
      // Line 2: Time range
      // Line 3+: Subtitle text
      
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) {
        continue;
      }
      
      const startTime = srtTimeStringToSeconds(timeMatch[1]);
      const endTime = srtTimeStringToSeconds(timeMatch[2]);
      const text = lines.slice(2).join('\n').trim();
      
      if (text && startTime !== null && endTime !== null) {
        const duration = endTime - startTime;
        subtitles.push({
          startTime: startTime,
          endTime: endTime,
          duration: duration,
          text: text
        });
        
        // Log first few subtitles to debug timing
        if (subtitles.length <= 3) {
          console.log(`[PARSE] Subtitle ${subtitles.length}: ${startTime.toFixed(2)} - ${endTime.toFixed(2)} (${duration.toFixed(2)}s): "${text.substring(0, 30)}..."`);
        }
      }
    }
    
    console.log(`[PARSE] Parsed ${subtitles.length} subtitles from SRT`);
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
  
  return xml;
}

// Force cancel all translation requests and reset states
function forceCancelAllTranslationRequests() {
  
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
    }

    // Step 7: Stop subtitle updates
    if (subtitleUpdateInterval) {
      clearInterval(subtitleUpdateInterval);
      subtitleUpdateInterval = null;
    }

    // Step 8: Remove overlays
    removeExistingOverlay();
    removeOriginalSubtitleOverlay();

    // Step 9: Show Persian notification
    showNotification('❌ تمام درخواست‌های ترجمه لغو شدند');


    // Step 10: Restore normal functionality after 30 seconds
    setTimeout(() => {
      try {
        window.XMLHttpRequest = originalXHR;
        window.fetch = originalFetch;
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