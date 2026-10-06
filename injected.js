/**
 * Flow Batch Automator - Page World (MAIN) Interceptor
 * Runs directly in the webpage's main execution context.
 * Intercepts Google Flow's 2K / 4K upscaled image downloads so they can be
 * saved directly into the user's chosen folder with custom sequential names,
 * completely preventing Chrome's unorganized native downloads, popups, and wrong names.
 */

(function () {
  if (window.__FBA_INJECTED__) return;
  window.__FBA_INJECTED__ = true;

  console.log('[Flow Batch Automator - MAIN] Page-world interceptor initialized.');

  let isArmed = false;
  let armTimer = null;
  const recentBlobs = new Map(); // url -> { blob, timestamp }

  // Track created blob URLs and their Blob objects in memory
  const origCreateObjectURL = URL.createObjectURL;
  if (origCreateObjectURL) {
    URL.createObjectURL = function (blob) {
      const url = origCreateObjectURL.call(URL, blob);
      try {
        if (blob && typeof blob.size === 'number') {
          recentBlobs.set(url, { blob, timestamp: Date.now() });
          // Retain only the last 20 blobs
          if (recentBlobs.size > 20) {
            const oldestKey = recentBlobs.keys().next().value;
            recentBlobs.delete(oldestKey);
          }
        }
      } catch (e) {}
      return url;
    };
  }

  // Listen for commands from the isolated content script
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'FBA_ISOLATED') return;

    if (event.data.action === 'ARM_UPSCALE_CAPTURE') {
      isArmed = true;
      if (armTimer) clearTimeout(armTimer);
      // Auto-disarm after 35 seconds if no click occurs
      armTimer = setTimeout(() => {
        isArmed = false;
        console.log('[Flow Batch Automator - MAIN] High-res capture auto-disarmed (timeout).');
      }, 35000);
      console.log('[Flow Batch Automator - MAIN] Armed for high-res asset capture.');
    } else if (event.data.action === 'DISARM_UPSCALE_CAPTURE') {
      isArmed = false;
      if (armTimer) clearTimeout(armTimer);
    }
  });

  async function handleCapturedMedia(url, downloadName) {
    console.log('[Flow Batch Automator - MAIN] Processing captured media:', { url, downloadName });
    try {
      let blob = null;

      // Check if we have the blob in memory from createObjectURL
      if (recentBlobs.has(url)) {
        blob = recentBlobs.get(url).blob;
      }

      // If not, fetch it directly in the page world
      if (!blob) {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} fetching media`);
        }
        blob = await res.blob();
      }

      const mimeType = blob.type || 'image/jpeg';
      const arrayBuffer = await blob.arrayBuffer();

      console.log(`[Flow Batch Automator - MAIN] Successfully extracted media (${blob.size} bytes, ${mimeType}). Transferring to content script...`);

      window.postMessage(
        {
          source: 'FBA_MAIN',
          action: 'UPSCALE_BLOB_CAPTURED',
          buffer: arrayBuffer,
          mimeType: mimeType,
          size: blob.size,
          suggestedFilename: downloadName || ''
        },
        '*',
        [arrayBuffer]
      );
    } catch (err) {
      console.error('[Flow Batch Automator - MAIN] Error capturing media:', err);
      window.postMessage(
        {
          source: 'FBA_MAIN',
          action: 'UPSCALE_CAPTURE_FAILED',
          error: err.message || String(err)
        },
        '*'
      );
    }
  }

  // Hook HTMLAnchorElement.prototype.click
  const origAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    try {
      const href = this.href;
      const downloadAttr = this.getAttribute('download') || this.download || '';
      const isTarget = isArmed || /2k|4k|upscaled/i.test(downloadAttr);

      if (isTarget && href) {
        console.log('[Flow Batch Automator - MAIN] Intercepted anchor.click():', { href, downloadAttr });
        isArmed = false;
        if (armTimer) clearTimeout(armTimer);

        handleCapturedMedia(href, downloadAttr);

        // Suppress browser native download shelf
        return;
      }
    } catch (e) {
      console.warn('[Flow Batch Automator - MAIN] Error in anchor click hook:', e);
    }
    return origAnchorClick.apply(this, arguments);
  };

  // Capture-phase click listener for anchors dispatched via DOM events
  window.addEventListener(
    'click',
    (event) => {
      try {
        const target = event.target;
        const anchor = target ? (target.closest('a') || (target.tagName === 'A' ? target : null)) : null;
        if (anchor && anchor.href) {
          const downloadAttr = anchor.getAttribute('download') || anchor.download || '';
          const isTarget = isArmed || /2k|4k|upscaled/i.test(downloadAttr);

          if (isTarget) {
            console.log('[Flow Batch Automator - MAIN] Intercepted click event on anchor:', { href: anchor.href, downloadAttr });
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            isArmed = false;
            if (armTimer) clearTimeout(armTimer);

            handleCapturedMedia(anchor.href, downloadAttr);
          }
        }
      } catch (e) {
        console.warn('[Flow Batch Automator - MAIN] Error in click event hook:', e);
      }
    },
    true
  );

  // Hook window.open as additional fallback
  const origWindowOpen = window.open;
  window.open = function (url) {
    if (isArmed && url) {
      console.log('[Flow Batch Automator - MAIN] Intercepted window.open():', url);
      isArmed = false;
      if (armTimer) clearTimeout(armTimer);
      handleCapturedMedia(url, '');
      return null;
    }
    return origWindowOpen.apply(this, arguments);
  };
})();
