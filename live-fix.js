// Live feed reliability patch v1.3
// Website Feed uses marker rows, so force Google Visualization to treat zero rows as headers.
loadGvizJsonp = function () {
  return new Promise((resolve, reject) => {
    const callbackName = `battleSheetCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let settled = false;

    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[callbackName]; } catch { window[callbackName] = undefined; }
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Google Sheets request timed out'));
    }, 12000);

    window[callbackName] = payload => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      if (payload?.status === 'error') {
        reject(new Error(payload.errors?.[0]?.detailed_message || 'Google Sheets returned an error'));
        return;
      }
      resolve(payload);
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      reject(new Error('Unable to load Google Sheets feed'));
    };

    const baseUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&headers=0`;
    const tqx = encodeURIComponent(`responseHandler:${callbackName}`);
    script.src = `${baseUrl}&tqx=${tqx}&_=${Date.now()}`;
    script.async = true;
    document.head.appendChild(script);
  });
};

// Retry immediately after this patch loads.
loadScoreboard();
