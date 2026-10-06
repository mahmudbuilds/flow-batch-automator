# Flow Batch Automator (Chrome Extension - Manifest V3)

A production-ready Google Chrome Extension designed exclusively for **[flow.google.com](https://flow.google.com/)** that automates batch prompt submissions, monitors generation state via `MutationObserver`, and downloads generated assets sequentially into designated folders with customizable naming schemes.

---

## 🚀 Key Features

- **Manifest V3 Architecture:** Built with native Chrome extension APIs (`chrome.storage`, `chrome.downloads`, `activeTab`).
- **Complete CSS Isolation (Shadow DOM):** Injected side panel and floating launcher are scoped strictly inside a Shadow Root, guaranteeing zero interference with Flow's native CSS and layout.
- **Draggable & Collapsible UI:** Drag the overlay anywhere on the screen by its header or minimize it with the right-edge toggle button.
- **React & Web Component Friendly:** Uses native prototype property setters (`HTMLTextAreaElement.prototype.value`) and compound pointer events (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`) to ensure Flow's internal state updates reliably.
- **Dynamic Completion Tracking:** Observes generation cards in Flow's feed container to detect when generation completes, extracting media URLs once rendering is finished.
- **Media Type Detection:** Automatically recognizes `.png`, `.webp`, `.jpg`, and `.mp4` (Veo videos) assets.
- **Cross-Origin Safe Downloads:** Converts local `blob:` URLs to Data URLs in the content script before handing them to `background.js`, ensuring Chrome's download API never fails due to origin boundaries.
- **Live DOM Selector Customizer:** Includes an in-panel "Selector Settings" accordion so you can inspect and update Flow selectors on-the-fly without editing any source code if Google changes their class names.
- **Direct Folder Save (Zero Browser Popups):** Select ANY folder on your computer using the Native File System Access API. Generated images stream directly to your local disk with zero browser "Save As" prompts and zero download shelf clutter.
- **Direct Page-World (MAIN) Interception:** Injects a dedicated page-world interceptor (`injected.js` running in `world: 'MAIN'`) that intercepts Flow's 2K upscaled downloads in memory. It suppresses Chrome's unorganized browser downloads, captures the full uncompressed 2,037 KB image buffer, and writes it directly to your chosen folder as `scene_001.jpg`!
- **Auto-Increment Conflict Protection:** If a file with the same name already exists in your folder (e.g., `scene_001.png`), the automator automatically saves it as `scene_001_1.png` so no previous work is overwritten.
- **IndexedDB Folder Persistence:** Remembers your chosen destination folder across page refreshes and browser restarts, with quick 1-click re-authorization if required.
- **Chrome Downloads Fallback:** Seamlessly falls back to Chrome's default downloads directory if no folder is chosen.
- **Auto-Persistence:** All settings, prompts, and queue positions persist in `chrome.storage.local`.

---

## 📁 File Structure

```text
excited-babbage/
├── manifest.json       # Manifest V3 configuration & permissions (v1.1.4)
├── background.js       # Background service worker (chrome.downloads pipeline & debugger)
├── content.js          # Shadow DOM overlay, React setter, and queue automation engine
├── injected.js         # MAIN-world script intercepting 2K downloads and transferring buffers
├── styles.css          # Dark glassmorphic stylesheet for the Shadow DOM overlay
├── icons/              # Extension icons (16x16, 48x48, 128x128)
└── README.md           # Documentation & instructions
```

---

## 🛠️ Installation & Setup

1. Open Google Chrome.
2. Navigate to `chrome://extensions/` in the address bar.
3. Toggle on **Developer mode** in the upper right corner.
4. Click **Load unpacked** in the top left.
5. Select the project directory (`c:\Users\akina\Documents\antigravity\excited-babbage`).
6. The extension **"Flow Batch Automator"** is now loaded!

---

## 📖 Usage Guide

1. Navigate to [flow.google.com](https://flow.google.com/).
2. You will see a glowing **"Flow Batch"** toggle button pinned to the right edge of your screen. Click it to open the control panel.
3. **Select Model Target:** Choose *Default / Active UI Selection*, *Nano Banana Pro*, or *Veo Video*.
4. **Enter Prompts:**
   - Paste prompts into the text area.
   - Separate prompts with newlines (`\n`) or custom triple-dash delimiters (`---`).
5. **Set Destination Folder (Direct Save):**
   - Click **"Select Folder"** to pick any target folder on your PC (e.g. Desktop, external drive, project folder).
   - Once selected, the status shows **"Direct Save"** in green.
   - All generated media files write directly into that folder silently without any "Save As" popups or browser prompts.
   - If a file name exists, it automatically increments (e.g. `scene_001_1.png`).
6. **Configure Output & Quality:**
   - **Download upscaled (2K / 4K / High-Res):** Toggle this checkbox ON to automatically download maximum quality. The extension interacts with Flow's native upscale controls (selecting 4K/2K when available) and automatically transforms Google CDN URLs to uncompressed master quality (`=s0`).
   - **Prefix & Naming Pattern:** Filename prefix (e.g. `scene_`).
   - **Start Index & Padding:** Index and digit padding (e.g., start `1` with padding `3` generates `scene_001.png`, `scene_002.png`, etc.).
   - **Delay & Timeout:** Buffer between submissions (set between `0s` and `5s` for maximum speed) and rendering timeout (`90s` images, `300s` video).
7. **Click "Start Queue":**
   - If you haven't picked a folder yet, it will prompt you right then to pick one.
   - The automator will enter the prompt, trigger generation, observe the feed, optionally upscale/upgrade the asset, wait for output completion, and automatically save the asset directly to your folder.
   - Use the **Pause / Resume** and **Cancel** buttons at any time during execution.

---

## ⚙️ Fine-Tuning Selectors (Dynamic Flow Updates)

If Google updates the DOM structure of `flow.google.com`, open the **"DOM Selector Settings"** accordion inside the extension panel to adjust:
- **Prompt Input Selector:** `textarea[placeholder*="prompt" i], div[contenteditable="true"][role="textbox"], textarea`
- **Generate Button Selector:** `button[aria-label*="generate" i], button[aria-label*="send" i], button[type="submit"]`
- **Feed / Container Selector:** `[data-testid*="canvas"], [data-testid*="feed"], main, body`
- **Asset Card Selector:** `[data-testid*="card"], [data-testid*="generation"], [role="article"]`
- **Model Switcher Selector:** `[data-testid*="model-select"], button[aria-haspopup="listbox"]`
- **Upscale Button Selector:** `button[aria-label*="upscale" i], button[title*="upscale" i], [data-testid*="upscale"], button[aria-label*="maximize" i]`
