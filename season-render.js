(function () {
  /** March–October columns; May or undated text → "Other". */
  var MONTH_COLUMNS = [
    { id: "mar", label: "Mar", sub: "March", rx: /(march|март)/i },
    { id: "apr", label: "Apr", sub: "April", rx: /(april|апр|\bapr\.?\b)/i },
    { id: "jun", label: "Jun", sub: "June", rx: /(\bjune\b|июн)/i },
    { id: "jul", label: "Jul", sub: "July", rx: /(july|июл|\bjul\.?\b)/i },
    { id: "aug", label: "Aug", sub: "August", rx: /(august|авг|\baug\.?\b)/i },
    { id: "sep", label: "Sep", sub: "September", rx: /(september|sept?\.?|сент)/i },
    { id: "oct", label: "Oct", sub: "October", rx: /(october|окт|\boct\.?\b)/i }
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

  function nameKeyFromParts(firstName, lastName) {
    return (
      String(firstName || "")
        .trim()
        .toLowerCase() +
      "\0" +
      String(lastName || "")
        .trim()
        .toLowerCase()
    );
  }

  function nameKey(e) {
    return nameKeyFromParts(e.firstName, e.lastName);
  }

  function displayName(e) {
    return ((e.firstName || "").trim() + " " + (e.lastName || "").trim()).trim();
  }

  function detectMonthId(entry) {
    var h = ((entry.stage || "") + " " + (entry.group || "")).trim();
    if (!h) return "other";
    for (var i = 0; i < MONTH_COLUMNS.length; i++) {
      if (MONTH_COLUMNS[i].rx.test(h)) return MONTH_COLUMNS[i].id;
    }
    return "other";
  }

  function cubeHtmlForEntry(entry) {
    if (!window.SharkyHighlights || !window.SharkyHighlights.classifyEntry) return "";
    var c = window.SharkyHighlights.classifyEntry(entry);
    var title = escapeAttr(
      [entry.stage, entry.group, entry.result].filter(Boolean).join(" · ")
    );
    var cls = "place-cube--top5";
    var innerMedal = "";
    var num = escapeHtml(c.label);

    if (c.type === "gold") {
      cls = "place-cube--gold";
      innerMedal = '<span class="place-cube-medal" aria-hidden="true">🏆</span>';
    } else if (c.type === "silver") {
      cls = "place-cube--silver";
      innerMedal = '<span class="place-cube-medal" aria-hidden="true">🥈</span>';
    } else if (c.type === "bronze") {
      cls = "place-cube--bronze";
      innerMedal = '<span class="place-cube-medal" aria-hidden="true">🥉</span>';
    } else if (c.type === "medal") {
      cls = "place-cube--medal";
      num = "🏅";
    } else if (c.type === "star") {
      cls = "place-cube--star";
      num = "★";
    }

    return (
      '<span class="place-cube ' +
      cls +
      '" title="' +
      title +
      '">' +
      innerMedal +
      '<span class="place-cube-n">' +
      num +
      "</span></span>"
    );
  }

  function emptyCell() {
    return '<span class="place-cube place-cube--empty" aria-label="No placing"></span>';
  }

  function repeatDecorCubes(className, n, maxShow) {
    n = Math.min(Math.max(0, n), maxShow || 6);
    var out = "";
    for (var i = 0; i < n; i++) {
      var rot = i % 2 === 0 ? "-4deg" : "3deg";
      out +=
        '<span class="season-cube ' +
        className +
        '" style="transform:rotate(' +
        rot +
        ')" aria-hidden="true"></span>';
    }
    return out;
  }

  function summarize(list) {
    var counts = { gold: 0, silver: 0, bronze: 0, medal: 0, star: 0 };
    var events = {};
    if (!window.SharkyHighlights || !window.SharkyHighlights.classifyEntry) {
      return { counts: counts, starts: 0 };
    }
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!(e.result || "").trim()) continue;
      var t = window.SharkyHighlights.classifyEntry(e).type;
      if (t === "gold") counts.gold++;
      else if (t === "silver") counts.silver++;
      else if (t === "bronze") counts.bronze++;
      else if (t === "medal") counts.medal++;
      else if (t === "star") counts.star++;
      var ek =
        String(e.stage || "")
          .trim()
          .toLowerCase() +
        "|" +
        String(e.group || "")
          .trim()
          .toLowerCase();
      if (ek !== "|") events[ek] = true;
    }
    var starts = Object.keys(events).length;
    if (!starts && list.length) starts = list.filter(function (x) {
      return (x.result || "").trim();
    }).length;
    return { counts: counts, starts: starts };
  }

  function renderSummary(list) {
    var root = document.getElementById("season-summary-root");
    if (!root) return;
    var s = summarize(list);
    var c = s.counts;
    var topField = c.medal + c.star;

    root.innerHTML =
      '<div class="season-stat">' +
      '<span class="season-stat-label">Starts<br />(saved)</span>' +
      "<strong>" +
      escapeHtml(String(s.starts || 0)) +
      "</strong>" +
      "</div>" +
      '<div class="season-stat">' +
      '<span class="season-stat-label">Gold</span>' +
      '<div class="season-stat-cubes" aria-hidden="true">' +
      repeatDecorCubes("season-cube--gold", c.gold, 4) +
      "</div>" +
      '<strong style="font-size:1.1rem">×' +
      escapeHtml(String(c.gold)) +
      "</strong>" +
      "</div>" +
      '<div class="season-stat">' +
      '<span class="season-stat-label">Silver</span>' +
      '<div class="season-stat-cubes" aria-hidden="true">' +
      repeatDecorCubes("season-cube--silver", c.silver, 4) +
      "</div>" +
      '<strong style="font-size:1.1rem">×' +
      escapeHtml(String(c.silver)) +
      "</strong>" +
      "</div>" +
      '<div class="season-stat">' +
      '<span class="season-stat-label">Bronze</span>' +
      '<div class="season-stat-cubes" aria-hidden="true">' +
      repeatDecorCubes("season-cube--bronze", c.bronze, 4) +
      "</div>" +
      '<strong style="font-size:1.1rem">×' +
      escapeHtml(String(c.bronze)) +
      "</strong>" +
      "</div>" +
      '<div class="season-stat">' +
      '<span class="season-stat-label">Top field<br />🏅 / ★</span>' +
      '<div class="season-stat-cubes" aria-hidden="true">' +
      repeatDecorCubes("season-cube--top5", topField, 4) +
      "</div>" +
      '<strong style="font-size:1.1rem">×' +
      escapeHtml(String(topField)) +
      "</strong>" +
      "</div>";
  }

  function renderTableHead() {
    var tr = document.getElementById("season-board-head-row");
    if (!tr) return;
    var cells =
      '<th scope="col">Athlete</th>' +
      MONTH_COLUMNS.map(function (m) {
        return (
          "<th scope=\"col\">" +
          escapeHtml(m.label) +
          '<span class="season-round-sub">' +
          escapeHtml(m.sub) +
          "</span></th>"
        );
      }).join("") +
      '<th scope="col">Other<span class="season-round-sub">no month in date</span></th>';
    tr.innerHTML = cells;
  }

  function renderTableBody(list) {
    var tb = document.getElementById("season-board-tbody");
    if (!tb || !window.SharkyHighlights) return;

    var roster = window.SharkyHighlights.DEFAULT_ROSTER || [];
    var byAthlete = {};
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!(e.result || "").trim()) continue;
      var k = nameKey(e);
      if (!byAthlete[k]) byAthlete[k] = [];
      byAthlete[k].push(e);
    }

    var rows = roster.map(function (r) {
      return { firstName: r.firstName, lastName: r.lastName, key: nameKeyFromParts(r.firstName, r.lastName) };
    });

    var extraKeys = Object.keys(byAthlete).filter(function (k) {
      return !rows.some(function (row) {
        return row.key === k;
      });
    });
    extraKeys.forEach(function (k) {
      var sample = byAthlete[k][0];
      rows.push({
        firstName: sample.firstName,
        lastName: sample.lastName,
        key: k
      });
    });

    rows.sort(function (a, b) {
      var an = displayName(a).toLowerCase();
      var bn = displayName(b).toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });

    tb.innerHTML = rows
      .map(function (row) {
        var entries = byAthlete[row.key] || [];
        var byMonth = {};
        MONTH_COLUMNS.forEach(function (m) {
          byMonth[m.id] = [];
        });
        byMonth.other = [];
        entries.forEach(function (ent) {
          var mid = detectMonthId(ent);
          if (!byMonth[mid]) byMonth.other.push(ent);
          else byMonth[mid].push(ent);
        });

        var name = escapeHtml(displayName(row));
        var tds = MONTH_COLUMNS.map(function (m) {
          var arr = byMonth[m.id] || [];
          if (!arr.length) return "<td>" + emptyCell() + "</td>";
          return (
            "<td><div class=\"season-cell-cubes\">" +
            arr.map(cubeHtmlForEntry).join("") +
            "</div></td>"
          );
        }).join("");
        var otherArr = byMonth.other || [];
        var otherTd =
          "<td><div class=\"season-cell-cubes\">" +
          (otherArr.length ? otherArr.map(cubeHtmlForEntry).join("") : emptyCell()) +
          "</div></td>";

        return (
          "<tr><th scope=\"row\">" +
          name +
          "</th>" +
          tds +
          otherTd +
          "</tr>"
        );
      })
      .join("");
  }

  function render() {
    var list =
      window.TriResults && typeof window.TriResults.load === "function"
        ? window.TriResults.load()
        : [];
    renderSummary(list);
    renderTableHead();
    renderTableBody(list);
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("triathlon-results-changed", render);
  window.addEventListener("storage", function (e) {
    if (e.key === (window.TriResults && window.TriResults.STORAGE_KEY)) render();
  });
})();
