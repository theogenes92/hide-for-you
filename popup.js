// popup.js
const DEFAULT_LIMIT_MIN = 10;

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function updateCountdown() {
  chrome.storage.local.get(['hidden', 'elapsed', 'startMs', 'startDate', 'customLimit', 'customLimitDate'], store => {
    let today = getToday();
    let limitMs = DEFAULT_LIMIT_MIN * 60 * 1000;
    // If custom limit is set for today, use it
    if (store.customLimit && store.customLimitDate === today) {
      limitMs = store.customLimit;
    }
    let elapsed = store.elapsed || 0;
    let remaining = Math.max(0, limitMs - elapsed);
    let text = '';
    if (store.hidden || remaining === 0) {
      text = 'Hidden';
    } else {
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      text = `${mins}m:${secs.toString().padStart(2, '0')}s`;
    }
    document.getElementById('countdown').textContent = text;
    // Show current limit
    document.getElementById('currentLimit').textContent = `Current limit: ${Math.round(limitMs/60000)} min`;
  });
}

function setCustomLimit() {
  const input = document.getElementById('limitInput');
  let mins = parseInt(input.value, 10);
  if (isNaN(mins) || mins < 1 || mins > 120) return;
  let today = getToday();
  chrome.storage.local.set({ customLimit: mins * 60 * 1000, customLimitDate: today, elapsed: 0, hidden: false }, updateCountdown);
  // Notify all Twitter/X tabs to reset their in-memory timer
  chrome.tabs.query({url: ['https://twitter.com/*', 'https://x.com/*']}, tabs => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'resetTimer' });
    }
  });
}

document.getElementById('setLimitBtn').addEventListener('click', setCustomLimit);

updateCountdown();
setInterval(updateCountdown, 1000);

// Tab switching logic
const tabTimer = document.getElementById('tabTimer');
const tabAnalytics = document.getElementById('tabAnalytics');
const tabContentTimer = document.getElementById('tabContentTimer');
const tabContentAnalytics = document.getElementById('tabContentAnalytics');

tabTimer.addEventListener('click', () => {
  tabTimer.style.fontWeight = 'bold';
  tabAnalytics.style.fontWeight = 'normal';
  tabContentTimer.style.display = '';
  tabContentAnalytics.style.display = 'none';
});
tabAnalytics.addEventListener('click', () => {
  tabTimer.style.fontWeight = 'normal';
  tabAnalytics.style.fontWeight = 'bold';
  tabContentTimer.style.display = 'none';
  tabContentAnalytics.style.display = '';
  updateAnalytics();
});

function updateAnalytics() {
  chrome.storage.local.get(['usageHistory'], store => {
    const today = getToday();
    let todayUsage = 0;
    let weekUsage = 0;
    const usage = store.usageHistory || {};
    // Calculate today's usage
    if (usage[today]) todayUsage = usage[today];
    // Calculate this week's usage
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (usage[key]) weekUsage += usage[key];
    }
    document.getElementById('analyticsToday').textContent = `Today: ${Math.floor(todayUsage/60000)}m ${Math.floor((todayUsage%60000)/1000)}s`;
    document.getElementById('analyticsWeek').textContent = `This week: ${Math.floor(weekUsage/60000)}m ${Math.floor((weekUsage%60000)/1000)}s`;
  });
} 