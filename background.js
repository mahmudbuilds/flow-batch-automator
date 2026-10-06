/**
 * Flow Batch Automator - Background Service Worker (Manifest V3)
 * Handles toolbar action clicks, dynamic script injection, and file downloads.
 */

console.log('[Flow Batch Automator] Service Worker initialized.');

// Active download tracking map
const activeDownloads = new Map();

// Pending rename specification for next Flow native download
let pendingRename = null;

// Captured native downloads map/list for upscale interception
const capturedNativeDownloads = [];
chrome.downloads.onCreated.addListener((downloadItem) => {
  console.log('[Flow Batch Automator] Native download detected by background:', downloadItem);
  capturedNativeDownloads.push({
    id: downloadItem.id,
    url: downloadItem.url || downloadItem.finalUrl,
    filename: downloadItem.filename,
    state: downloadItem.state,
    time: Date.now()
  });
  if (capturedNativeDownloads.length > 25) capturedNativeDownloads.shift();
});

chrome.downloads.onChanged.addListener((delta) => {
  const item = capturedNativeDownloads.find((d) => d.id === delta.id);
  if (item) {
    if (delta.filename && delta.filename.current) {
      item.filename = delta.filename.current;
    }
    if (delta.state && delta.state.current) {
      item.state = delta.state.current;
    }
  }
});

/**
 * Intercept filename determination for downloads from Flow
 * This automatically renames Google's 2K download to the user's sequential filename and folder
 */
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  if (pendingRename && (Date.now() - pendingRename.timestamp < 60000)) {
    const origFilename = item.filename || '';
    const ext = origFilename.split('.').pop() || pendingRename.ext || 'jpg';
    const folder = pendingRename.folder || 'flow_batch_generations';
    const targetPath = `${folder}/${pendingRename.baseName}.${ext}`;
    console.log(`[Flow Batch Automator] Renaming Flow native download #${item.id} -> ${targetPath}`);
    suggest({ filename: sanitizePath(targetPath), conflictAction: 'uniquify' });
    pendingRename = null;
    return true;
  }

  // When not intercepting, return false without calling suggest() to allow Chrome defaults cleanly
  return false;
});

/**
 * Handle Toolbar Action Icon Click
 * When user clicks the extension in Chrome's toolbar, toggle the overlay panel.
 */
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  const url = tab.url || '';
  const isFlowPage = url.includes('flow.google.com') || url.includes('labs.google/flow') || url.includes('labs.google/fx');

  if (!isFlowPage) {
    console.log('[Flow Batch Automator] Extension clicked on non-Flow page, opening Flow...');
    chrome.tabs.create({ url: 'https://flow.google.com/' });
    return;
  }

  // Attempt to message the content script to toggle the panel
  chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_PANEL' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('[Flow Batch Automator] Content script not responding, injecting programmatically...');
      
      // Inject content script if it wasn't already loaded (e.g. pre-existing tab before reload)
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ['content.js']
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error('[Flow Batch Automator] Failed to inject content script:', chrome.runtime.lastError.message);
          } else {
            console.log('[Flow Batch Automator] Content script injected successfully.');
            // Give script 150ms to mount, then toggle panel
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_PANEL' });
            }, 150);
          }
        }
      );
    } else {
      console.log('[Flow Batch Automator] Panel toggled, response:', response);
    }
  });
});

/**
 * Handle incoming runtime messages
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const { action } = message;

  if (action === 'PING') {
    sendResponse({ success: true, status: 'pong', version: chrome.runtime.getManifest().version });
    return false;
  }

  if (action === 'TRUSTED_SUBMIT') {
    trustedSubmit(sender.tab.id, message.text)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message || String(err) }));
    return true;
  }

  if (action === 'DETACH_DEBUGGER') {
    detachDebugger(sender.tab.id).finally(() => sendResponse({ success: true }));
    return true;
  }

  if (action === 'DOWNLOAD_ASSET') {
    handleDownloadAsset(message, sender, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (action === 'CANCEL_DOWNLOAD') {
    const { downloadId } = message;
    if (downloadId && activeDownloads.has(downloadId)) {
      chrome.downloads.cancel(downloadId, () => {
        activeDownloads.delete(downloadId);
        sendResponse({ success: true, cancelled: true });
      });
      return true;
    }
    sendResponse({ success: false, error: 'Download ID not found' });
    return false;
  }

  if (action === 'ARM_NATIVE_RENAME') {
    pendingRename = {
      folder: message.folder || 'flow_batch_generations',
      baseName: message.baseName || 'scene_001',
      ext: message.ext || 'jpg',
      timestamp: Date.now()
    };
    console.log('[Flow Batch Automator] Armed native rename for:', pendingRename);
    sendResponse({ success: true });
    return false;
  }

  if (action === 'WAIT_FOR_NATIVE_DOWNLOAD_COMPLETE') {
    const startTime = message.startTime || Date.now();
    const timeoutMs = message.timeoutMs || 45000;

    waitForFlowDownload(startTime, timeoutMs)
      .then((res) => sendResponse({ success: true, download: res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (action === 'GET_LATEST_NATIVE_DOWNLOAD') {
    const since = message.since || (Date.now() - 25000);
    const item = capturedNativeDownloads.slice().reverse().find((d) => d.time >= since);
    sendResponse({ success: !!item, download: item || null });
    return false;
  }

  return false;
});

/**
 * Waits for a native Flow download to finish saving
 */
function waitForFlowDownload(startTime, timeoutMs = 25000) {
  return new Promise((resolve) => {
    // Check if already completed
    const existing = capturedNativeDownloads.slice().reverse().find((d) => d.time >= startTime - 2000 && d.state === 'complete');
    if (existing) {
      resolve(existing);
      return;
    }

    let timer = null;

    function checkExisting() {
      const match = capturedNativeDownloads.slice().reverse().find((d) => d.time >= startTime - 2000);
      return match || null;
    }

    function listener(delta) {
      if (delta.state && delta.state.current === 'complete') {
        const item = capturedNativeDownloads.find((d) => d.id === delta.id);
        if (item && item.time >= startTime - 2000) {
          cleanup();
          resolve(item);
        }
      }
    }

    function cleanup() {
      if (timer) clearTimeout(timer);
      chrome.downloads.onChanged.removeListener(listener);
    }

    chrome.downloads.onChanged.addListener(listener);

    timer = setTimeout(() => {
      cleanup();
      const existing = checkExisting();
      resolve(existing || { state: 'timed_out_waiting' });
    }, timeoutMs);
  });
}

/**
 * Executes asset download via chrome.downloads API
 */
async function handleDownloadAsset(data, sender, sendResponse) {
  const { url, filename, conflictAction = 'uniquify', saveAs = false } = data;

  if (!url) {
    console.error('[Flow Batch Automator] Download error: Missing asset URL.');
    sendResponse({ success: false, error: 'Missing asset URL' });
    return;
  }

  if (!filename) {
    console.error('[Flow Batch Automator] Download error: Missing target filename.');
    sendResponse({ success: false, error: 'Missing target filename' });
    return;
  }

  const sanitizedFilename = sanitizePath(filename);

  try {
    chrome.downloads.download(
      {
        url: url,
        filename: sanitizedFilename,
        conflictAction: conflictAction,
        saveAs: saveAs
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          const err = chrome.runtime.lastError.message;
          console.error('[Flow Batch Automator] chrome.downloads.download failed:', err);
          sendResponse({ success: false, error: err });
          return;
        }

        if (!downloadId) {
          console.error('[Flow Batch Automator] chrome.downloads.download did not return a downloadId');
          sendResponse({ success: false, error: 'Download failed to start' });
          return;
        }

        console.log(`[Flow Batch Automator] Download initiated: ID ${downloadId} -> ${sanitizedFilename}`);
        activeDownloads.set(downloadId, {
          filename: sanitizedFilename,
          startTime: Date.now()
        });

        waitForDownloadCompletion(downloadId)
          .then((result) => {
            sendResponse({
              success: true,
              downloadId: downloadId,
              state: result.state,
              filename: sanitizedFilename
            });
          })
          .catch((err) => {
            sendResponse({
              success: true,
              downloadId: downloadId,
              state: 'in_progress',
              warning: err.message,
              filename: sanitizedFilename
            });
          });
      }
    );
  } catch (err) {
    console.error('[Flow Batch Automator] Unexpected download exception:', err);
    sendResponse({ success: false, error: err.message || String(err) });
  }
}

/**
 * Waits for a specific download ID to reach 'complete' or 'interrupted' state.
 */
function waitForDownloadCompletion(downloadId, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let timeoutTimer = null;

    function changeListener(delta) {
      if (delta.id !== downloadId) return;

      if (delta.state) {
        if (delta.state.current === 'complete') {
          cleanup();
          resolve({ state: 'complete' });
        } else if (delta.state.current === 'interrupted') {
          cleanup();
          reject(new Error(`Download interrupted: ${delta.error?.current || 'unknown reason'}`));
        }
      }
    }

    function cleanup() {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      chrome.downloads.onChanged.removeListener(changeListener);
      activeDownloads.delete(downloadId);
    }

    chrome.downloads.onChanged.addListener(changeListener);

    timeoutTimer = setTimeout(() => {
      chrome.downloads.onChanged.removeListener(changeListener);
      resolve({ state: 'started_timed_out_waiting' });
    }, timeoutMs);
  });
}

/**
 * Helper to sanitize relative download paths
 */
function sanitizePath(filePath) {
  return filePath
    .split(/[/\\]+/)
    .map((part) => part.replace(/[<>:"|?*]/g, '_').trim())
    .filter(Boolean)
    .join('/');
}


/* ==========================================================================
   TRUSTED KEYBOARD INPUT (chrome.debugger / DevTools Protocol)
   Synthetic DOM events are isTrusted=false and Flow ignores them.
   Input.* commands are indistinguishable from real typing.
   ========================================================================== */
const attachedTabs = new Set();

chrome.debugger.onDetach.addListener((source) => {
  attachedTabs.delete(source.tabId);
});

async function ensureAttached(tabId) {
  if (attachedTabs.has(tabId)) return;
  await chrome.debugger.attach({ tabId }, '1.3');
  attachedTabs.add(tabId);
}

async function detachDebugger(tabId) {
  if (!attachedTabs.has(tabId)) return;
  try { await chrome.debugger.detach({ tabId }); } catch (e) {}
  attachedTabs.delete(tabId);
}

function cdp(tabId, method, params) {
  return chrome.debugger.sendCommand({ tabId }, method, params);
}

async function key(tabId, { key, code, vk, modifiers = 0, text, commands }) {
  const base = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers };
  await cdp(tabId, 'Input.dispatchKeyEvent', {
    ...base,
    type: text ? 'keyDown' : 'rawKeyDown',
    ...(text ? { text, unmodifiedText: text } : {}),
    ...(commands ? { commands } : {})
  });
  await cdp(tabId, 'Input.dispatchKeyEvent', { ...base, type: 'keyUp' });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function trustedSubmit(tabId, text) {
  await ensureAttached(tabId);

  // Clear whatever is in the box: Ctrl+A, Backspace
  await key(tabId, { key: 'a', code: 'KeyA', vk: 65, modifiers: 2, commands: ['selectAll'] });
  await key(tabId, { key: 'Backspace', code: 'Backspace', vk: 8 });

  // Type the prompt
  await cdp(tabId, 'Input.insertText', { text });
  await wait(400);

  // Press Enter
  await key(tabId, { key: 'Enter', code: 'Enter', vk: 13, text: '\r' });
}
