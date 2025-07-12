// hide ‘For you’ once, then watch for new inserts without re-navigating
let switched = false;

const cleanHeader = () => {
  // 1. remove “For you” tabs
  document.querySelectorAll('a[role="tab"]').forEach(a => {
    if (a.textContent.trim().toLowerCase() === 'for you') a.remove();
  });

  // 2. switch to “Following” ONLY the first time (or if For you is still active)
  if (!switched) {
    const active = document.querySelector('a[role="tab"][aria-selected="true"]');
    if (active && active.textContent.trim().toLowerCase() === 'for you') {
      const following = [...document.querySelectorAll('a[role="tab"]')]
        .find(a => a.textContent.trim().toLowerCase() === 'following');
      if (following) {
        switched = true;
        following.click();
      }
    } else if (active) {
      switched = true;            // we’re already on Following
    }
  }
};

cleanHeader();
new MutationObserver(cleanHeader).observe(document.body, { subtree: true, childList: true });
