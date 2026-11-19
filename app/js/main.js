/* Leonida Trophy Atlas — boot and wiring.
   Loads the trophy data, restores progress, applies any view state carried
   in the URL hash (used for deep links and for staging screenshots), then
   wires the toolbar, tabs and export/import controls. */
var Atlas = window.Atlas || {};

Atlas.main = (function () {
  var store = Atlas.store;
  var F = Atlas.filters;
  var views = Atlas.views;

  function parseHash() {
    var hash = window.location.hash || "#/checklist";
    var qIndex = hash.indexOf("?");
    var path = qIndex === -1 ? hash : hash.slice(0, qIndex);
    var params = new URLSearchParams(qIndex === -1 ? "" : hash.slice(qIndex + 1));
    var view = path.replace("#/", "").replace("#", "") || "checklist";
    if (["checklist", "roadmap", "missables"].indexOf(view) === -1) view = "checklist";
    return { view: view, params: params };
  }

  function querySuffix() {
    var p = new URLSearchParams();
    var t = views.selectedId();
    if (views.currentView() === "checklist" && t) p.set("trophy", String(t));
    var s = p.toString();
    return s ? "?" + s : "";
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function wire() {
    var search = document.getElementById("searchInput");
    search.addEventListener("input", function () {
      F.set({ search: search.value });
      views.renderList();
    });
    document.getElementById("gradeSelect").addEventListener("change", function (ev) {
      F.set({ grade: ev.target.value });
      views.renderList();
    });
    document.getElementById("statusSelect").addEventListener("change", function (ev) {
      F.set({ status: ev.target.value });
      views.renderList();
    });
    document.getElementById("spoilerToggle").addEventListener("change", function (ev) {
      F.set({ spoiler: ev.target.checked });
      views.renderAll();
    });
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (tab) {
      tab.addEventListener("click", function () {
        views.setView(tab.getAttribute("data-view"));
      });
    });
    document.getElementById("exportBtn").addEventListener("click", function () {
      download("leonida-trophy-atlas-progress.json", store.exportJson());
    });
    var fileInput = document.getElementById("importFile");
    document.getElementById("importBtn").addEventListener("click", function () {
      fileInput.click();
    });
    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      file.text().then(function (text) {
        try {
          store.importJson(text);
          views.renderAll();
        } catch (err) {
          window.alert("Import failed: " + err.message);
        }
        fileInput.value = "";
      });
    });
    document.getElementById("resetBtn").addEventListener("click", function () {
      if (window.confirm("Clear all tracked progress in this browser?")) {
        store.reset();
        views.renderAll();
      }
    });
  }

  function applyHashState(parsed, resetFirst) {
    var p = parsed.params;
    if (resetFirst) {
      F.set({ kind: "all", grade: "all", status: "all", search: "", spoiler: false });
      document.getElementById("gradeSelect").value = "all";
      document.getElementById("statusSelect").value = "all";
      document.getElementById("searchInput").value = "";
      document.getElementById("spoilerToggle").checked = false;
    }
    if (p.get("kind")) F.set({ kind: p.get("kind") });
    if (p.get("grade")) {
      F.set({ grade: p.get("grade") });
      document.getElementById("gradeSelect").value = p.get("grade");
    }
    if (p.get("status")) {
      F.set({ status: p.get("status") });
      document.getElementById("statusSelect").value = p.get("status");
    }
    if (p.get("search")) {
      F.set({ search: p.get("search") });
      document.getElementById("searchInput").value = p.get("search");
    }
    if (p.get("spoiler") === "1") {
      F.set({ spoiler: true });
      document.getElementById("spoilerToggle").checked = true;
    }
    if (p.get("trophy")) {
      var id = parseInt(p.get("trophy"), 10);
      if (!isNaN(id)) views.setSelected(id);
    }
  }

  function boot() {
    fetch("data/trophies.json")
      .then(function (res) {
        if (!res.ok) throw new Error("trophy data failed to load");
        return res.json();
      })
      .then(function (data) {
        Atlas.data = data;
        store.load();
        var searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get("seed") === "1" && !store.hasSaved()) {
          store.applyDemoSeed();
        }
        wire();
        var parsed = parseHash();
        applyHashState(parsed, false);
        views.renderAll();
        views.setView(parsed.view);
        window.addEventListener("hashchange", function () {
          var next = parseHash();
          applyHashState(next, true);
          views.renderAll();
          views.setView(next.view);
        });
      })
      .catch(function (err) {
        document.getElementById("listSummary").textContent =
          "The atlas data could not be loaded (" + err.message + "). Serve the app folder over HTTP — browsers block data fetches from file:// pages.";
      });
  }

  return { boot: boot, querySuffix: querySuffix };
})();

window.Atlas = Atlas;
document.addEventListener("DOMContentLoaded", Atlas.main.boot);
