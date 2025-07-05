function extractYouTubeSubtitles(videoId) {
  
  return new Promise(async (resolve, reject) => {
    try {
      // Check if we already have cached original language subtitles
      const cachedSrtContent = getOriginalLanguageSubtitles(videoId);
      
      if (cachedSrtContent && cachedSrtContent.trim().length > 0) {
        
        const cachedSubtitles = parseSrtToSubtitles(cachedSrtContent);
        
        if (cachedSubtitles && cachedSubtitles.length > 0) {
          
          // Show notification
          showNotification(`استفاده از زیرنویس ذخیره شده (${cachedSubtitles.length} زیرنویس)`);
          
          // Update status display if it exists
          setTimeout(() => {
            updateOriginalLanguageStatus();
          }, 100);
          
          resolve(cachedSubtitles);
          return;
        } else {
        }
      } else {
      }
      
      // Method 0: Try new .NET API first (SRT format)
      try {
        // Get activation code from settings
        const activationCode = getActivationCode();
        
        // Prepare headers
        const headers = { 'Content-Type': 'text/plain' };
        
        // Add passkey header if activation code exists
        if (activationCode) {
          headers['friendKey'] = activationCode;
        }
        
        const response = await fetch('https://getsub.bot724.top/fetchCaption', {
          method: 'POST',
          headers: headers,
          body: `https://www.youtube.com/watch?v=${videoId}`
        });
        
        if (response.ok) {
          const srtContent = await response.text();
          
          if (srtContent && srtContent.trim().length > 0) {
            const apiSubtitles = parseSrtToSubtitles(srtContent);
            if (apiSubtitles && apiSubtitles.length > 0) {
              
              // Show notification
              showNotification(`دریافت زیرنویس جدید (${apiSubtitles.length} زیرنویس)`);
              
              // Save original language subtitles to localStorage
              const originalLanguageKey = `originalLanguage_${videoId}`;
              localStorage.setItem(originalLanguageKey, srtContent);
              
              // If we have translated subtitles, create proper timing by syncing with them
              if (translatedSubtitles && translatedSubtitles.length > 0) {
                // Create a copy for timing sync
                const syncedSubtitles = [...apiSubtitles];
                
                // Sync timing with translated subtitles
                if (syncedSubtitles.length === translatedSubtitles.length) {
                  for (let i = 0; i < syncedSubtitles.length; i++) {
                    syncedSubtitles[i].startTime = translatedSubtitles[i].startTime;
                    syncedSubtitles[i].endTime = translatedSubtitles[i].endTime;
                    syncedSubtitles[i].duration = translatedSubtitles[i].duration;
                  }
                } else {
                  // If counts don't match, sync as many as possible
                  const minLength = Math.min(syncedSubtitles.length, translatedSubtitles.length);
                  for (let i = 0; i < minLength; i++) {
                    syncedSubtitles[i].startTime = translatedSubtitles[i].startTime;
                    syncedSubtitles[i].endTime = translatedSubtitles[i].endTime;
                    syncedSubtitles[i].duration = translatedSubtitles[i].duration;
                  }
                }
                

                
                // Update status display if it exists
                setTimeout(() => {
                  updateOriginalLanguageStatus();
                  // Also update button text if needed
                  const translateButton = document.querySelector('.subtitle-translate-button');
                  if (translateButton && !translateButton.disabled) {
                    translateButton.textContent = getTranslateButtonText();
                  }
                  // Refresh the entire button UI to show "Show Saved Subtitles" button
                  addTranslateButton();
                }, 100);
                
                resolve(syncedSubtitles);
                return;
              } else {
                // No translated subtitles available yet - return original timing
                // but save the raw SRT for later sync

                
                // Update status display if it exists
                setTimeout(() => {
                  updateOriginalLanguageStatus();
                  // Also update button text if needed
                  const translateButton = document.querySelector('.subtitle-translate-button');
                  if (translateButton && !translateButton.disabled) {
                    translateButton.textContent = getTranslateButtonText();
                  }
                  // Refresh the entire button UI to show "Show Saved Subtitles" button
                  addTranslateButton();
                }, 100);
                
                resolve(apiSubtitles);
                return;
              }
            }
          }
        } else if (response.status === 404) {
          // Handle 404 error specifically
          showNotification('به علت محدودیت های یوتوب در این لحظه استخراج زیرنویس امکانپذیر نبود. لطفا چند لحظه بعد دوباره امتحان کنید.');
          reject(new Error('YouTube restrictions - 404'));
          return;
        } else if (response.status === 429) {
          // Handle 429 error specifically (Too Many Requests)
          showNotification('محدودیت تولید زیرنویس، ساعاتی دیگر دوباره تلاش کنید');
          reject(new Error('Rate limit exceeded - 429'));
          return;
        }
      } catch (apiError) {
      }

      // If API failed, show error message instead of using fallback methods
      console.error('[EXTRACT] API extraction failed');
      showNotification('استخراج زیرنویس فعلا امکانپذیر نیست');
      reject(new Error('استخراج زیرنویس فعلا امکانپذیر نیست'));
      
      /*
      // Method 1: Try to get subtitles from YouTube's internal API
      const subtitles = await tryExtractFromYouTubeAPI(videoId);
      if (subtitles && subtitles.length > 0) {
        resolve(subtitles);
        return;
      }
      
      // Method 2: Try to get caption tracks info and fetch them
      const captionSubtitles = await tryExtractFromCaptionTracks(videoId);
      if (captionSubtitles && captionSubtitles.length > 0) {
        resolve(captionSubtitles);
        return;
      }
      
      // Method 3: Try to extract from video page
      const pageSubtitles = await tryExtractFromVideoPage();
      if (pageSubtitles && pageSubtitles.length > 0) {
        resolve(pageSubtitles);
        return;
      }
      
      // Method 4: Try to get from YouTube's timedtext API
      const timedTextSubtitles = await tryExtractFromTimedTextAPI(videoId);
      if (timedTextSubtitles && timedTextSubtitles.length > 0) {
        resolve(timedTextSubtitles);
        return;
      }
      
      // Method 5: Create sample subtitles as fallback for testing
      const sampleSubtitles = createSampleSubtitles();
      if (sampleSubtitles && sampleSubtitles.length > 0) {
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
          break;
              }
            } catch (e) {
        continue;
      }
    }
    
    if (!captionTracks || captionTracks.length === 0) {
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
  return null;
}

    
    // Fetch the captions
    try {
      const response = await fetch(bestTrack.baseUrl);
      if (!response.ok) {
        console.error('[EXTRACT] Failed to fetch captions:', response.status);
        return null;
      }
      
      const xmlText = await response.text();
      
      // Parse XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const textElements = xmlDoc.getElementsByTagName('text');
      
      if (textElements.length === 0) {
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
    
    // Method 1: Look for ytInitialPlayerResponse in window object
    if (window.ytInitialPlayerResponse) {
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
            break;
          } catch (e) {
            continue;
          }
        }
      }
      
      if (playerResponse) break;
    }
    
    if (!playerResponse) {
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
    
    // Extract captions from player response
    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captions || captions.length === 0) {
      return null;
    }
    
    
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
      return null;
    }
    
    
    // Fetch the subtitle XML
    const response = await fetch(captionTrack.baseUrl);
    if (!response.ok) {
      console.error('[EXTRACT] Failed to fetch subtitle XML:', response.status);
      return null;
    }
    
    const xmlText = await response.text();
    
    // Parse the XML to extract subtitles
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const textElements = xmlDoc.getElementsByTagName('text');
    
    if (textElements.length === 0) {
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
    
    return subtitles;
    
  } catch (error) {
    console.error('[EXTRACT] Error in extractFromPlayerResponse:', error);
    return null;
  }
}

// Try to extract subtitles from video page elements
async function tryExtractFromVideoPage() {
  try {
    
    // Method 1: Try to find and click subtitle button to load subtitles
    const subtitleButton = document.querySelector('.ytp-subtitles-button, .ytp-cc-button');
    if (subtitleButton && !subtitleButton.classList.contains('ytp-button-active')) {
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
        break;
      }
    }
    
    if (subtitleElements.length === 0) {
      
      // Method 3: Try to extract from video player's internal state
      const video = document.querySelector('video');
      if (video && video.textTracks && video.textTracks.length > 0) {
        
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          if (track.kind === 'subtitles' || track.kind === 'captions') {
            
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
    return subtitles;
              }
            }
          }
        } else {
        }
      } catch (urlError) {
        continue;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('[EXTRACT] Error in tryExtractFromTimedTextAPI:', error);
    return null;
  }
}

// Convert subtitles to SRT format instead of XML
function convertSubtitlesToSrt(subtitles) {
  
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
      
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TRANSLATE] OpenRouter API error response:', errorText);
        reject(new Error(`OpenRouter API error: ${response.status} - ${errorText}`));
        return;
      }
  
      const data = await response.json();
      
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
      
      
      // Enable saved subtitles button after successful OpenRouter response
      enableSavedSubtitlesButton();
      
      resolve(translatedText);
      
    } catch (error) {
      console.error('[TRANSLATE] Error in translateWithOpenRouter:', error);
      reject(error);
    }
  });
}

// Parse translated SRT response
function parseTranslatedSrt(srtText) {
  
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
      
      return subtitles;
    } catch (regexError) {
      console.error('[PARSE] Regex fallback also failed:', regexError);
    }
    
    return [];
  }
}

function translateWithGemini(xml) {
  
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
      
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
  
  if (!response.ok) {
        const errorText = await response.text();
        console.error('[TRANSLATE] Gemini API error response:', errorText);
        reject(new Error(`Gemini API error: ${response.status} - ${errorText}`));
        return;
  }
  
  const data = await response.json();
      
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
      
      
      // Enable saved subtitles button after successful Gemini response
      enableSavedSubtitlesButton();
      
      resolve(translatedText);
      
    } catch (error) {
      console.error('[TRANSLATE] Error in translateWithGemini:', error);
      reject(error);
    }
  });
}

function parseTranslatedXml(xml) {
  
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
    
    return subtitles;
    
  } catch (error) {
    console.error('[PARSE] Error parsing translated XML:', error);
    
    // Fallback: try to extract text using regex
    try {
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
        
        return subtitles;
      }
    } catch (regexError) {
      console.error('[PARSE] Regex fallback also failed:', regexError);
    }
    
    return [];
  }
}

function directTranslateSubtitlesGemini(xml, nodes, apiKey) {
  return Promise.resolve('<xml></xml>');
}

function createSubtitleOverlay() {
  
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
  previousSubtitle.style.fontSize = `${Math.round(subtitleFontSize * 0.8)}px !important`;
  
  // Create current subtitle element
  const currentSubtitle = document.createElement('div');
  currentSubtitle.className = 'subtitle-text';
  currentSubtitle.id = 'subtitle-current';
  currentSubtitle.style.display = 'none';
  currentSubtitle.style.fontSize = `${subtitleFontSize}px !important`;
  
  // Create next subtitle element
  const nextSubtitle = document.createElement('div');
  nextSubtitle.className = 'subtitle-next';
  nextSubtitle.id = 'subtitle-next';
  nextSubtitle.style.display = 'none';
  nextSubtitle.style.fontSize = `${Math.round(subtitleFontSize * 0.8)}px !important`;
  
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
    
  return overlay;
}

function removeExistingOverlay() {
  
  const existingOverlay = document.getElementById('subtitle-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Don't remove original subtitle overlay here - let it be managed independently
  // removeOriginalSubtitleOverlay();
}

function startSubtitleUpdates() {
  
  // Stop any existing interval
  if (subtitleUpdateInterval) {
    clearInterval(subtitleUpdateInterval);
  }
  
  // Start new interval to update subtitles every 50ms for better synchronization
  subtitleUpdateInterval = setInterval(() => {
    updateCurrentSubtitle();
  }, 50);
  
}

function stopSubtitleUpdates() {
  
  if (subtitleUpdateInterval) {
    clearInterval(subtitleUpdateInterval);
    subtitleUpdateInterval = null;
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
      currentElement.textContent = subtitleContext.upcoming.text;
      currentElement.style.display = 'block';
      // currentElement.style.opacity = '0.6';
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
    
    // Update original subtitle overlay if enabled - do this IMMEDIATELY after main subtitle
    if (showOriginalLanguage) {
      // Update immediately without delay for perfect synchronization
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
  
  // Apply time offset
  const adjustedTime = currentTime + subtitleTimeOffset;
  
  // Find the next subtitle that will start after current time
  for (let i = 0; i < translatedSubtitles.length; i++) {
    const subtitle = translatedSubtitles[i];
    if (subtitle.startTime > adjustedTime) {
      return subtitle;
    }
  }
  
  return null;
}

// Create sample subtitles for testing when no real subtitles are found
function createSampleSubtitles() {
  
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
  
  return subtitles;
}

// Merge new subtitles with existing ones, avoiding duplicates
function mergeSubtitles(existingSubtitles, newSubtitles) {
  
  if (!existingSubtitles || existingSubtitles.length === 0) {
    return newSubtitles;
  }
  
  if (!newSubtitles || newSubtitles.length === 0) {
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

// Get activation code from settings
function getActivationCode() {
  const code = localStorage.getItem('activation_code');
  return code ? code.trim() : null;
}

// Check if activation code exists and is valid
function hasValidActivationCode() {
  const code = getActivationCode();
  return code && code.length > 0;
}

// Enable the saved subtitles button after first successful translation
function enableSavedSubtitlesButton() {
  try {
    const savedSubtitlesButton = document.querySelector('.subtitle-show-saved-button');
    if (savedSubtitlesButton) {
      // Enable the button (remove any disabled state)
      savedSubtitlesButton.disabled = false;
      savedSubtitlesButton.style.opacity = '1';
      savedSubtitlesButton.style.cursor = 'pointer';
      
      // Add a visual indicator that it's now available
      savedSubtitlesButton.style.backgroundColor = '#4CAF50'; // Green color to indicate it's active
      savedSubtitlesButton.style.transition = 'background-color 0.3s ease';
      
      // Reset to original color after a short time
      setTimeout(() => {
        savedSubtitlesButton.style.backgroundColor = '#2196F3'; // Back to original blue
      }, 2000);
      
    } else {
    }
  } catch (error) {
    console.error('[UI] Error enabling saved subtitles button:', error);
  }
}

function addSavedSubtitlesButtonIfNeeded() {
  
  if (!currentVideoId) {
    return;
  }
  
  // Check if we have saved subtitles
  const savedSubtitles = loadSubtitlesFromStorage(currentVideoId);
  if (!savedSubtitles || savedSubtitles.length === 0) {
    return;
  }
  
  
  // Find the button container
  const buttonContainer = document.querySelector('.subtitle-button-container');
  if (!buttonContainer) {
    return;
  }
  
  // Check all existing buttons
  const allButtons = buttonContainer.querySelectorAll('button');
  allButtons.forEach((btn, index) => {
  });
  
  // Check if display button already exists
  const existingDisplayButton = buttonContainer.querySelector('.subtitle-translate-button.green');
  if (existingDisplayButton && existingDisplayButton.textContent.includes('نمایش زیرنویس فارسی')) {
    return;
  }
  
  // Remove any existing translate buttons (except controls)
  // Don't remove existing translate buttons - we want to keep "در حال ترجمه..." visible
  // Only check if our display button already exists to avoid duplicates
  
  // Create the display button and add it at the top
  const showButton = document.createElement('button');
  showButton.textContent = 'نمایش زیرنویس فارسی (ذخیره شده)';
  showButton.className = 'subtitle-translate-button green';
  showButton.style.backgroundColor = '#4CAF50';
  showButton.style.color = 'white';
  showButton.style.border = 'none';
  showButton.style.borderRadius = '4px';
  showButton.style.padding = '8px 12px';
  showButton.style.fontSize = '13px';
  showButton.style.cursor = 'pointer';
  showButton.style.width = '100%';
  showButton.style.marginBottom = '6px';
  
  showButton.addEventListener('click', () => {
    // Load saved subtitles and display them
    const cachedSubs = loadSubtitlesFromStorage(currentVideoId);
    if (cachedSubs && cachedSubs.length > 0) {
      translatedSubtitles = cachedSubs;
      isSubtitleVisible = true;
      toggleSubtitleDisplay(true);
    }
  });
  
  // Insert at the beginning of the container
  const firstChild = buttonContainer.firstChild;
  if (firstChild) {
    buttonContainer.insertBefore(showButton, firstChild);
  } else {
    buttonContainer.appendChild(showButton);
  }
  
  // Verify button was added
  const verifyButton = buttonContainer.querySelector('.subtitle-translate-button.green');
}

// Update UI when translation starts
function updateUIForTranslationStart() {
  try {
    
    // Update persistent progress bar status
    updatePersistentProgressBar(0, 'در حال دریافت ترجمه', 'در حال دریافت ترجمه');
    
    // Rebuild the button container to show correct buttons during translation
    addTranslateButton();
    
  } catch (error) {
    console.error('[UI] Error updating UI for translation start:', error);
  }
}

// Update UI when translation ends
function updateUIForTranslationEnd() {
  try {
    
    // Update persistent progress bar to show completion
    const progress = calculateVideoTranslationProgress();
    updatePersistentProgressBar(progress.percentage, progress.status, 'ترجمه کامل');
    
    // Update original language status as well
    updateOriginalLanguageStatus();
    
  } catch (error) {
    console.error('[UI] Error updating UI for translation end:', error);
  }
}

// Get original language subtitles for current video
function getOriginalLanguageSubtitles(videoId) {
  try {
    
    if (!videoId) {
      videoId = currentVideoId || getCurrentVideoId();
    }
    
    if (!videoId) {
      return null;
    }
    
    const originalLanguageKey = `originalLanguage_${videoId}`;
    
    const result = localStorage.getItem(originalLanguageKey);
    
    return result;
  } catch (error) {
    console.error('[DEBUG] Error in getOriginalLanguageSubtitles:', error);
    return null;
  }
}

// Check if original language subtitles exist for current video
function hasOriginalLanguageSubtitles(videoId) {
  try {
    if (!videoId) {
      return false;
    }
    
    const originalSubtitles = getOriginalLanguageSubtitles(videoId);
    
    const result = originalSubtitles && originalSubtitles.trim().length > 0;
    return result;
  } catch (error) {
    console.error('[DEBUG] Error in hasOriginalLanguageSubtitles:', error);
    return false;
  }
}

// Update original language status display
function updateOriginalLanguageStatus() {
  const statusValue = document.querySelector('.original-status-value');
  if (statusValue) {
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
  }
}

// Get appropriate translate button text based on original language status
function getTranslateButtonText() {
  try {
    const currentVideoId = getCurrentVideoId();
    
    // Check translation progress to see if translation is complete
    const progress = calculateVideoTranslationProgress();
    
    // If translation is not complete (less than 100%), always show "دریافت و ترجمه زیرنویس"
    if (progress.percentage < 100) {
      return 'دریافت و ترجمه زیرنویس';
    }
    
    // If translation is complete (100%), check if we have original subtitles cached
    if (currentVideoId && hasOriginalLanguageSubtitles(currentVideoId)) {
      return 'ترجمه زیرنویس';
    } else {
      return 'دریافت و ترجمه زیرنویس';
    }
  } catch (error) {
    console.error('[DEBUG] Error in getTranslateButtonText:', error);
    return 'دریافت و ترجمه زیرنویس'; // fallback
  }
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
    
    // Force reset to false for now to fix the default checked issue
    showOriginalLanguage = false;
    localStorage.removeItem('showOriginalLanguage');
    
    return showOriginalLanguage;
  } catch (error) {
    console.error('[LOAD_ORIGINAL] Error loading original language setting:', error);
    showOriginalLanguage = false;
    return false;
  }
}

// Save original language display setting
function saveOriginalLanguageSetting(show) {
  localStorage.setItem('showOriginalLanguage', show.toString());
  showOriginalLanguage = show;
}

// Create original subtitle overlay
function createOriginalSubtitleOverlay() {
  // Remove existing overlay first
  removeOriginalSubtitleOverlay();
  
  // Find video container
  const videoContainer = findYouTubeVideoContainer();
  if (!videoContainer) {
    return null;
  }
  
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'original-subtitle-overlay';
  overlay.id = 'original-subtitle-overlay';
  overlay.style.top = originalSubtitleVerticalPosition + 'px';
  overlay.style.display = 'none'; // Start hidden
  overlay.textContent = ''; // Start empty
  
  // Add to video container
  videoContainer.appendChild(overlay);
  
  return overlay;
}

// Remove original subtitle overlay
function removeOriginalSubtitleOverlay() {
  const overlay = document.getElementById('original-subtitle-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Update original subtitle content
function updateOriginalSubtitleContent() {
  if (!showOriginalLanguage) {
    return;
  }
  
  const overlay = document.getElementById('original-subtitle-overlay');
  if (!overlay) {
    return;
  }
  
  if (!originalSubtitles || originalSubtitles.length === 0) {
    overlay.style.display = 'none';
    return;
  }
  
  // Get current video time
  const video = document.querySelector('video');
  if (!video) {
    overlay.style.display = 'none';
    return;
  }
  
  const currentTime = video.currentTime;
  
  // OPTIMIZATION: Instead of finding original subtitle separately,
  // use the current translated subtitle context to find the matching original
  if (translatedSubtitles && translatedSubtitles.length > 0) {
    const currentTranslated = findCurrentSubtitle(currentTime);
    if (currentTranslated) {
      // Find original subtitle with same index
      const translatedIndex = translatedSubtitles.findIndex(sub => sub === currentTranslated);
      if (translatedIndex >= 0 && translatedIndex < originalSubtitles.length) {
        const originalSub = originalSubtitles[translatedIndex];
        
        // Force sync timing to match translated subtitle exactly
        const syncedOriginalSub = {
          ...originalSub,
          startTime: currentTranslated.startTime,
          endTime: currentTranslated.endTime,
          duration: currentTranslated.duration
        };
        
        // Use the translated subtitle timing for display (guaranteed to be correct)
        overlay.textContent = syncedOriginalSub.text;
        overlay.style.display = 'block';
        return;
      }
    }
  }
  
  // Fallback: Find current original subtitle using the old method
  const currentOriginal = findCurrentOriginalSubtitle(currentTime);
  
  if (currentOriginal && currentOriginal.text) {
    overlay.textContent = currentOriginal.text;
    overlay.style.display = 'block';
  } else {
    overlay.style.display = 'none';
  }
}

// Sync original subtitles timing with translated subtitles
function syncOriginalSubtitlesWithTranslated() {
  if (!originalSubtitles || !translatedSubtitles || originalSubtitles.length === 0 || translatedSubtitles.length === 0) {
    
    return;
  }
  

  
  // If counts match, sync timing directly
  if (originalSubtitles.length === translatedSubtitles.length) {
    for (let i = 0; i < originalSubtitles.length; i++) {
      originalSubtitles[i].startTime = translatedSubtitles[i].startTime;
      originalSubtitles[i].endTime = translatedSubtitles[i].endTime;
      originalSubtitles[i].duration = translatedSubtitles[i].duration;
    }

  } else {
    // If counts don't match, try to match by content similarity or position
    const minLength = Math.min(originalSubtitles.length, translatedSubtitles.length);
    for (let i = 0; i < minLength; i++) {
      originalSubtitles[i].startTime = translatedSubtitles[i].startTime;
      originalSubtitles[i].endTime = translatedSubtitles[i].endTime;
      originalSubtitles[i].duration = translatedSubtitles[i].duration;
    }

  }
  

}

// Find current original subtitle
function findCurrentOriginalSubtitle(currentTime) {
  if (!originalSubtitles || originalSubtitles.length === 0) {
    return null;
  }
  
  if (typeof currentTime !== 'number' || isNaN(currentTime)) {
    return null;
  }
  
  // Apply time offset and multiplier (same as translated subtitles)
  const adjustedTime = (currentTime + subtitleTimeOffset) * subtitleTimeMultiplier;
  
  // Primary method: Match with translated subtitles timing for perfect sync
  if (translatedSubtitles && translatedSubtitles.length > 0) {
    const currentTranslated = findCurrentSubtitle(currentTime);
    if (currentTranslated) {
      // Find original subtitle with similar index
      const translatedIndex = translatedSubtitles.findIndex(sub => sub === currentTranslated);
      if (translatedIndex >= 0 && translatedIndex < originalSubtitles.length) {
        const originalSub = originalSubtitles[translatedIndex];
        
        // FORCE the original subtitle to use the same timing as the translated subtitle
        // This ensures perfect synchronization
        const syncedOriginalSub = {
          ...originalSub,
          startTime: currentTranslated.startTime,
          endTime: currentTranslated.endTime,
          duration: currentTranslated.duration
        };
        

        
        return syncedOriginalSub;
      }
    }
  }
  
  // If timing was properly synced, original subtitles should have the same timing as translated ones
  // So let's check if they were synced and use the same timing logic
  if (translatedSubtitles && translatedSubtitles.length > 0) {
    // Check if original subtitles were synced (have similar timing structure)
    const hasProperTiming = originalSubtitles.some(sub => sub.duration > 0.5);
    
    if (hasProperTiming) {
      // Use the same timing logic as translated subtitles
      for (let i = 0; i < originalSubtitles.length; i++) {
        const subtitle = originalSubtitles[i];
        
        // Validate subtitle timing
        if (typeof subtitle.startTime !== 'number' || typeof subtitle.endTime !== 'number') {
          continue;
        }
        
        // Use exact timing match (same as translated subtitles)
        if (adjustedTime >= subtitle.startTime && adjustedTime <= subtitle.endTime) {
  
          return subtitle;
        }
      }
    }
  }
  
  // Fallback to original timing with larger tolerance (for unsynced subtitles)
  for (let i = 0; i < originalSubtitles.length; i++) {
    const subtitle = originalSubtitles[i];
    
    // Validate subtitle timing
    if (typeof subtitle.startTime !== 'number' || typeof subtitle.endTime !== 'number') {
      continue;
    }
    
    // Use larger tolerance for timing matching (1 second)
    const tolerance = 1.0;
    if (adjustedTime >= (subtitle.startTime - tolerance) && adjustedTime <= (subtitle.endTime + tolerance)) {

      return subtitle;
    }
  }
  
  return null;
}

// Toggle original language display
async function toggleOriginalLanguage() {
  showOriginalLanguage = !showOriginalLanguage;
  saveOriginalLanguageSetting(showOriginalLanguage);
  

  
  // Update checkbox state
  const checkbox = document.querySelector('.original-language-checkbox');
  if (checkbox) {
    checkbox.checked = showOriginalLanguage;
  }
  
  if (showOriginalLanguage) {
    // User wants to show original language
    
    // Check if main subtitles are being displayed
    if (!isDisplayingSubtitles) {
      showNotification('ابتدا زیرنویس ترجمه شده را فعال کنید');
      // Reset checkbox
      showOriginalLanguage = false;
      saveOriginalLanguageSetting(false);
      const checkbox = document.querySelector('.original-language-checkbox');
      if (checkbox) checkbox.checked = false;
      return;
    }
    
    // First, check if we have original subtitles in localStorage
    if (!originalSubtitles || originalSubtitles.length === 0) {
      const savedOriginalSrt = getOriginalLanguageSubtitles(currentVideoId);
      if (savedOriginalSrt && savedOriginalSrt.trim().length > 0) {
        originalSubtitles = parseSrtToSubtitles(savedOriginalSrt);
        
        // Fix timing issues by syncing with translated subtitles if available
        if (translatedSubtitles && translatedSubtitles.length > 0 && originalSubtitles.length > 0) {
          // Check if timing sync is needed (if durations are very short)
          const needsSync = originalSubtitles.some(sub => sub.duration < 0.1);
          if (needsSync) {
            syncOriginalSubtitlesWithTranslated();
          }
        }
      }
    }
    
    // If still no original subtitles, extract them
    if (!originalSubtitles || originalSubtitles.length === 0) {
      showNotification('در حال استخراج زیرنویس اصلی...');
      
      if (currentVideoId) {
        try {
          const extractedSubtitles = await extractYouTubeSubtitles(currentVideoId);
          if (extractedSubtitles && extractedSubtitles.length > 0) {
            originalSubtitles = extractedSubtitles;
            
            // The timing sync should already be done in extractYouTubeSubtitles if translated subtitles exist
            // But double-check and sync if needed
            if (translatedSubtitles && translatedSubtitles.length > 0) {
              // Check if timing sync is needed (if durations are very short)
              const needsSync = originalSubtitles.some(sub => sub.duration < 0.1);
              if (needsSync) {
                syncOriginalSubtitlesWithTranslated();
              }
            }
            
            showNotification(`استخراج ${originalSubtitles.length} زیرنویس اصلی موفق بود`);
          } else {
            showNotification('خطا: نتوانستیم زیرنویس اصلی را استخراج کنیم');
            // Reset checkbox
            showOriginalLanguage = false;
            saveOriginalLanguageSetting(false);
            if (checkbox) checkbox.checked = false;
            return;
          }
        } catch (error) {
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
    
    // ALWAYS force sync before showing overlay to ensure perfect timing
    if (translatedSubtitles && translatedSubtitles.length > 0 && originalSubtitles && originalSubtitles.length > 0) {
      // Force complete sync every time to ensure timing is always correct
      syncOriginalSubtitlesWithTranslated();
    }
    
    // Now create and show the overlay
    removeOriginalSubtitleOverlay(); // Remove any existing overlay
    
    const overlay = createOriginalSubtitleOverlay();
    if (overlay) {
      overlay.style.display = 'block';
      showNotification('نمایش زبان اصلی فعال شد');
      
      // Start updating content immediately
      updateOriginalSubtitleContent();
    } else {
      showNotification('خطا در ایجاد نمایشگر زیرنویس اصلی');
    }
    
  } else {
    // User wants to hide original language
    removeOriginalSubtitleOverlay();
    showNotification('نمایش زبان اصلی غیرفعال شد');
  }
}

// Create original language controls
