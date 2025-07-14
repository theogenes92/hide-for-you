/* ----- CONFIG ----- */
const HIDE_AFTER_MS = 10 * 60 * 1000;               // 10-min demo window

/* ----- HELPERS ----- */
function safeSend(seconds) {
  try { chrome.runtime.sendMessage({ secondsLeft: seconds }); } catch {}
}

function clickFollowing() {
  const following = [...document.querySelectorAll('a[role="tab"]')]
    .find(a => a.textContent.trim().toLowerCase() === 'following');
  if (following) following.click();
}

/* ---------- improved helper ---------- */
function hideForYou() {
  let active = null, forYou = null, following = null;

  document.querySelectorAll('a[role="tab"]').forEach(a => {
    const label = a.textContent.trim().toLowerCase();
    if (label === 'for you')    forYou   = a;
    if (label === 'following')  following = a;
    if (a.getAttribute('aria-selected') === 'true') active = a;
  });

  if (forYou) forYou.remove();                              // remove tab

  // only click if the visible tab is still For-you
  if (active && active.textContent.trim().toLowerCase() === 'for you' && following) {
    following.click();
  }
}

/* ----- MAIN FLOW ----- */
chrome.storage.local.get(['startMs', 'hidden', 'startDate', 'elapsed'], store => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // If it's a new day, reset timer, date, hidden, and elapsed
  if (store.startDate !== today) {
    chrome.storage.local.set({ startMs: Date.now(), startDate: today, hidden: false, elapsed: 0 });
    store.startMs = Date.now();
    store.startDate = today;
    store.hidden = false;
    store.elapsed = 0;
  }

  let elapsed = store.elapsed || 0; // Persist elapsed time across tab closes

  let timerId = null;
  let lastActive = Date.now();

  function startTimer() {
    if (timerId) return;
    timerId = setInterval(tick, 1000);
  }
  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function attachHideObserver() {
    new MutationObserver(() => {
      hideForYou();
    }).observe(document.body, { subtree: true, childList: true });
  }

  function tick() {
    // Only count time when tab is visible
    if (document.visibilityState !== 'visible') return;
    elapsed += 1000;
    chrome.storage.local.set({ elapsed }); // Persist elapsed time
    const remaining = Math.max(0, HIDE_AFTER_MS - elapsed);
    let badgeText = '';
    if (remaining > 60000) {
      badgeText = `${Math.ceil(remaining / 60000)}m`;
    } else if (remaining > 0) {
      badgeText = `${Math.ceil(remaining / 1000)}s`;
    }
    safeSend(badgeText);
    if (remaining === 0) {
      hideForYou();
      chrome.storage.local.set({ hidden: true });
      stopTimer();
      safeSend(0);
      attachHideObserver(); // Only attach after timer expires
    }
  }

  // Start timer if not hidden
  if (!store.hidden) {
    startTimer();
  } else {
    safeSend(0);
    attachHideObserver(); // Only attach after timer expires
  }

  // Pause/resume timer based on tab visibility
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !store.hidden) {
      startTimer();
    } else {
      stopTimer();
    }
  });

  // Clean up if tab is closed
  window.addEventListener('beforeunload', () => stopTimer());

  // If Twitter re-renders after cutoff, keep it clean
  new MutationObserver(() => {
    chrome.storage.local.get('hidden', d => { if (d.hidden) hideForYou(); });
  }).observe(document.body, { subtree: true, childList: true });
});
