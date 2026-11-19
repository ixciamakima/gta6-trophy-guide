/* Leonida Trophy Atlas — filtering, spoiler masking and the next-up pick.
   Pure logic over the trophy data and the store; no DOM access here. */
var Atlas = window.Atlas || {};

Atlas.filters = (function () {
  var KINDS = [
    { key: "all", label: "All kinds" },
    { key: "story", label: "Story" },
    { key: "missable", label: "Missable" },
    { key: "collectibles", label: "Collectibles" },
    { key: "activities", label: "Activities" },
    { key: "feats", label: "Feats & free roam" },
    { key: "meta", label: "Meta" }
  ];

  var GRADE_LABEL = {
    platinum: "Platinum",
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze"
  };

  var KIND_LABEL = {
    story: "Story",
    collectibles: "Collectibles",
    activities: "Activities",
    feats: "Feats & free roam",
    meta: "Meta"
  };

  var current = {
    kind: "all",
    grade: "all",
    status: "all",
    search: "",
    spoiler: false
  };

  function set(patch) {
    Object.keys(patch).forEach(function (k) {
      current[k] = patch[k];
    });
    return current;
  }

  function get() {
    return current;
  }

  function kindCount(trophies, key) {
    if (key === "all") return trophies.length;
    if (key === "missable") return trophies.filter(function (t) { return t.missable; }).length;
    return trophies.filter(function (t) { return t.kind === key; }).length;
  }

  function isMasked(trophy, store) {
    return current.spoiler && trophy.spoiler && !store.isEarned(trophy.id);
  }

  function matches(trophy, store) {
    if (current.kind === "missable") {
      if (!trophy.missable) return false;
    } else if (current.kind !== "all" && trophy.kind !== current.kind) {
      return false;
    }
    if (current.grade !== "all" && trophy.grade !== current.grade) return false;
    if (current.status === "earned" && !store.isEarned(trophy.id)) return false;
    if (current.status === "open" && store.isEarned(trophy.id)) return false;
    var q = current.search.trim().toLowerCase();
    if (q) {
      if (isMasked(trophy, store)) return false;
      var hay = (trophy.name + " " + trophy.description + " " + (KIND_LABEL[trophy.kind] || "")).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function visible(trophies, store) {
    return trophies.filter(function (t) { return matches(t, store); });
  }

  /* The planner: the next unearned trophy in the same roadmap stage as the
     given one (official-list order), else the first unearned trophy of the
     next stage that still has work left. */
  function nextUp(trophies, store, fromTrophy) {
    var ordered = trophies.slice().sort(function (a, b) {
      return a.stage - b.stage || a.id - b.id;
    });
    var startStage = fromTrophy ? fromTrophy.stage : 1;
    var startId = fromTrophy ? fromTrophy.id : 0;
    var later = ordered.filter(function (t) {
      return !store.isEarned(t.id) && t.id !== (fromTrophy ? fromTrophy.id : -1);
    });
    var sameStage = later.filter(function (t) {
      return t.stage === startStage && t.id > startId;
    });
    if (sameStage.length) return sameStage[0];
    var nextStage = later.filter(function (t) { return t.stage > startStage; });
    if (nextStage.length) return nextStage[0];
    var earlier = later.filter(function (t) { return t.stage === startStage; });
    return earlier.length ? earlier[0] : null;
  }

  function formatTarget(n) {
    return n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : String(n);
  }

  return {
    KINDS: KINDS,
    GRADE_LABEL: GRADE_LABEL,
    KIND_LABEL: KIND_LABEL,
    set: set,
    get: get,
    kindCount: kindCount,
    isMasked: isMasked,
    matches: matches,
    visible: visible,
    nextUp: nextUp,
    formatTarget: formatTarget
  };
})();

window.Atlas = Atlas;
