/* Leonida Trophy Atlas — progress store.
   Progress lives only in this browser (localStorage). The store knows
   nothing about the DOM; views read from it and call save() after edits. */
var Atlas = window.Atlas || {};

Atlas.store = (function () {
  var KEY = "leonida-trophy-atlas-v1";
  var state = { earned: {}, counts: {} };

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          state.earned = parsed.earned || {};
          state.counts = parsed.counts || {};
        }
      }
    } catch (err) {
      /* storage unavailable (private mode etc.) — run in-memory only */
    }
    return state;
  }

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      /* in-memory state still works for this session */
    }
  }

  function hasSaved() {
    try {
      return window.localStorage.getItem(KEY) !== null;
    } catch (err) {
      return false;
    }
  }

  function isEarned(id) {
    return state.earned[id] === true;
  }

  function setEarned(id, on) {
    if (on) {
      state.earned[id] = true;
    } else {
      delete state.earned[id];
    }
    save();
  }

  function getCount(id) {
    return state.counts[id] || 0;
  }

  function setCount(id, n) {
    if (n > 0) {
      state.counts[id] = n;
    } else {
      delete state.counts[id];
    }
    save();
  }

  function earnedTotal() {
    return Object.keys(state.earned).length;
  }

  function exportJson() {
    return JSON.stringify(
      { app: "leonida-trophy-atlas", version: 1, exported: new Date().toISOString(), progress: state },
      null,
      2
    );
  }

  function importJson(text) {
    var parsed = JSON.parse(text);
    var progress = parsed && parsed.progress ? parsed.progress : parsed;
    if (!progress || typeof progress !== "object") {
      throw new Error("That file does not look like atlas progress.");
    }
    state.earned = progress.earned || {};
    state.counts = progress.counts || {};
    save();
    return state;
  }

  function reset() {
    state = { earned: {}, counts: {} };
    try {
      window.localStorage.removeItem(KEY);
    } catch (err) {
      /* nothing to clear */
    }
  }

  /* Demo progress used for screenshots and first impressions: a believable
     mid-run save — 13 of 55 earned, counters part way — applied only when
     the page is opened with ?seed=1 and no real progress exists yet. */
  function applyDemoSeed() {
    var earnedIds = [2, 3, 8, 15, 16, 20, 21, 28, 35, 36, 44, 46, 53];
    state.earned = {};
    earnedIds.forEach(function (id) {
      state.earned[id] = true;
    });
    state.counts = {
      15: 250, 16: 9, 17: 31, 25: 5, 28: 18, 31: 47,
      32: 22, 35: 100, 42: 30, 52: 140000, 53: 100000
    };
    save();
  }

  return {
    load: load,
    save: save,
    hasSaved: hasSaved,
    isEarned: isEarned,
    setEarned: setEarned,
    getCount: getCount,
    setCount: setCount,
    earnedTotal: earnedTotal,
    exportJson: exportJson,
    importJson: importJson,
    reset: reset,
    applyDemoSeed: applyDemoSeed,
    state: function () { return state; }
  };
})();

window.Atlas = Atlas;
