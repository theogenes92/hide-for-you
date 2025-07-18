// wipe any old state *only* when the extension itself is re-loaded
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear();
});
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.clear();
});

chrome.runtime.onMessage.addListener(msg => {
  if (typeof msg.secondsLeft === 'string' && (msg.secondsLeft.endsWith('m') || msg.secondsLeft.endsWith('s'))) {
    chrome.action.setBadgeText({ text: msg.secondsLeft });
    chrome.action.setBadgeBackgroundColor({ color: '#ffffff' }); // white background
  } else if (typeof msg.secondsLeft === 'number' && msg.secondsLeft > 0) {
    chrome.action.setBadgeText({ text: String(msg.secondsLeft) });
    chrome.action.setBadgeBackgroundColor({ color: '#ffffff' }); // white background
  } else {
    chrome.action.setBadgeText({ text: '' });         // clear badge when hidden
  }
});
