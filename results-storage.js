(function () {
  var STORAGE_KEY = "triathlon_weekend_results_v1";

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function lsGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function lsSet(key, val) {
    try {
      localStorage.setItem(key, val);
      return true;
    } catch (e) {
      return false;
    }
  }

  window.TriResults = {
    STORAGE_KEY: STORAGE_KEY,

    load: function () {
      var raw = lsGet(STORAGE_KEY);
      if (!raw) return [];
      var data = safeParse(raw);
      return Array.isArray(data) ? data : [];
    },

    save: function (arr) {
      if (!lsSet(STORAGE_KEY, JSON.stringify(arr))) return;
      window.dispatchEvent(new CustomEvent("triathlon-results-changed"));
    },

    notify: function () {
      window.dispatchEvent(new CustomEvent("triathlon-results-changed"));
    }
  };
})();
