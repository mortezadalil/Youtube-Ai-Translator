// document.addEventListener('DOMContentLoaded', function() {
//   // Load saved API key
//   chrome.storage.sync.get(['openRouterApiKey'], function(result) {
//     if (result.openRouterApiKey) {
//       document.getElementById('api-key').value = result.openRouterApiKey;
//       document.getElementById('status').textContent = 'API key is set and ready to use';
//     }
//   });

//   // Save settings
//   document.getElementById('save-settings').addEventListener('click', function() {
//     const apiKey = document.getElementById('api-key').value;
    
//     if (!apiKey) {
//       document.getElementById('status').textContent = 'Error: API key is required';
//       return;
//     }
    
//     chrome.storage.sync.set({
//       openRouterApiKey: apiKey
//     }, function() {
//       document.getElementById('status').textContent = 'Settings saved successfully!';
      
//       // Notify the content script that settings have changed
//       chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//         if (tabs[0] && tabs[0].url.includes('youtube.com')) {
//           chrome.tabs.sendMessage(tabs[0].id, {action: 'settingsUpdated'});
//         }
//       });
      
//       setTimeout(function() {
//         document.getElementById('status').textContent = 'Ready';
//       }, 2000);
//     });
//   });
// }); 