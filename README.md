# Hide “For you” on X (Twitter) – Chrome Extension

Removes the **For you** timeline tab and forces X/Twitter to stay on **Following**, so you only see what *you* choose to follow. If you have other manual lists that are pinned, you can navigate to those as well.

## Install (unpacked)

1. Clone or download this repo → you’ll have a folder with  
   `manifest.json` · `content.js` · `README.md`.
2. Chrome address bar → `chrome://extensions`.
3. Toggle **Developer mode** (top-right).
4. Click **Load unpacked** → pick this folder.
5. Refresh X/Twitter – the **For you** tab is gone.

## How it works

`content.js` runs after the page loads, deletes any **For you** tabs, and (once) clicks **Following** if the site tries to open **For you**.  
A `MutationObserver` catches Twitter’s re-renders without spamming clicks, so scrolling doesn’t jump anymore.

## Updating

1. Edit `content.js` as needed.
2. `chrome://extensions` → hit **Reload** under the extension.
3. Refresh X.

## Packaging (optional)

```bash
zip -r hide-for-you.zip manifest.json content.js README.md
