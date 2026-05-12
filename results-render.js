(function () {
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
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

  function displayName(entry) {
    return ((entry.firstName || "").trim() + " " + (entry.lastName || "").trim()).trim();
  }

  function nameKey(entry) {
    var f = String(entry.firstName || "")
      .trim()
      .toLowerCase();
    var l = String(entry.lastName || "")
      .trim()
      .toLowerCase();
    return f + "\0" + l;
  }

  function tooltipLine(entry, resultLine) {
    return [entry.stage, entry.group, resultLine]
      .map(function (x) {
        return String(x || "").trim();
      })
      .filter(Boolean)
      .join(" · ");
  }

  /** One badge per admin entry: gold | silver | bronze | medal (finisher) | star (took part, no place) */
  function classifyEntry(entry) {
    var raw = String(entry.result || "").trim();
    var rl = raw.toLowerCase();
    var hasMeta = !!(
      String(entry.stage || "").trim() || String(entry.group || "").trim()
    );

    if (!rl || rl === "—" || rl === "-") {
      return {
        type: "star",
        label: "★",
        title: hasMeta ? tooltipLine(entry, "Took part") : tooltipLine(entry, "")
      };
    }

    if (
      /\b1(\s*st|\s*place)?\b/i.test(rl) ||
      rl === "1" ||
      /gold|золот|🥇|перв/i.test(rl)
    ) {
      return { type: "gold", label: "1", title: tooltipLine(entry, raw) };
    }
    if (
      /\b2(\s*nd|\s*place)?\b/i.test(rl) ||
      rl === "2" ||
      /silver|сере|🥈|втор/i.test(rl)
    ) {
      return { type: "silver", label: "2", title: tooltipLine(entry, raw) };
    }
    if (
      /\b3(\s*rd|\s*place)?\b/i.test(rl) ||
      rl === "3" ||
      /bronze|бронз|🥉|трет/i.test(rl)
    ) {
      return { type: "bronze", label: "3", title: tooltipLine(entry, raw) };
    }
    if (/участ|participat|без\s*мест|just\s*ran/i.test(rl) && !/\d/.test(rl)) {
      return { type: "star", label: "★", title: tooltipLine(entry, raw) };
    }
    if (
      /\b([4-9]|10)(\s*(th|st|nd|rd))?\b/i.test(rl) ||
      /\b(4th|5th|6th|7th|8th|9th|10th)\b/i.test(rl) ||
      /top-?\s*5|top-?\s*10|final|cup|prize|место/i.test(rl)
    ) {
      return { type: "medal", label: "🏅", title: tooltipLine(entry, raw) };
    }
    return { type: "medal", label: "🏅", title: tooltipLine(entry, raw) };
  }

  function bump(counts, type) {
    if (type === "gold") counts.gold++;
    else if (type === "silver") counts.silver++;
    else if (type === "bronze") counts.bronze++;
    else if (type === "medal") counts.medal++;
    else if (type === "star") counts.star++;
  }

  function renderBadge(b) {
    return (
      '<span class="hl-ico hl-ico--' +
      escapeAttr(b.type) +
      '" title="' +
      escapeAttr(b.title) +
      '">' +
      escapeHtml(b.label) +
      "</span>"
    );
  }

  function renderRow(rank, group) {
    var initials =
      (group.entries[0].firstName || "?").trim().charAt(0) +
      (group.entries[0].lastName || "").trim().charAt(0);
    var name = escapeHtml(group.displayName || "No name");
    var photoOk = group.photoUrl ? safePhotoUrl(group.photoUrl) : "";
    var avatarInner = photoOk
      ? '<img class="hl-photo" src="' +
        escapeHtml(photoOk) +
        '" alt="" loading="lazy" decoding="async" />'
      : '<span class="hl-initials">' +
        escapeHtml(initials.toUpperCase()) +
        "</span>";

    var badgesHtml = group.badgesOldestFirst.map(renderBadge).join("");

    return (
      '<div class="hl-row">' +
      '<div class="hl-rank" aria-label="Rank">' +
      rank +
      "</div>" +
      '<div class="hl-avatar' +
      (photoOk ? " hl-avatar--photo" : "") +
      '">' +
      avatarInner +
      "</div>" +
      '<div class="hl-main">' +
      '<p class="hl-name">' +
      name +
      "</p>" +
      '<span class="hl-badges">' +
      badgesHtml +
      "</span>" +
      "</div>" +
      "</div>"
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

    var map = {};
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var k = nameKey(e);
      if (!map[k]) {
        map[k] = {
          displayName: displayName(e),
          entries: [],
          counts: { gold: 0, silver: 0, bronze: 0, medal: 0, star: 0 }
        };
      }
      var dn = displayName(e);
      if (dn.length > (map[k].displayName || "").length) {
        map[k].displayName = dn;
      }
      map[k].entries.push(e);
    }

    var groups = Object.keys(map).map(function (k) {
      return map[k];
    });

    groups.forEach(function (g) {
      var photo = "";
      for (var j = 0; j < g.entries.length; j++) {
        var u = safePhotoUrl(g.entries[j].photo || "");
        if (u) {
          photo = u;
          break;
        }
      }
      g.photoUrl = photo;

      var chronological = g.entries.slice().reverse();
      g.badgesOldestFirst = [];
      chronological.forEach(function (entry) {
        var b = classifyEntry(entry);
        bump(g.counts, b.type);
        g.badgesOldestFirst.push(b);
      });
    });

    groups.sort(function (a, b) {
      if (b.counts.gold !== a.counts.gold) return b.counts.gold - a.counts.gold;
      if (b.counts.silver !== a.counts.silver)
        return b.counts.silver - a.counts.silver;
      if (b.counts.bronze !== a.counts.bronze)
        return b.counts.bronze - a.counts.bronze;
      if (b.counts.medal !== a.counts.medal) return b.counts.medal - a.counts.medal;
      var an = (a.displayName || "").toLowerCase();
      var bn = (b.displayName || "").toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });

    var html = groups
      .map(function (g, idx) {
        return renderRow(idx + 1, g);
      })
      .join("");
    root.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("triathlon-results-changed", render);
  window.addEventListener("storage", function (e) {
    if (e.key === window.TriResults.STORAGE_KEY) render();
  });
})();
