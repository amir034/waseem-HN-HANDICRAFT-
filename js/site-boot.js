(async function bootSiteStores() {
  if (window.__siteStoreReady) {
    await window.__siteStoreReady;
  }
})();
