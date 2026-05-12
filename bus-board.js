(function () {
  var KEY = "triathlon_bus_board_v1";
  var memoryState = null;
  var cloudClient = null;
  var pollTimer = null;
  var booted = false;

  function cfg() {
    return window.BUS_CONFIG || {};
  }

  function defaultState() {
    return { tripDate: "", seats: ["", "", "", "", "", "", "", "", ""] };
  }

  function normalizeSeats(arr) {
    if (!Array.isArray(arr)) return defaultState().seats;
    var s = arr.map(function (x) {
      return String(x || "").slice(0, 48);
    });
    while (s.length < 9) s.push("");
    return s.slice(0, 9);
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== "object") return defaultState();
    return {
      tripDate: String(raw.tripDate != null ? raw.tripDate : raw.trip_date || "").slice(
        0,
        120
      ),
      seats: normalizeSeats(raw.seats)
    };
  }

  function loadFromLocal() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return normalizeState(JSON.parse(raw));
    } catch (e) {
      return defaultState();
    }
  }

  function saveLocalMirror() {
    if (!memoryState) return;
    localStorage.setItem(KEY, JSON.stringify(memoryState));
  }

  function createCloudClient() {
    var c = cfg();
    if (!c.useCloud || !c.supabaseUrl || !c.supabaseAnonKey) return null;
    var g = window.supabase;
    if (!g) {
      console.warn("[bus] Supabase JS not loaded");
      return null;
    }
    if (typeof g.createClient === "function") {
      return g.createClient(c.supabaseUrl, c.supabaseAnonKey);
    }
    console.warn("[bus] supabase.createClient not found on window.supabase");
    return null;
  }

  function load() {
    return memoryState || defaultState();
  }

  function setState(next) {
    memoryState = normalizeState(next);
    saveLocalMirror();
    renderSeats();
    syncDateInput();
  }

  function syncDateBanner() {
    var show = document.getElementById("bus-date-show");
    if (!show) return;
    var d = load().tripDate.trim();
    if (d) {
      show.textContent = d;
      show.hidden = false;
    } else {
      show.textContent = "";
      show.hidden = true;
    }
  }

  function syncDateInput() {
    var input = document.getElementById("bus-trip-date");
    if (!input) return;
    input.value = load().tripDate;
    syncDateBanner();
  }

  function renderSeats() {
    var grid = document.getElementById("bus-seat-grid");
    if (!grid) return;
    var state = load();
    grid.textContent = "";
    for (var i = 0; i < 9; i++) {
      var name = state.seats[i] || "";
      var seat = document.createElement("div");
      seat.className = "bus-seat" + (name ? " bus-seat--filled" : "");
      seat.setAttribute("role", "listitem");

      var num = document.createElement("span");
      num.className = "bus-seat-num";
      num.textContent = String(i + 1);
      seat.appendChild(num);

      if (name) {
        var nm = document.createElement("span");
        nm.className = "bus-seat-name";
        nm.textContent = name;
        seat.appendChild(nm);
        var rm = document.createElement("button");
        rm.type = "button";
        rm.className = "bus-seat-remove";
        rm.textContent = "Remove";
        rm.setAttribute("data-seat-rm", String(i));
        rm.setAttribute("aria-label", "Remove passenger from seat " + (i + 1));
        seat.appendChild(rm);
      } else {
        var wrap = document.createElement("div");
        wrap.className = "bus-seat-actions";
        var add = document.createElement("button");
        add.type = "button";
        add.className = "bus-seat-btn";
        add.textContent = "+ Add name";
        add.setAttribute("data-seat-add", String(i));
        add.setAttribute("aria-label", "Add passenger to seat " + (i + 1));
        wrap.appendChild(add);
        seat.appendChild(wrap);
      }
      grid.appendChild(seat);
    }
  }

  function setBusHint(mode) {
    var el = document.getElementById("bus-sync-hint");
    if (!el) return;
    if (mode === "cloud") {
      el.innerHTML =
        "<strong>Cloud sync on.</strong> Everyone sees the same bus. Changes save for all devices. " +
        "This page also pulls updates about every " +
        Math.round((cfg().pollMs || 40000) / 1000) +
        "s — or tap <strong>Refresh list</strong>. " +
        "<strong>Admin: new trip</strong> clears date and all 9 seats for everyone (PIN required).";
    } else {
      el.innerHTML =
        "<strong>Browser only.</strong> Data stays on this device until you clear it. " +
        "For one shared bus for phones and laptops, turn on <code>useCloud</code> in <code>bus-config.js</code> " +
        "and connect Supabase (see <code>supabase_bus_board.sql</code>).";
    }
  }

  function showCloudButtons(show) {
    var a = document.getElementById("bus-sync-now");
    var b = document.getElementById("bus-admin-reset");
    var tag = document.getElementById("bus-cloud-tag");
    if (a) a.hidden = !show;
    if (b) b.hidden = !show;
    if (tag) tag.hidden = !show;
  }

  async function fetchRemote() {
    if (!cloudClient) return null;
    var res = await cloudClient
      .from("bus_board")
      .select("trip_date,seats")
      .eq("id", 1)
      .maybeSingle();
    if (res.error) {
      console.error("[bus] read", res.error);
      return null;
    }
    if (!res.data) return defaultState();
    return {
      tripDate: res.data.trip_date || "",
      seats: normalizeSeats(res.data.seats)
    };
  }

  async function pushRemote() {
    if (!cloudClient || !memoryState) return;
    var payload = {
      id: 1,
      trip_date: memoryState.tripDate,
      seats: memoryState.seats,
      updated_at: new Date().toISOString()
    };
    var res = await cloudClient.from("bus_board").upsert(payload, { onConflict: "id" });
    if (res.error) console.error("[bus] write", res.error);
  }

  async function pullAndApply() {
    if (!cloudClient) return;
    var remote = await fetchRemote();
    if (!remote) return;
    memoryState = normalizeState(remote);
    saveLocalMirror();
    renderSeats();
    syncDateInput();
  }

  function wireGrid() {
    var grid = document.getElementById("bus-seat-grid");
    if (!grid) return;
    grid.addEventListener("click", function (e) {
      var addEl = e.target.closest("[data-seat-add]");
      var rmEl = e.target.closest("[data-seat-rm]");
      if (addEl) {
        var idx = parseInt(addEl.getAttribute("data-seat-add"), 10);
        var n = window.prompt("Passenger name (child or parent):", "");
        if (n === null) return;
        n = n.trim().slice(0, 48);
        if (!n) return;
        var st = normalizeState(load());
        st.seats[idx] = n;
        setState(st);
        pushRemote();
      }
      if (rmEl) {
        var idx2 = parseInt(rmEl.getAttribute("data-seat-rm"), 10);
        var st2 = normalizeState(load());
        st2.seats[idx2] = "";
        setState(st2);
        pushRemote();
      }
    });
  }

  function wireDateControls() {
    var inp = document.getElementById("bus-trip-date");
    var saveBtn = document.getElementById("bus-trip-date-save");
    var clearBtn = document.getElementById("bus-trip-date-clear");
    if (saveBtn && inp) {
      saveBtn.addEventListener("click", function () {
        var st = normalizeState(load());
        st.tripDate = inp.value.trim().slice(0, 120);
        setState(st);
        pushRemote();
      });
    }
    if (clearBtn && inp) {
      clearBtn.addEventListener("click", function () {
        var msg = cloudClient
          ? "Clear the trip date for everyone on the team bus?"
          : "Clear the trip date on this device?";
        if (inp.value.trim() && !window.confirm(msg)) return;
        var st = normalizeState(load());
        st.tripDate = "";
        setState(st);
        inp.value = "";
        pushRemote();
      });
    }
  }

  function wireCloudUi() {
    var syncBtn = document.getElementById("bus-sync-now");
    var resetBtn = document.getElementById("bus-admin-reset");
    if (syncBtn) {
      syncBtn.addEventListener("click", function () {
        pullAndApply();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        var pin = window.prompt("Admin PIN (new trip clears all seats + date for everyone):");
        if (pin === null) return;
        if (pin !== String(cfg().adminPin || "")) {
          window.alert("Wrong PIN.");
          return;
        }
        if (!window.confirm("Start a new trip? This clears the date and all 9 seats for everyone."))
          return;
        setState(defaultState());
        var inp = document.getElementById("bus-trip-date");
        if (inp) inp.value = "";
        pushRemote();
      });
    }
  }

  async function boot() {
    if (booted) return;
    booted = true;
    cloudClient = createCloudClient();
    memoryState = loadFromLocal();

    if (cloudClient) {
      showCloudButtons(true);
      setBusHint("cloud");
      await pullAndApply();
      var ms = cfg().pollMs || 40000;
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = setInterval(pullAndApply, ms);
    } else {
      showCloudButtons(false);
      setBusHint("local");
    }

    memoryState = normalizeState(memoryState);
    saveLocalMirror();
    renderSeats();
    syncDateInput();
    wireGrid();
    wireDateControls();
    wireCloudUi();

    window.addEventListener("storage", function (e) {
      if (e.key === KEY && !cloudClient) {
        memoryState = loadFromLocal();
        renderSeats();
        syncDateInput();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      boot();
    });
  } else {
    boot();
  }
})();
