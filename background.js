// Background script to handle extension initialization and messaging
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Farsi Translator extension installed');
  
  // Set the default API key
  chrome.storage.sync.set({
    openRouterApiKey: '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'
  }, function() {
    console.log('Default API key has been set');
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('%c=== TRANSLATION REQUEST RECEIVED ===', 'background: #4CAF50; color: white; padding: 5px; border-radius: 5px;');
  
  if (request.action === 'translateSubtitles') {
    const subtitlesCount = request.subtitles.length;
    console.log(`%cStarting translation process for ${subtitlesCount} subtitles...`, 'color: blue; font-weight: bold;');
    
    // Log the first few subtitles
    console.log('Sample of subtitles to translate:');
    const samplesToShow = Math.min(3, subtitlesCount);
    for (let i = 0; i < samplesToShow; i++) {
      console.log(`${i+1}. "${request.subtitles[i].text}" (${request.subtitles[i].startTime}s - ${request.subtitles[i].endTime}s)`);
    }
    if (subtitlesCount > samplesToShow) {
      console.log(`... and ${subtitlesCount - samplesToShow} more`);
    }
    
    translateWithOpenRouter(request.subtitles)
      .then(translatedSubtitles => {
        console.log('%c=== TRANSLATION SUCCESSFUL ===', 'background: #4CAF50; color: white; padding: 5px; border-radius: 5px;');
        
        // Log a sample of the translations
        console.log('Sample of translations:');
        const translationSamples = Math.min(3, translatedSubtitles.length);
        for (let i = 0; i < translationSamples; i++) {
          console.log(`${i+1}. EN: "${request.subtitles[i].text}"`);
          console.log(`   FA: "${translatedSubtitles[i].text}"`);
        }
        
        sendResponse({ success: true, translatedSubtitles });
      })
      .catch(error => {
        console.error('%c=== TRANSLATION FAILED ===', 'background: #F44336; color: white; padding: 5px; border-radius: 5px;');
        console.error('Error details:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Indicates we will respond asynchronously
  }
});

// Function to translate text using OpenRouter API
async function translateWithOpenRouter(subtitles) {
  // Get the API key from storage
  const result = await chrome.storage.sync.get(['openRouterApiKey']);
  const apiKey = result.openRouterApiKey;
  
  console.log('Using API key (first 10 chars):', apiKey.substring(0, 10) + '...');
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not set. Please set it in the extension popup.');
  }

  console.log('Sending request to OpenRouter API...');
  console.time('Translation Request');
  
  // Prepare the request to OpenRouter
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/YoutubeTranslateAi',
        'X-Title': 'YouTube Farsi Translator'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-prover-v2:free',
        messages: [
          {
            role: 'system', 
            content: 'You are a professional English to Farsi translator. Translate the YouTube subtitles provided to natural and fluent Farsi. Maintain the same timing structure. Return only the translated subtitles in the same array format as the input, with each object having startTime, endTime, and text fields. The text field should contain the Farsi translation.'
          },
          {
            role: 'user',
            content: 'Translate these YouTube subtitles from English to Farsi:\n\n' + JSON.stringify(subtitles)
          }
        ]
      })
    });

    console.log(`OpenRouter response status: ${response.status} ${response.statusText}`);
    console.timeEnd('Translation Request');
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error details:', errorData);
      throw new Error(`Translation API error: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Response received from OpenRouter');
    
    try {
      // Extract the translation result from the response
      const translationText = data.choices[0].message.content;
      console.log('Translation text received, length:', translationText.length);
      
      // Try to parse as JSON first
      try {
        const result = JSON.parse(translationText);
        console.log(`Successfully parsed response as JSON array with ${result.length} items`);
        return result;
      } catch (jsonError) {
        console.log('Failed to parse as JSON, treating as text response');
        console.log('First 100 characters of response:', translationText.substring(0, 100));
        
        // If JSON parsing fails, try to manually convert the translated text to the expected format
        return convertTextResponseToSubtitles(translationText, subtitles);
      }
    } catch (error) {
      console.error('Failed to process translation result:', error);
      throw new Error('Failed to process translation result: ' + error.message);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Function to convert text response to subtitle format
function convertTextResponseToSubtitles(translationText, originalSubtitles) {
  console.log('Converting text response to subtitles format');
  
  // If the translation is just plain text, we'll need to create our own subtitle objects
  // We'll assume one line of translation corresponds to one original subtitle
  
  // Split the translation into lines
  const translationLines = translationText.split('\n').filter(line => line.trim() !== '');
  
  console.log(`Found ${translationLines.length} translation lines for ${originalSubtitles.length} original subtitles`);
  
  // Create translated subtitles based on original timing and translated text
  const translatedSubtitles = [];
  
  // Match as many lines as we can
  const lineCount = Math.min(translationLines.length, originalSubtitles.length);
  
  for (let i = 0; i < lineCount; i++) {
    translatedSubtitles.push({
      startTime: originalSubtitles[i].startTime,
      endTime: originalSubtitles[i].endTime,
      text: translationLines[i].trim()
    });
  }
  
  // If we have more original subtitles than translation lines, use the last translation line for all remaining
  if (originalSubtitles.length > translationLines.length && translationLines.length > 0) {
    const lastTranslation = translationLines[translationLines.length - 1].trim();
    
    for (let i = translationLines.length; i < originalSubtitles.length; i++) {
      translatedSubtitles.push({
        startTime: originalSubtitles[i].startTime,
        endTime: originalSubtitles[i].endTime,
        text: lastTranslation
      });
    }
  }
  
  console.log('Created translated subtitles array with', translatedSubtitles.length, 'items');
  return translatedSubtitles;
} 