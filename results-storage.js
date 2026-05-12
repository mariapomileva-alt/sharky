(function () {
  var STORAGE_KEY = "triathlon_weekend_results_v1";

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  window.TriResults = {
    STORAGE_KEY: STORAGE_KEY,

    load: function () {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = safeParse(raw);
      return Array.isArray(data) ? data : [];
    },

    save: function (arr) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      window.dispatchEvent(new CustomEvent("triathlon-results-changed"));
    },

    notify: function () {
      window.dispatchEvent(new CustomEvent("triathlon-results-changed"));
    }
  };
})();
