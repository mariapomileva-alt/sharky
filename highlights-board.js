(function () {
  var DEFAULT_ROSTER = [
    { firstName: "Danik", lastName: "" },
    { firstName: "Mark", lastName: "" },
    { firstName: "Mihails", lastName: "" },
    { firstName: "Aleksandrs", lastName: "" },
    { firstName: "Marks", lastName: "G" },
    { firstName: "mini Mark", lastName: "" },
    { firstName: "Anastasiya", lastName: "" },
    { firstName: "Ksenija", lastName: "" },
    { firstName: "Edvards", lastName: "" },
    { firstName: "Toms", lastName: "" },
    { firstName: "Kira", lastName: "" }
  ];

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

  function displayNameFromParts(firstName, lastName) {
    return ((firstName || "").trim() + " " + (lastName || "").trim()).trim();
  }

  function displayName(entry) {
    return displayNameFromParts(entry.firstName, entry.lastName);
  }

  function nameKeyFromParts(firstName, lastName) {
    var f = String(firstName || "")
      .trim()
      .toLowerCase();
    var l = String(lastName || "")
      .trim()
      .toLowerCase();
    return f + "\0" + l;
  }

  function nameKey(entry) {
    return nameKeyFromParts(entry.firstName, entry.lastName);
  }

  function tooltipLine(entry, resultLine) {
    return [entry.stage, entry.group, resultLine]
      .map(function (x) {
        return String(x || "").trim();
      })
      .filter(Boolean)
      .join(" · ");
  }

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
    var first0 = group.entries.length
      ? group.entries[0].firstName
      : group.rosterFirst || "";
    var last0 = group.entries.length
      ? group.entries[0].lastName
      : group.rosterLast || "";
    var initials =
      String(first0 || "?")
        .trim()
        .charAt(0) + String(last0 || "").trim().charAt(0);
    var name = escapeHtml(group.displayName || "No name");
    var photoOk = group.photoUrl ? safePhotoUrl(group.photoUrl) : "";
    var avatarInner = photoOk
      ? '<img class="hl-photo" src="' +
        escapeHtml(photoOk) +
        '" alt="" loading="lazy" decoding="async" />'
      : '<span class="hl-initials">' +
        escapeHtml(initials.toUpperCase()) +
        "</span>";

    var badgesHtml =
      group.badgesOldestFirst.length > 0
        ? group.badgesOldestFirst.map(renderBadge).join("")
        : '<span class="hl-ico hl-ico--placeholder" title="No entries yet">—</span>';

    var rowClass = "hl-row";
    if (group.entries.length === 0) rowClass += " hl-row--pending";

    return (
      '<div class="' +
      rowClass +
      '">' +
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

  function buildGroupsFromData(list) {
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

    return { map: map, groups: groups };
  }

  function mergeRosterPlaceholders(map, roster) {
    var out = [];
    roster.forEach(function (r) {
      var k = nameKeyFromParts(r.firstName, r.lastName);
      if (map[k]) return;
      var dn = displayNameFromParts(r.firstName, r.lastName);
      out.push({
        displayName: dn || displayNameFromParts(r.firstName, r.lastName),
        rosterFirst: r.firstName,
        rosterLast: r.lastName,
        entries: [],
        photoUrl: "",
        counts: { gold: 0, silver: 0, bronze: 0, medal: 0, star: 0 },
        badgesOldestFirst: []
      });
    });
    out.sort(function (a, b) {
      var an = (a.displayName || "").toLowerCase();
      var bn = (b.displayName || "").toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
    return out;
  }

  function sortDataGroups(groups) {
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
    return groups;
  }

  /**
   * @param {HTMLElement} root
   * @param {{ emptyHtml?: string, showFullRoster?: boolean }} opts
   */
  function renderInto(root, opts) {
    if (!root) return;
    opts = opts || {};
    var list =
      window.TriResults && typeof window.TriResults.load === "function"
        ? window.TriResults.load()
        : [];

    var roster = opts.roster || DEFAULT_ROSTER;
    var showFullRoster = !!opts.showFullRoster;

    if (!list.length && !showFullRoster) {
      root.innerHTML =
        opts.emptyHtml ||
        '<div class="results-empty"><p>No highlights yet.</p></div>';
      return;
    }

    var built = buildGroupsFromData(list);
    var dataGroups = sortDataGroups(built.groups.slice());
    var synthetic = showFullRoster
      ? mergeRosterPlaceholders(built.map, roster)
      : [];

    var ordered = dataGroups.concat(synthetic);

    var html = ordered
      .map(function (g, idx) {
        return renderRow(idx + 1, g);
      })
      .join("");
    root.innerHTML = html;
  }

  window.SharkyHighlights = {
    DEFAULT_ROSTER: DEFAULT_ROSTER,
    renderInto: renderInto
  };
})();
