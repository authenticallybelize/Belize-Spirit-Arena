/* The full-release gate shares the same test switch and validated save as the Story menu. */
(() => {
  if (StoryCampaign.SURVIVAL_TEST_OPEN) return;
  let storage;
  try { storage = localStorage; } catch { location.replace('story.html'); return; }
  const data = new StoryCampaign.Store(storage).data;
  if (!data.survivalUnlocked) location.replace('story.html');
})();
