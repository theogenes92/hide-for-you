/* ----- CONFIG ----- */
const HIDE_AFTER_MS = 30 * 60 * 1000;               // 30-min demo window

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

/* ---------- keep header clean without resetting scroll ---------- */
new MutationObserver(() => {
  // run only when "For you" tab exists or is currently active
  const forYouPresent = !!document.querySelector('a[role="tab"]:not([aria-hidden="true"])'+
                                                ':not([style*="display:none"])' +
                                                ':not([hidden])'+
                                                '[aria-selected="true"], a[role="tab"]:not([aria-hidden="true"])'+
                                                ':not([style*="display:none"])'+
                                                ':not([hidden])'+
                                                ':contains("For you")');
  if (forYouPresent) hideForYou();
}).observe(document.body, { subtree: true, childList: true });

/* ----- MAIN FLOW ----- */
chrome.storage.local.get(['startMs', 'hidden'], store => {
  // first load after extension (re)install -> create start timestamp
  if (!store.startMs) {
    chrome.storage.local.set({ startMs: Date.now() });
    store.startMs = Date.now();
  }

  // already hidden in this extension run
  if (store.hidden) {
    hideForYou();
    safeSend(0);
    return;
  }

  const tick = () => {
    const remaining = Math.max(0, HIDE_AFTER_MS - (Date.now() - store.startMs));
    // Show minutes remaining (rounded up) with 'm' suffix
    const minsLeft = Math.ceil(remaining / 60000);
    safeSend(minsLeft > 0 ? `${minsLeft}m` : '');

    if (remaining === 0) {
      hideForYou();
      chrome.storage.local.set({ hidden: true });
      clearInterval(timerId);
      safeSend(0);
    }
  };

  tick();                               // run immediately
  const timerId = setInterval(tick, 1000);

  // clean up if tab is closed
  window.addEventListener('beforeunload', () => clearInterval(timerId));

  // if Twitter re-renders after cutoff, keep it clean
  new MutationObserver(() => {
    chrome.storage.local.get('hidden', d => { if (d.hidden) hideForYou(); });
  }).observe(document.body, { subtree: true, childList: true });
});
