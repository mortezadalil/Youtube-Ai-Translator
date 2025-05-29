# YouTube Farsi Translator Chrome Extension

A Chrome extension that translates YouTube English subtitles to Farsi in real-time using OpenRouter.ai.

## Features

- Automatically translates English subtitles to Farsi
- Displays both original English and translated Farsi subtitles simultaneously
- Works with most YouTube videos that have English captions
- Uses OpenRouter.ai for high-quality translations
- Simple toggle button in the YouTube player controls

## Installation

### Manual Installation (Developer Mode)

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The extension should now be installed and visible in your Chrome extensions list

## Usage

1. After installation, navigate to a YouTube video with English subtitles
2. Make sure subtitles are enabled in the YouTube player
3. Click the "فارسی" button in the YouTube player controls to activate the Farsi translation
4. Enter your OpenRouter.ai API key in the popup when prompted (you only need to do this once)
5. The translated Farsi subtitles will appear below the original English subtitles

## Getting an OpenRouter.ai API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/) and create an account
2. Navigate to your account settings or API section
3. Generate a new API key
4. Copy this key and paste it into the extension popup when prompted

## How It Works

1. The extension detects when you're watching a YouTube video
2. When activated, it extracts the English subtitles from the video
3. The subtitles are sent to OpenRouter.ai for translation to Farsi
4. The translated subtitles are displayed in sync with the video

## Notes

- This extension requires an internet connection to function
- Translation quality depends on the OpenRouter.ai service
- The extension works best with clearly spoken English content
- You need to enable subtitles on YouTube for the extension to work

## Privacy

- Your subtitles data is sent to OpenRouter.ai for translation
- Your API key is stored locally in your browser
- No other personal data is collected or transmitted

## Known Issues and Limitations

- May not work with auto-generated captions in some cases
- Translations might have slight delays for very long videos
- The extension needs to be reactivated when switching between videos

## Contributing

Feel free to submit pull requests or report issues on GitHub. 