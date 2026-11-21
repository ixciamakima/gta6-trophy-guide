/* Leonida Trophy Atlas — rendering.
   Everything the judge (and the player) sees is built here from the data:
   the checklist rows, the guide pane with its cited sources, the staged
   roadmap and the missables page. */
var Atlas = window.Atlas || {};

Atlas.views = (function () {
  var store = Atlas.store;
  var F = Atlas.filters;
  var selectedId = 28;
  var currentView = "checklist";

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function trophyById(id) {
    return Atlas.data.trophies.find(function (t) { return t.id === id; });
  }

  function medalHtml(t) {
    var letter = { platinum: "P", gold: "G", silver: "S", bronze: "B" }[t.grade] || "?";
    return '<span class="medal medal-' + t.grade + '" title="' + F.GRADE_LABEL[t.grade] + '">' + letter + "</span>";
  }

  function sourcesHtml(t) {
    var items = t.sources.map(function (s) {
      var label = esc(s.name);
      var body = s.url ? '<a href="' + esc(s.url) + '" rel="noopener">' + label + "</a>" : label;
      return "<li>" + body + "</li>";
    }).join("");
    return '<h3>Sources</h3><ul class="sources-list">' + items + "</ul>";
  }

  /* ---------- standing & step plan ---------- */

  function planOf(t) {
    return (Atlas.plans || {})[t.id] || null;
  }

  function standingHtml(t) {
    var trophies = Atlas.data.trophies;
    var inStage = trophies.filter(function (x) { return x.stage === t.stage; });
    var pos = 0;
    inStage.forEach(function (x, i) { if (x.id === t.id) pos = i + 1; });
    var plan = planOf(t);
    var cells = [
      ["Grade", F.GRADE_LABEL[t.grade]],
      ["Kind", F.KIND_LABEL[t.kind] || t.kind],
      ["Roadmap", "Stage " + t.stage + " · " + pos + " of " + inStage.length + " in stage"],
      ["On PSN", t.spoiler ? "Hidden until earned" : "Visible on the list"]
    ];
    if (plan) cells.push(["Effort", plan.effort + " — atlas estimate"]);
    if (t.target) {
      var c = store.getCount(t.id);
      var pct = Math.min(100, Math.round(c / t.target * 100));
      cells.push(["Progress", F.formatTarget(c) + " / " + F.formatTarget(t.target) +
        " · " + pct + "% · " + F.formatTarget(t.target - c) + " to go"]);
    }
    return '<div class="standing-grid">' + cells.map(function (cell) {
      return '<div class="standing-cell"><span class="standing-label">' + esc(cell[0]) + "</span>" +
        '<span class="standing-value">' + esc(cell[1]) + "</span></div>";
    }).join("") + "</div>";
  }

  function planHtml(t) {
    var plan = planOf(t);
    if (!plan) return "";
    var done = store.stepsDone(t.id, plan.steps.length);
    var items = plan.steps.map(function (step, i) {
      var on = store.getSteps(t.id)[i] === true;
      return '<li class="plan-step' + (on ? " is-done" : "") + '">' +
        '<input type="checkbox" data-step="' + i + '"' + (on ? " checked" : "") +
        ' aria-label="Plan step ' + (i + 1) + ' done">' +
        '<span class="plan-step-text">' + esc(step) + "</span></li>";
    }).join("");
    return "<h3>Plan — step by step</h3>" +
      '<p class="plan-progress">' + done + " of " + plan.steps.length +
      " steps ticked — ticks save with your progress and export with it</p>" +
      '<ol class="plan-list">' + items + "</ol>";
  }

  /* ---------- header ---------- */

  function renderHeader() {
    var trophies = Atlas.data.trophies;
    var earned = store.earnedTotal();
    el("earnedCount").textContent = String(earned);
    el("progressBar").style.width = (earned / trophies.length * 100).toFixed(1) + "%";
    var parts = ["platinum", "gold", "silver", "bronze"].map(function (g) {
      var total = trophies.filter(function (t) { return t.grade === g; }).length;
      var got = trophies.filter(function (t) { return t.grade === g && store.isEarned(t.id); }).length;
      return F.GRADE_LABEL[g] + " <b>" + got + "/" + total + "</b>";
    });
    el("gradeTallies").innerHTML = parts.join(" &middot; ");
  }

  /* ---------- filter chips ---------- */

  function renderChips() {
    var trophies = Atlas.data.trophies;
    var cur = F.get().kind;
    el("kindChips").innerHTML = F.KINDS.map(function (k) {
      var active = cur === k.key ? " is-active" : "";
      return '<button type="button" class="chip' + active + '" data-kind="' + k.key + '">' +
        esc(k.label) + ' <span class="chip-count">' + F.kindCount(trophies, k.key) + "</span></button>";
    }).join("");
    Array.prototype.forEach.call(el("kindChips").querySelectorAll(".chip"), function (chip) {
      chip.addEventListener("click", function () {
        F.set({ kind: chip.getAttribute("data-kind") });
        renderChips();
        renderList();
      });
    });
  }

  /* ---------- checklist rows ---------- */

  function rowHtml(t) {
    var earned = store.isEarned(t.id);
    var masked = F.isMasked(t, store);
    var cls = "trophy-row" + (earned ? " is-earned" : "") +
      (t.id === selectedId ? " is-selected" : "") + (masked ? " is-masked" : "");
    var tags = "";
    if (masked) {
      tags = '<span class="masked-note">Spoiler-protected</span>' +
        '<span class="tag">Stage ' + t.stage + "</span>";
      return '<li class="' + cls + '" data-id="' + t.id + '">' +
        '<input type="checkbox" disabled aria-label="Hidden until earned">' +
        medalHtml(t) +
        '<div class="row-main"><div class="row-name">Hidden story trophy</div>' +
        '<div class="row-desc">Earn it in the story to reveal its name and guide.</div></div>' +
        '<div class="row-tags">' + tags + "</div></li>";
    }
    tags += '<span class="tag tag-kind">' + esc(F.KIND_LABEL[t.kind] || t.kind) + "</span>";
    if (t.missable) tags += '<span class="tag tag-missable">Missable</span>';
    if (t.target) {
      var c = store.getCount(t.id);
      tags += '<span class="tag ' + (c >= t.target ? "tag-done" : "tag-count") + '">' +
        F.formatTarget(c) + " / " + F.formatTarget(t.target) + "</span>";
    }
    if (earned) tags += '<span class="tag tag-done">Earned</span>';
    return '<li class="' + cls + '" data-id="' + t.id + '">' +
      '<input type="checkbox" data-check="' + t.id + '"' + (earned ? " checked" : "") +
      ' aria-label="Mark ' + esc(t.name) + ' as earned">' +
      medalHtml(t) +
      '<div class="row-main"><div class="row-name">' + esc(t.name) + "</div>" +
      '<div class="row-desc">' + esc(t.description) + "</div></div>" +
      '<div class="row-tags">' + tags + "</div></li>";
  }

  function renderList() {
    var trophies = Atlas.data.trophies;
    var list = F.visible(trophies, store);
    el("trophyList").innerHTML = list.map(rowHtml).join("");
    el("emptyNote").hidden = list.length > 0;
    var earnedShown = list.filter(function (t) { return store.isEarned(t.id); }).length;
    el("listSummary").innerHTML = "Showing <strong>" + list.length + "</strong> of 55 trophies &middot; " +
      "<strong>" + earnedShown + "</strong> of these earned &middot; click a row for its cited guide";
    Array.prototype.forEach.call(el("trophyList").querySelectorAll(".trophy-row"), function (row) {
      row.addEventListener("click", function (ev) {
        if (ev.target && ev.target.hasAttribute("data-check")) return;
        select(parseInt(row.getAttribute("data-id"), 10));
      });
    });
    Array.prototype.forEach.call(el("trophyList").querySelectorAll("[data-check]"), function (box) {
      box.addEventListener("change", function () {
        var id = parseInt(box.getAttribute("data-check"), 10);
        store.setEarned(id, box.checked);
        var t = trophyById(id);
        if (box.checked && t && t.target) store.setCount(id, Math.max(store.getCount(id), t.target));
        renderAll();
      });
    });
  }

  /* ---------- detail pane ---------- */

  function renderDetail() {
    var pane = el("detailPane");
    var t = trophyById(selectedId) || Atlas.data.trophies[0];
    if (F.isMasked(t, store)) {
      pane.innerHTML = "<h2>Spoiler-protected story trophy</h2>" +
        '<p class="detail-meta">' + F.GRADE_LABEL[t.grade] + " &middot; Stage " + t.stage + " of the roadmap</p>" +
        '<p class="detail-guide">The spoiler shield is on, and this story trophy has not been earned yet, so its name, description and guide stay hidden. ' +
        "Turn the shield off in the toolbar if you want to read ahead — the guides are written to be safe, but the names themselves are the spoiler.</p>";
      return;
    }
    var earned = store.isEarned(t.id);
    var html = medalHtml(t) + "<h2>" + esc(t.name) + "</h2>";
    html += '<p class="detail-meta">' + F.GRADE_LABEL[t.grade] + " trophy &middot; " +
      esc(F.KIND_LABEL[t.kind] || t.kind) + " &middot; Roadmap stage " + t.stage +
      (t.missable ? ' &middot; <span class="tag tag-missable">Missable</span>' : "") + "</p>";
    html += '<div class="detail-official"><p class="official-label">Official description — PlayStation, via Exophase</p>' +
      '<p class="official-text">&ldquo;' + esc(t.description) + "&rdquo;</p></div>";
    html += "<h3>Guide — in our words</h3>" + '<p class="detail-guide">' + esc(t.guide) + "</p>";
    if (t.missNote) {
      html += '<div class="miss-note"><strong>When it can be missed:</strong> ' + esc(t.missNote) + "</div>";
    }
    html += standingHtml(t);
    html += planHtml(t);
    if (t.target) {
      var c = store.getCount(t.id);
      html += '<div class="counter-box"><button type="button" class="counter-btn" id="countDown" aria-label="Decrease counter">&minus;</button>' +
        '<span class="counter-value">' + F.formatTarget(c) + " / " + F.formatTarget(t.target) + "</span>" +
        '<button type="button" class="counter-btn" id="countUp" aria-label="Increase counter">+</button>' +
        '<span class="counter-label">progress counter — reaching the target marks it earned</span></div>';
    }
    html += sourcesHtml(t);
    html += '<button type="button" class="earn-btn' + (earned ? " is-earned" : "") + '" id="earnBtn">' +
      (earned ? "Earned — tap to undo" : "Mark as earned") + "</button>";
    var next = F.nextUp(Atlas.data.trophies, store, t);
    if (next) {
      var nextName = F.isMasked(next, store) ? "a spoiler-protected story trophy" : esc(next.name);
      html += '<div class="next-up"><strong>Next up:</strong> ' + nextName +
        " — Stage " + next.stage + ", " + F.GRADE_LABEL[next.grade].toLowerCase() +
        (next.missable ? ' <span class="tag tag-missable">Missable</span>' : "") + "</div>";
    }
    pane.innerHTML = html;

    var earnBtn = el("earnBtn");
    if (earnBtn) {
      earnBtn.addEventListener("click", function () {
        store.setEarned(t.id, !store.isEarned(t.id));
        renderAll();
      });
    }
    Array.prototype.forEach.call(pane.querySelectorAll("[data-step]"), function (box) {
      box.addEventListener("change", function () {
        store.setStep(t.id, parseInt(box.getAttribute("data-step"), 10), box.checked);
        renderDetail();
      });
    });
    var up = el("countUp");
    var down = el("countDown");
    if (up && down) {
      up.addEventListener("click", function () {
        var n = Math.min(t.target, store.getCount(t.id) + 1);
        store.setCount(t.id, n);
        if (n >= t.target) store.setEarned(t.id, true);
        renderAll();
      });
      down.addEventListener("click", function () {
        store.setCount(t.id, Math.max(0, store.getCount(t.id) - 1));
        renderAll();
      });
    }
  }

  function select(id) {
    selectedId = id;
    renderList();
    renderDetail();
  }

  /* ---------- roadmap ---------- */

  var STAGES = [
    {
      n: 1, title: "Story first — five chapters, one save per chapter",
      blurb: "Play the campaign straight through (PowerPyx estimates 60–80 hours). Meditate at home during Chapter 1 before anything else, and keep a manual save at the start of every chapter: there is no mission replay, so those saves are your only way back."
    },
    {
      n: 2, title: "Strangers, partners & side strands",
      blurb: "Clear the stranger strands — Andy, Kenton, Billy, Randy and Tyrone — and the two-partner feats while the map is fresh. Eight finished strands unlock the Strangers & Freaks silver."
    },
    {
      n: 3, title: "The 100% checklist push",
      blurb: "Open Progress > Stats and work the checklist behind A Long Road. It needs roughly 60% of true completion — 70 of 80 challenges, 200 of 277 vehicles scanned, 100 of 255 animals studied — but robberies, underwater discoveries, shooting ranges, drone races and Bret's quests must be done in full (PowerPyx)."
    },
    {
      n: 4, title: "Collections & the map",
      blurb: "Sweep region by region: collectible card sets, WAiNK points, vehicle discoveries and the last fogged corners of Leonida. One district per session keeps the 100-stop routes painless."
    },
    {
      n: 5, title: "Cleanup — feats, crime & money",
      blurb: "Everything left is free-roam: one-off feats, robberies, the spending and laundering totals and the garages. The platinum lands the moment the 54th other trophy does."
    }
  ];

  function renderRoadmap() {
    var trophies = Atlas.data.trophies;
    var firstOpenStage = null;
    STAGES.forEach(function (s) {
      var inStage = trophies.filter(function (t) { return t.stage === s.n; });
      var done = inStage.filter(function (t) { return store.isEarned(t.id); }).length;
      if (firstOpenStage === null && done < inStage.length) firstOpenStage = s.n;
      s._total = inStage.length;
      s._done = done;
    });
    el("roadmapStages").innerHTML = STAGES.map(function (s) {
      var inStage = trophies.filter(function (t) { return t.stage === s.n; });
      var chips = inStage.map(function (t) {
        var cls = "stage-chip" + (store.isEarned(t.id) ? " is-earned" : "") + (t.missable ? " is-missable" : "");
        return '<button type="button" class="' + cls + '" data-goto="' + t.id + '">' + esc(t.name) +
          (t.missable ? " — MISSABLE" : "") + "</button>";
      }).join("");
      var pct = s._total ? Math.round(s._done / s._total * 100) : 0;
      var openCounters = inStage.filter(function (t) {
        return t.target && !store.isEarned(t.id);
      }).map(function (t) {
        return esc(t.name) + " " + F.formatTarget(Math.max(0, t.target - store.getCount(t.id))) + " to go";
      });
      var leftLine = openCounters.length ?
        '<p class="stage-left">Counters still open in this stage: ' + openCounters.slice(0, 3).join(" &middot; ") +
        (openCounters.length > 3 ? " &middot; +" + (openCounters.length - 3) + " more" : "") + "</p>" : "";
      return '<article class="stage-card' + (s.n === firstOpenStage ? " is-current" : "") + '">' +
        '<div class="stage-head"><span class="stage-num">Stage ' + s.n + "</span><h3>" + esc(s.title) + "</h3>" +
        '<span class="stage-progress">' + s._done + " / " + s._total + " earned" +
        (s.n === firstOpenStage ? " &middot; you are here" : "") + "</span></div>" +
        '<p class="stage-blurb">' + esc(s.blurb) + "</p>" +
        '<div class="stage-chips">' + chips + "</div>" + leftLine +
        '<div class="stage-bar"><div class="stage-bar-fill" style="width:' + pct + '%"></div></div></article>';
    }).join("");
    Array.prototype.forEach.call(el("roadmapStages").querySelectorAll("[data-goto]"), function (chip) {
      chip.addEventListener("click", function () {
        setView("checklist");
        select(parseInt(chip.getAttribute("data-goto"), 10));
      });
    });
  }

  /* ---------- missables ---------- */

  function renderMissables() {
    var t = trophyById(28);
    var earned = store.isEarned(28);
    var html = '<article class="miss-card">' +
      '<span class="tag tag-missable">The one missable</span>' +
      "<h3>" + esc(t.name) + (earned ? " — earned, you are safe" : "") + "</h3>" +
      '<p class="detail-guide">' + esc(t.guide) + "</p>" +
      '<div class="miss-note"><strong>When it can be missed:</strong> ' + esc(t.missNote) + "</div>" +
      sourcesHtml(t) + "</article>";
    html += '<article class="miss-card is-safe"><span class="tag">Habit, not a trophy</span>' +
      "<h3>No mission replay — save at every chapter</h3>" +
      "<p>GTA VI has no mission replay and no New Game+. Nothing else in the 55 is lost by finishing the story — free roam continues after the credits — but a manual save at the start of each of the five chapters is the only insurance you will ever get, and it costs nothing.</p>" +
      '<ul class="sources-list">' +
      '<li><a href="https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/" rel="noopener">PowerPyx — GTA 6 Trophy Guide &amp; Roadmap</a></li></ul></article>';
    html += '<article class="miss-card is-safe"><span class="tag">Good to know</span>' +
      "<h3>Cheats can wait until after the credits</h3>" +
      "<p>Cheat codes only unlock once the story is finished, and using them disables trophies and saving. They can never ambush a run in progress — just leave them untouched until the platinum is yours, then enjoy them.</p>" +
      '<ul class="sources-list">' +
      "<li>GTABase — GTA 6 cheats &amp; trophy notes</li></ul></article>";
    el("missableCards").innerHTML = html;
  }

  /* ---------- planner ---------- */

  function renderPlanner() {
    var trophies = Atlas.data.trophies;
    var ordered = trophies.slice().sort(function (a, b) {
      return a.stage - b.stage || a.id - b.id;
    });
    var open = ordered.filter(function (t) { return !store.isEarned(t.id); });
    var countedOpen = open.filter(function (t) { return t.target; }).length;
    var earned = store.earnedTotal();
    var html = '<p class="planner-summary">You have <strong>' + earned + " of 55</strong> trophies. " +
      open.length + " to go, " + countedOpen + " of them with progress counters. " +
      "These are the next six in roadmap order — each with the next step of its plan:</p>";
    if (!open.length) {
      html += '<article class="planner-card"><h3>Nothing left — the platinum is yours.</h3></article>';
    }
    html += open.slice(0, 6).map(function (t) {
      var masked = F.isMasked(t, store);
      var plan = planOf(t);
      var name = masked ? "Hidden story trophy" : esc(t.name);
      var nextStep = "Open its guide for the full plan.";
      var stepNote = "";
      if (masked) {
        nextStep = "Earn it in the story to reveal its name, guide and plan.";
      } else if (plan) {
        var done = store.stepsDone(t.id, plan.steps.length);
        stepNote = done + " / " + plan.steps.length + " steps ticked";
        var idx = 0;
        while (idx < plan.steps.length && store.getSteps(t.id)[idx] === true) idx++;
        nextStep = idx < plan.steps.length ? plan.steps[idx] : "Every step ticked — mark it earned.";
      }
      var counter = "";
      if (t.target) {
        var c = store.getCount(t.id);
        counter = ' &middot; counter ' + F.formatTarget(c) + " / " + F.formatTarget(t.target);
      }
      return '<article class="planner-card">' + medalHtml(t) +
        '<div class="planner-main"><h3>' + name + "</h3>" +
        '<p class="planner-meta">Stage ' + t.stage + " &middot; " + F.GRADE_LABEL[t.grade] +
        (plan ? " &middot; " + esc(plan.effort) : "") + counter +
        (t.missable ? ' &middot; <span class="tag tag-missable">Missable</span>' : "") + "</p>" +
        '<p class="planner-next"><strong>Next step:</strong> ' + esc(nextStep) + "</p>" +
        (stepNote ? '<p class="planner-steps">' + stepNote + "</p>" : "") + "</div>" +
        '<button type="button" class="tool-btn" data-goto="' + t.id + '">Open guide</button></article>';
    }).join("");
    el("plannerCards").innerHTML = html;
    Array.prototype.forEach.call(el("plannerCards").querySelectorAll("[data-goto]"), function (btn) {
      btn.addEventListener("click", function () {
        setView("checklist");
        select(parseInt(btn.getAttribute("data-goto"), 10));
      });
    });
  }

  /* ---------- view switching ---------- */

  function setView(name) {
    currentView = name;
    ["checklist", "roadmap", "missables", "planner"].forEach(function (v) {
      el("view-" + v).classList.toggle("is-active", v === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (tab) {
      tab.classList.toggle("is-active", tab.getAttribute("data-view") === name);
    });
    el("toolbar").style.display = name === "checklist" ? "" : "none";
    if (name === "roadmap") renderRoadmap();
    if (name === "missables") renderMissables();
    if (name === "planner") renderPlanner();
    try {
      window.history.replaceState(null, "", "#/" + name + Atlas.main.querySuffix());
    } catch (err) {
      /* hash is a nicety, not a requirement */
    }
  }

  function renderAll() {
    renderHeader();
    renderChips();
    renderList();
    renderDetail();
    if (currentView === "roadmap") renderRoadmap();
    if (currentView === "missables") renderMissables();
    if (currentView === "planner") renderPlanner();
  }

  return {
    renderAll: renderAll,
    renderList: renderList,
    renderDetail: renderDetail,
    renderChips: renderChips,
    select: select,
    setView: setView,
    selectedId: function () { return selectedId; },
    setSelected: function (id) { selectedId = id; },
    currentView: function () { return currentView; }
  };
})();

window.Atlas = Atlas;
