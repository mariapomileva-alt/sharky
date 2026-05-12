(function () {
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safePhotoUrl(u) {
    u = (u || "").trim();
    if (/^https?:\/\//i.test(u) && u.length < 4000) return u;
    if (
      /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(u) &&
      u.length < 600000
    )
      return u;
    return "";
  }

  function trophySvg() {
    return (
      '<svg class="trophy-doodle" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M6 14c2-3 7-5 16-5s14 2 16 5v2c0 8-6 14-16 16-10-2-16-8-16-16v-2z" fill="#ff6b2d" stroke="#0a1628" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M10 14H4c0 4 2 7 5 8M34 14h6c0-4-2-7-5-8" fill="none" stroke="#0a1628" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M14 42h16M22 30v12" fill="none" stroke="#0a1628" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M10 46h24" fill="none" stroke="#0a1628" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="22" cy="10" r="2.5" fill="#0a1628"/>' +
      "</svg>"
    );
  }

  function renderCard(entry) {
    var initials =
      (entry.firstName || "?").trim().charAt(0) + (entry.lastName || "").trim().charAt(0);
    var name =
      escapeHtml((entry.firstName || "").trim() + " " + (entry.lastName || "").trim()).trim();
    var stage = escapeHtml(entry.stage || "");
    var group = escapeHtml(entry.group || "");
    var result = escapeHtml(entry.result || "—");
    var photoRaw = (entry.photo || "").trim();
    var photoOk = safePhotoUrl(photoRaw);
    var meta = [stage, group].filter(Boolean).join(" · ");

    var avatarInner = photoOk
      ? '<img class="result-photo" src="' +
        escapeHtml(photoOk) +
        '" alt="" loading="lazy" decoding="async" />'
      : '<span class="result-initials">' +
        escapeHtml(initials.toUpperCase()) +
        "</span>";

    return (
      '<article class="result-card" data-id="' +
      escapeHtml(entry.id) +
      '">' +
      '<div class="result-card-inner">' +
      '<div class="result-avatar' +
      (photoOk ? " result-avatar--photo" : "") +
      '">' +
      avatarInner +
      "</div>" +
      '<div class="result-body">' +
      '<p class="result-name">' +
      (name || "No name") +
      "</p>" +
      (meta ? '<p class="result-meta">' + meta + "</p>" : "") +
      '<p class="result-prize">' + result + "</p>" +
      "</div>" +
      '<div class="result-trophy" title="Award">' +
      trophySvg() +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function render() {
    var root = document.getElementById("weekend-results-root");
    if (!root) return;
    var list = window.TriResults.load();
    if (!list.length) {
      root.innerHTML =
        '<div class="results-empty">' +
        "<p>No highlights yet.</p>" +
        '<p class="results-empty-sub"><a class="inline-link" href="admin-results.html">Add a highlight</a> — works on a phone (ask the coach for the PIN).</p>' +
        "</div>";
      return;
    }
    root.innerHTML = list.map(renderCard).join("");
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("triathlon-results-changed", render);
  window.addEventListener("storage", function (e) {
    if (e.key === window.TriResults.STORAGE_KEY) render();
  });
})();
