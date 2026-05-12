(function () {
  var EMPTY_HUB =
    '<div class="results-empty">' +
    "<p>No highlights yet.</p>" +
    '<p class="results-empty-sub"><a class="inline-link" href="admin-results.html">Add a highlight</a> — works on a phone (ask the coach for the PIN).</p>' +
    "</div>";

  function render() {
    var root = document.getElementById("weekend-results-root");
    if (!root || !window.SharkyHighlights) return;
    window.SharkyHighlights.renderInto(root, {
      showFullRoster: false,
      emptyHtml: EMPTY_HUB
    });
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("triathlon-results-changed", render);
  window.addEventListener("storage", function (e) {
    if (e.key === window.TriResults.STORAGE_KEY) render();
  });
})();
