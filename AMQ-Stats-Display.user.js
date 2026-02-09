// ==UserScript==
// @name         AMQ Stats Display
// @namespace    https://animemusicquiz.com/
// @version      1.2
// @description  Display stats
// @author       Problem02
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://github.com/Nick-NCSU/AMQ-Extended-Song-List/raw/main/src/generator.user.js
// @downloadURL  https://github.com/Problem02/AMQ-Stats-Display/raw/refs/heads/main/AMQ-Stats-Display.user.js
// @updateURL    https://github.com/Problem02/AMQ-Stats-Display/raw/refs/heads/main/AMQ-Stats-Display.user.js
// ==/UserScript==

(function () {
  "use strict";

  const types = ["OP", "ED", "IN"];

  function injectStatsButtonCSS() {
    if (document.getElementById("amqStatsBtnCss")) return;

    const style = document.createElement("style");
    style.id = "amqStatsBtnCss";
    style.textContent = `
        /* Make the button narrower without changing height */
        #amqStatsLobbyButton {
            min-width: 0 !important;
            width: auto !important;

            /* reduce width by reducing horizontal padding */
            padding-left: 8px !important;
            padding-right: 8px !important;
        }

        /* Ensure text doesn't re-introduce spacing */
        #amqStatsLobbyButton h3 {
            margin: 0 !important;
            padding: 0 !important;
            white-space: nowrap;
        }


            /* --- UI enhancements --- */
            #statsModal{ --good:46,204,113; --ok:241,196,15; --bad:231,76,60; --ink:255,255,255; }

            #statsModal .as-summary{display:flex;gap:10px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);}
            #statsModal .as-kpi{padding:6px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);font-variant-numeric:tabular-nums;min-width:120px;}
            #statsModal .as-kpi b{display:block;font-size:12px;opacity:.75;margin-bottom:2px;}
            #statsModal .as-kpi span{font-size:14px;font-weight:700;}            #statsModal .as-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;padding:12px;}
            #statsModal .as-card{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);border-radius:12px;padding:10px 12px;}
            #statsModal .as-card h4{margin:0 0 8px 0;font-size:13px;opacity:.9;}
            #statsModal .as-card .as-row{display:flex;justify-content:space-between;gap:10px;font-variant-numeric:tabular-nums;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.10);}
            #statsModal .as-card .as-row:last-child{border-bottom:none;}
            #statsModal .as-card .as-row .as-muted{opacity:.75;}

            #statsModal .as-actions{display:flex;gap:8px;flex-wrap:wrap;padding:12px;border-bottom:1px solid rgba(255,255,255,.08);}
            #statsModal .as-overallActions{justify-content:flex-end;padding:0;margin:2px 0 10px;border-bottom:none;}
            #statsModal .as-overallFooter{position:sticky;bottom:0;z-index:6;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;background:rgba(35,35,35,.98);border-top:1px solid rgba(255,255,255,.10);}
            #statsModal .as-footerBtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
            #statsModal .as-status{font-size:12px;opacity:.85;max-width:60%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
            #statsModal .as-status.good{color:rgb(46,204,113);}
            #statsModal .as-status.bad{color:rgb(231,76,60);}
            #statsModal .as-status.ok{color:rgb(241,196,15);}
            #statsModal .as-action{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);color:inherit;padding:6px 10px;border-radius:10px;cursor:pointer;font-size:13px;}
            #statsModal .as-action:hover{background:rgba(255,255,255,.09);}
            #statsModal .as-action.as-export{background:rgba(0,123,255,.35);border:1px solid rgba(0,123,255,.65);color:#fff;font-weight:700;border-radius:8px;}
#statsModal .as-action.as-export:hover{background:rgba(0,123,255,.45);filter:none;}

            /* Track Missed toggle */
            #statsModal .as-action.as-trackOff{background:rgba(231,76,60,.35);border:1px solid rgba(231,76,60,.70);color:#fff;font-weight:700;border-radius:8px;}
            #statsModal .as-action.as-trackOff:hover{background:rgba(231,76,60,.45);}
            #statsModal .as-action.as-trackOn{background:rgba(46,204,113,.30);border:1px solid rgba(46,204,113,.70);color:#fff;font-weight:700;border-radius:8px;}
            #statsModal .as-action.as-trackOn:hover{background:rgba(46,204,113,.40);}

            #statsModal .as-badge{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:999px;font-size:12px;border:1px solid rgba(var(--ink),.18);background:rgba(255,255,255,.06);white-space:nowrap;font-variant-numeric:tabular-nums;}
            #statsModal .as-badge.good{background:rgba(var(--good),.18);border-color:rgba(var(--good),.40);}
            #statsModal .as-badge.ok{background:rgba(var(--ok),.18);border-color:rgba(var(--ok),.40);}
            #statsModal .as-badge.bad{background:rgba(var(--bad),.18);border-color:rgba(var(--bad),.40);}
/* Compact density (default) */
            #statsModal table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;}
            #statsModal table.as-table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;}
            #statsModal table.as-table tbody td{border-bottom:1px solid rgba(255,255,255,.08);padding:10px 12px;vertical-align:top;}
            #statsModal table.as-table thead th{position:sticky;top:var(--as-thead-top,0px);z-index:3;background:rgba(50,50,50,.98);border-bottom:1px solid rgba(255,255,255,.12);padding:10px 12px;text-align:left;cursor:pointer;user-select:none;white-space:nowrap;}
            #statsModal table.as-table thead th:first-child{padding-left:14px;}
            #statsModal table.as-table tbody td:first-child{padding-left:14px;}
            #statsModal h3{margin:8px 0 !important;}
            #statsModal .as-controls{gap:8px;}


/* --- Daily accuracy mini chart --- */
#statsModal .as-miniChart{margin-top:6px;padding-top:8px;border-top:1px solid rgba(255,255,255,.10);position:relative;}
#statsModal .as-miniChartTitle{font-size:12px;opacity:.85;margin:0 0 6px 0;}
#statsModal #asDailyAccuracyCanvas{width:100%;height:110px;display:block;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.10);border-radius:10px;}
#statsModal .as-miniChartEmpty{margin-top:6px;font-size:12px;opacity:.7;display:none;}
#statsModal .as-miniTooltip{position:absolute;left:0;top:0;display:none;pointer-events:none;z-index:5;
  background:rgba(20,20,20,.92);border:1px solid rgba(255,255,255,.18);border-radius:10px;
  padding:6px 8px;color:#fff;font-size:12px;line-height:1.2;white-space:nowrap;
  box-shadow:0 6px 18px rgba(0,0,0,.35);}

/* All table content left-aligned (including numeric columns) */
#statsModal table.as-table th,
#statsModal table.as-table td { text-align: left !important; }
#statsModal .as-num { text-align: left !important; font-variant-numeric: tabular-nums; }
`;
    document.head.appendChild(style);
  }

  function calculateStats() {
    const rawData = localStorage.getItem("extendedSongList");
    if (!rawData) {
      const msg = 'No data found in localStorage under "extendedSongList". Please ensure the Extended Song List data is generated before opening stats.';
      if (window.messageDisplayer && typeof window.messageDisplayer.displayMessage === "function") {
        window.messageDisplayer.displayMessage(msg);
      } else {
        console.warn("[AMQ Stats]", msg);
      }
      return null;
}

    const data = JSON.parse(rawData);
    const stats = {
      overall: {
        totalEntries: 0,
        correctCount: 0,
        gettable: 0,
        totalPlays: 0,
        learned: 0,
        unlearned: 0,
        unplayed: 0,
      },
      types: { OP: {}, ED: {}, IN: {} },
      under30: {
        totalEntries: 0,
        totalPlays: 0,
        correctCount: 0,
        gettable: 0,
        learned: 0,
        unlearned: 0,
        unplayed: 0,
      },
      animeStats: [],
      artistStats: [],
      songStats: [],
      animeToLearn: [],
      songsToLearn: [],
      songsNeverGot: [],
    };

    const animeData = {};
    const artistData = {};
    const songData = {};

    types.forEach((type) => {
      stats.types[type] = {
        total: 0,
        plays: 0,
        correct: 0,
        learned: 0,
        unlearned: 0,
        unplayed: 0,
        gettable: 0,
        under30: {},
      };
    });

    Object.entries(data).forEach(([_, entry]) => {
      const type = types[entry.type - 1];
      const correct = entry.totalCorrectCount || 0;
      const wrong = entry.totalWrongCount || 0;
      const plays = correct + wrong;
      const diff = entry.globalPercent;
      const percentage = plays > 0 ? (correct / plays) * 100 : 0;

      // Update overall stats
      stats.overall.totalEntries++;
      stats.overall.correctCount += correct;
      if (correct > 0) stats.overall.gettable++;
      stats.overall.totalPlays += plays;
      if (percentage >= 70) stats.overall.learned++;
      else if (plays > 0) stats.overall.unlearned++;
      else stats.overall.unplayed++;

      // Update type-specific stats
      const typeStats = stats.types[type];
      typeStats.total++;
      typeStats.plays += plays;
      if (correct > 0) typeStats.gettable++;
      typeStats.correct += correct;
      if (percentage >= 70) typeStats.learned++;
      else if (plays > 0) typeStats.unlearned++;
      else typeStats.unplayed++;

      // Update under-30 stats
      if (diff < 30) {
        stats.under30.totalEntries++;
        stats.under30.totalPlays += plays;
        stats.under30.correctCount += correct;
        if (correct > 0) stats.under30.gettable++;
        if (percentage >= 70) stats.under30.learned++;
        else if (plays > 0) stats.under30.unlearned++;
        else stats.under30.unplayed++;
      }

      // Update anime stats
      for (const animeId in entry.anime) {
        const anime =
          entry.anime[animeId].names.EN || entry.anime[animeId].names.JA;
        if (!animeData[anime]) {
          animeData[anime] = { plays: 0, correct: 0 };
        }
        animeData[anime].plays += plays;
        animeData[anime].correct += correct;
      }

      // Update artist stats
      const artist = entry.artist;
      if (artist) {
        if (!artistData[artist]) {
          artistData[artist] = { plays: 0, correct: 0 };
        }
        artistData[artist].plays += plays;
        artistData[artist].correct += correct;
      }

      // Update song stats
      const song = entry.name;
      if (song) {
        // Use a composite key so songs with the same title from different anime/versions don't get merged together
        const animeKey = entry.anime
          ? Object.keys(entry.anime).sort().join("|")
          : "";
        const songKey = `${song}||${entry.artist || ""}||${
          type || ""
        }||${animeKey}`;

        if (!songData[songKey]) {
          songData[songKey] = {
            song,
            plays: 0,
            correct: 0,
            artist: entry.artist,
            difficulty: entry.globalPercent,
            anime: entry.anime,
            type: type,
            recentPercent: entry.recentPercent,
          };
        }
        songData[songKey].plays += plays;
        songData[songKey].correct += correct;

        // Add to songsNeverGot if plays > 0 and correct == 0
        if (plays > 0 && correct === 0) {
          stats.songsNeverGot.push({
            song: song,
            artist: entry.artist,
            difficulty: entry.globalPercent,
            anime: Object.values(entry.anime)
              .map((a) => a.names.EN || a.names.JA)
              .join(", "),
            type: type,
            plays: plays,
            correct: 0,
            percentage: 0,
            recentPercent: entry.recentPercent ?? 0,
          });
        }
      }
    });

    // Prepare anime stats
    for (const anime in animeData) {
      const { plays, correct } = animeData[anime];
      const percentage = plays > 0 ? (correct / plays) * 100 : 0;
      stats.animeStats.push({ anime, plays, correct, percentage });

      // Add to animeToLearn if plays > 0 and percentage < 60
      if (plays > 0 && percentage < 60) {
        stats.animeToLearn.push({ anime, plays, correct, percentage });
      }
    }

    stats.animeStats.sort((a, b) => b.plays - a.plays);
    stats.animeToLearn.sort((a, b) => b.plays - a.plays);

    // Prepare artist stats
    for (const artist in artistData) {
      const { plays, correct } = artistData[artist];
      stats.artistStats.push({
        artist,
        plays,
        correct,
        percentage: plays > 0 ? (correct / plays) * 100 : 0,
      });
    }

    stats.artistStats.sort((a, b) => b.plays - a.plays);

    // Prepare song stats
    for (const songKey in songData) {
      const {
        song,
        plays,
        correct,
        artist,
        difficulty,
        anime,
        type,
        recentPercent,
      } = songData[songKey];
      const percentage = plays > 0 ? (correct / plays) * 100 : 0;

      stats.songStats.push({
        song,
        artist,
        difficulty,
        anime: Object.values(anime)
          .map((a) => a.names.EN || a.names.JA)
          .join(", "),
        type,
        plays,
        correct,
        percentage,
        recentPercent,
      });

      // Add to songsToLearn if plays > 0 and percentage < 50
      if (plays > 0 && percentage < 50) {
        stats.songsToLearn.push({
          song,
          artist,
          difficulty,
          anime: Object.values(anime)
            .map((a) => a.names.EN || a.names.JA)
            .join(", "),
          type,
          plays,
          correct,
          percentage,
          recentPercent,
        });
      }
    }

    stats.songStats.sort((a, b) => b.plays - a.plays);
    stats.songsToLearn.sort((a, b) => b.plays - a.plays);
    stats.songsNeverGot.sort((a, b) => b.plays - a.plays);

    return stats;
  }

  // ---------------------------
  // Daily accuracy tracking + graph
  // ---------------------------
  const DAILY_ACC_KEY = "amqStatsDailyAccuracy_v1";

  function getLocalISODate() {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function loadDailyAcc() {
    try {
      return JSON.parse(localStorage.getItem(DAILY_ACC_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function saveDailyAcc(obj) {
    try {
      localStorage.setItem(DAILY_ACC_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  function recordDailyResult(isCorrect) {
    const day = getLocalISODate();
    const store = loadDailyAcc();
    if (!store[day]) store[day] = { correct: 0, total: 0 };
    store[day].total += 1;
    if (isCorrect) store[day].correct += 1;
    saveDailyAcc(store);

    // If the modal is open, redraw immediately
    const modal = document.getElementById("statsModal");
    if (modal) {
      try {
        renderDailyAccuracyChart(modal);
      } catch (e) {}
    }
  }

  function getLastNDays(n) {
    const days = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      days.push(local.toISOString().slice(0, 10));
    }
    return days;
  }

  function renderDailyAccuracyChart(root) {
    const canvas = root.querySelector("#asDailyAccuracyCanvas");
    const emptyEl = root.querySelector("#asDailyAccuracyEmpty");
    const wrap = root.querySelector("#asDailyAccuracyWrap");
    if (!canvas || !wrap) return;

    const store = loadDailyAcc();
    const days = getLastNDays(30);
    const points = days.map((day) => {
      const v = store[day];
      if (!v || !v.total) return null;
      return {
        day,
        pct: (v.correct / v.total) * 100,
        correct: v.correct,
        total: v.total,
      };
    });

    const hasAny = points.some((p) => p !== null);
    if (!hasAny) {
      if (emptyEl) emptyEl.style.display = "block";
      const ctx0 = canvas.getContext("2d");
      if (ctx0) ctx0.clearRect(0, 0, canvas.width, canvas.height);
      return;
    } else {
      if (emptyEl) emptyEl.style.display = "none";
    }

    // Size the canvas to match its CSS width (for crisp rendering)
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(200, Math.floor(rect.width));
    const height = Math.max(
      96,
      Math.floor(canvas.getAttribute("height") || 115)
    );
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // chart area
    const padL = 28,
      padR = 10,
      padT = 10,
      padB = 18;
    const cw = width - padL - padR;
    const ch = height - padT - padB;

    // find y range
    const ys = points.filter(Boolean).map((p) => p.pct);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    // pad y-range a bit; clamp to [0,100]
    yMin = Math.max(0, Math.floor((yMin - 5) / 5) * 5);
    yMax = Math.min(100, Math.ceil((yMax + 5) / 5) * 5);
    if (yMax === yMin) yMax = Math.min(100, yMin + 10);

    const xFor = (i) => padL + (i / (days.length - 1)) * cw;
    const yFor = (pct) => padT + (1 - (pct - yMin) / (yMax - yMin)) * ch;

    // grid + y labels (3 lines)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "11px Arial, sans-serif";

    const gridLines = 3;
    for (let g = 0; g <= gridLines; g++) {
      const t = g / gridLines;
      const y = padT + t * ch;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + cw, y);
      ctx.stroke();

      const val = Math.round(yMax - t * (yMax - yMin));
      ctx.fillText(String(val), 4, y + 4);
    }

    // line
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    points.forEach((p, i) => {
      if (!p) return;
      const x = xFor(i);
      const y = yFor(p.pct);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // dots
    ctx.fillStyle = "rgba(255,255,255,.95)";
    points.forEach((p, i) => {
      if (!p) return;
      const x = xFor(i);
      const y = yFor(p.pct);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Hover data (for tooltip)
    const hoverPts = [];
    points.forEach((p, i) => {
      if (!p) return;
      hoverPts.push({
        x: xFor(i),
        y: yFor(p.pct),
        day: p.day,
        pct: p.pct,
        correct: p.correct,
        total: p.total,
      });
    });
    canvas.__asDailyHoverPts = hoverPts;

    // Bind hover handlers once
    if (!canvas.dataset.asHoverBound) {
      canvas.dataset.asHoverBound = "1";
      const tip = root.querySelector("#asDailyAccuracyTooltip");

      const hideTip = () => {
        if (tip) tip.style.display = "none";
      };

      const showTip = (pt, mx, my) => {
        if (!tip) return;
        tip.innerHTML = `${pt.day}<br><b>${pt.pct.toFixed(2)}%</b> (${
          pt.correct
        }/${pt.total})`;
        tip.style.display = "block";

        const rect = canvas.getBoundingClientRect();
        const tw = tip.offsetWidth || 140;
        const th = tip.offsetHeight || 40;

        // Clamp tooltip inside canvas box
        const left = Math.max(6, Math.min(rect.width - tw - 6, mx + 12));
        const top = Math.max(6, Math.min(rect.height - th - 6, my - th - 10));
        tip.style.left = `${left}px`;
        tip.style.top = `${top}px`;
      };

      canvas.addEventListener("mousemove", (e) => {
        const pts = canvas.__asDailyHoverPts || [];
        if (!pts.length) return hideTip();

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        let best = null;
        let bestD2 = Infinity;
        for (const p of pts) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) {
            bestD2 = d2;
            best = p;
          }
        }

        if (best && bestD2 <= 11 * 11) showTip(best, mx, my);
        else hideTip();
      });

      canvas.addEventListener("mouseleave", hideTip);
    }

    // x labels (every 7 days)
    ctx.fillStyle = "rgba(255,255,255,.55)";
    for (let i = 0; i < days.length; i += 7) {
      const day = days[i];
      const label = day.slice(5); // MM-DD
      const x = xFor(i);
      ctx.fillText(label, x - 14, padT + ch + 14);
    }
  }

  function initDailyAccuracyTracking() {
    if (window.__amqStatsDailyAccHooked) return;
    window.__amqStatsDailyAccHooked = true;

    const tryBind = () => {
      const ListenerCtor =
        window.Listener || (typeof Listener !== "undefined" ? Listener : null);
      const quizObj = window.quiz;

      if (!ListenerCtor || !quizObj || !quizObj.players) return false;

      try {
        const l = new ListenerCtor("answer results", (event) => {
          try {
            const self = Object.values(quizObj.players).find(
              (p) => p.isSelf && p._inGame
            );
            if (!self) return;

            const plist = Array.isArray(event.players)
              ? event.players
              : event.players
              ? Object.values(event.players)
              : [];
            const selfRes = plist.find(
              (p) => p.gamePlayerId === self.gamePlayerId
            );
            if (!selfRes) return;

            recordDailyResult(!!selfRes.correct);
          } catch (e) {}
        });

        if (typeof l.bindListener === "function") l.bindListener();
        else if (typeof l.bind === "function") l.bind();
        else if (typeof l.on === "function") l.on();
        else {
          // last resort: if ListenerCtor itself behaves differently, we just stop trying
        }

        return true;
      } catch (e) {
        return false;
      }
    };

    // Bind once AMQ is fully loaded (quiz + Listener exist)
    const interval = setInterval(() => {
      if (tryBind()) clearInterval(interval);
    }, 1000);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatOverallStats(stats) {
    const { overall, under30, types } = stats;

    const safePct = (num, den) => (den > 0 ? (num / den) * 100 : 0);

    const acc = safePct(overall.correctCount, overall.totalPlays);
    const gettablePct = safePct(overall.gettable, overall.totalEntries);
    const learnedPct = safePct(overall.learned, overall.totalEntries);
    const unplayedPct = safePct(overall.unplayed, overall.totalEntries);

    const topPlayed = (stats.songStats || []).slice(0, 5);
    const worst = (stats.songStats || [])
      .filter((s) => (s.plays || 0) >= 5)
      .slice()
      .sort((a, b) => (a.percentage || 0) - (b.percentage || 0))
      .slice(0, 5);

    const listItem = (s) => `
      <li style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.08);">
        <span>
          <span class="as-clickable" data-goto-tab="songStats" data-goto-song="${escapeHtml(
            s.song
          )}" data-goto-artist="${escapeHtml(
      s.artist
    )}" data-goto-search="${escapeHtml(s.song)}">${escapeHtml(s.song)}</span>
          <span class="as-muted"> — ${escapeHtml(s.artist)}</span>
        </span>
        <span class="as-muted">plays: ${s.plays} · ${(
      s.percentage || 0
    ).toFixed(2)}%</span>
      </li>`;

    const typeCard = (label, t) => {
      const tAcc = safePct(t.correct || 0, t.plays || 0);
      const tGet = safePct(t.gettable || 0, t.total || 0);
      const tLearn = safePct(t.learned || 0, t.total || 0);
      const tPlayed = Math.max(0, (t.total || 0) - (t.unplayed || 0));
      const tPlayedPct = safePct(tPlayed, t.total || 0);
      return `
        <div class="as-card">
          <h4>${label}</h4>
          <div class="as-row"><span class="as-muted">Entries</span><span>${
            t.total || 0
          }</span></div>
          <div class="as-row"><span class="as-muted">Plays</span><span>${
            t.plays || 0
          }</span></div>
          <div class="as-row"><span class="as-muted">Played</span><span>${tPlayed} / ${
        t.total || 0
      } ${tPlayedPct.toFixed(2)}%</span></div>
          <div class="as-row"><span class="as-muted">Accuracy</span><span>${
            t.correct || 0
          } / ${t.plays || 0} ${tAcc.toFixed(2)}%</span></div>
          <div class="as-row"><span class="as-muted">Gettable</span><span>${
            t.gettable || 0
          } / ${t.total || 0} ${tGet.toFixed(2)}%</span></div>
          <div class="as-row"><span class="as-muted">Learned</span><span>${
            t.learned || 0
          } / ${t.total || 0} ${tLearn.toFixed(2)}%</span></div>
        </div>`;
    };

    const uAcc = safePct(under30.correctCount, under30.totalPlays);
    return `
            <div id="overallStats">
<div class="as-summary">
                <div class="as-kpi"><b>Total entries</b><span>${
                  overall.totalEntries
                }</span></div>
                <div class="as-kpi"><b>Total plays</b><span>${
                  overall.totalPlays
                }</span></div>
                <div class="as-kpi"><b>Accuracy</b><span>${acc.toFixed(
                  2
                )}%</span></div>
                <div class="as-kpi"><b>Gettable</b><span>${gettablePct.toFixed(
                  2
                )}%</span></div>
                <div class="as-kpi"><b>Learned (&gt;70%)</b><span>${learnedPct.toFixed(
                  2
                )}%</span></div>
                <div class="as-kpi"><b>Unplayed</b><span class="as-unplayed-pct">${unplayedPct.toFixed(
                  2
                )}%</span></div>
              </div>

              <div class="as-grid">
                ${typeCard("Openings (OP)", types.OP || {})}
                ${typeCard("Endings (ED)", types.ED || {})}
                ${typeCard("Inserts (IN)", types.IN || {})}
              </div>

              <div class="as-grid">
                <div class="as-card">
                  <h4>Recent (under 30 days)</h4>
                  <div class="as-row"><span class="as-muted">Entries</span><span>${
                    under30.totalEntries
                  }</span></div>
                  <div class="as-row"><span class="as-muted">Plays</span><span>${
                    under30.totalPlays
                  }</span></div>
                  <div class="as-row"><span class="as-muted">Accuracy</span><span>${
                    under30.correctCount
                  } / ${under30.totalPlays} ${uAcc.toFixed(2)}%</span></div>
                  <div class="as-miniChart" id="asDailyAccuracyWrap">
                    <div class="as-miniChartTitle">Daily accuracy (last 30 days)</div>
                    <canvas id="asDailyAccuracyCanvas" height="115"></canvas>
                    <div class="as-miniTooltip" id="asDailyAccuracyTooltip"></div>
                    <div class="as-miniChartEmpty as-muted" id="asDailyAccuracyEmpty">No daily data yet. Play a few rounds with this script enabled.</div>
                  </div>
</div>

                <div class="as-card">
                  <h4>Most played (top 5)</h4>
                  <ul style="list-style:none;margin:0;padding:0;">
                    ${
                      topPlayed.map(listItem).join("") ||
                      `<li class="as-muted">No data</li>`
                    }
                  </ul>
                </div>

                <div class="as-card">
                  <h4>Worst accuracy (min 5 plays)</h4>
                  <ul style="list-style:none;margin:0;padding:0;">
                    ${
                      worst.map(listItem).join("") ||
                      `<li class="as-muted">No data</li>`
                    }
                  </ul>
                </div>
              </div>
              <div class="as-overallFooter">
                <span class="as-status" id="asFooterStatus"></span>
                <div class="as-footerBtns">
                  <button class="as-action" id="asUpdateUnplayedBtn" type="button" title="Sync the 'Unplayed' custom list with songs you have never played">Update Unplayed</button>
                  <button class="as-action" id="asUpdateNeverGotBtn" type="button" title="Sync the 'Never Got' custom list with songs you have played but never answered correctly">Update Never Got</button>
                  <button class="as-action as-trackOff" id="asTrackMissedToggleBtn" type="button" title="Toggle tracking missed songs into the 'Recent Missed' custom list">Track Missed Off</button>
                  <button class="as-action as-export" id="asExportBtn" type="button" title="Export stats to CSV">Export CSV</button>
                </div>
              </div>
            </div>
        `;
  }

  function formatAnimeStats(stats) {
    const total = ((stats && stats.animeStats) || []).length;
    return `
            <div id="animeStats" class="as-tableSection">
                <div class="as-sectionHeading">
                    <span>Anime Stats</span>
                    <span class="as-count">${total}</span>
                </div>

                <table class="as-table" data-section="animeStats">
                    <thead>
                        <tr>
                            <th style="width: 30%;">Name</th>
                            <th class="as-num" style="width: 20%;">Plays</th>
                            <th class="as-num" style="width: 20%;">Correct Count</th>
                            <th class="as-num" style="width: 30%;">Percentage</th>
                        </tr>
                    </thead>
                    <tbody id="asTbody-animeStats"></tbody>
                </table>
            </div>
        `;
  }

  // Safely format percentages (handles null/undefined/NaN/Infinity).
  function formatPercent(value, digits = 2) {
    if (value === null || value === undefined) return "N/A";
    const num = Number(value);
    if (!Number.isFinite(num)) return "N/A";
    return `${num.toFixed(digits)}%`;
  }

  // Debounce helper (used to keep search input responsive on large tables)
  function debounce(fn, wait = 150) {
    let t = 0;
    return function (...args) {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Throttle helper (used to keep range slider filtering smooth while dragging)
  function throttle(fn, wait = 80) {
    let last = 0;
    let t = 0;
    let lastArgs;
    let lastThis;

    return function (...args) {
      const now = Date.now();
      lastArgs = args;
      lastThis = this;

      const remaining = wait - (now - last);
      if (remaining <= 0 || remaining > wait) {
        if (t) {
          window.clearTimeout(t);
          t = 0;
        }
        last = now;
        fn.apply(lastThis, lastArgs);
      } else if (!t) {
        t = window.setTimeout(() => {
          t = 0;
          last = Date.now();
          fn.apply(lastThis, lastArgs);
        }, remaining);
      }
    };
  }

  // Append HTML containing one or more <tr> rows to a <tbody>, and return the appended row elements.
  function appendRowsHtml(tbody, html) {
    if (!tbody || !html) return [];
    const tmp = document.createElement("tbody");
    tmp.innerHTML = html;
    const rows = Array.from(tmp.children);
    if (!rows.length) return [];
    const frag = document.createDocumentFragment();
    rows.forEach((r) => frag.appendChild(r));
    tbody.appendChild(frag);
    return rows;
  }

  function songishRowHtml(song) {
    const songName = escapeHtml(song.song || "");
    const artist = escapeHtml(song.artist || "");
    const anime = escapeHtml(song.anime || "");
    const type = escapeHtml(song.type || "");

    const plays = Number(song.plays || 0);
    const correct = Number(song.correct || 0);

    // IMPORTANT: keep difficulty formatting identical to the pre-optimization script.
    // - Display uses formatPercent(rawDifficulty) so undefined/null/NaN shows "N/A"
    // - data-filter-value uses the raw value (not the formatted percent string)
    const rawDifficulty = song.difficulty;

    return `
      <tr data-type="${type}" data-plays="${plays}" data-artist="${artist}" data-anime="${anime}" data-song="${songName}" data-difficulty="${rawDifficulty}">
        <td><span class="as-filterable" data-filter-key="song" data-filter-value="${songName}">${songName}</span></td>
        <td><span class="as-filterable" data-filter-key="artist" data-filter-value="${artist}">${artist}</span></td>
        <td class="as-num"><span class="as-filterable" data-filter-key="difficulty" data-filter-value="${rawDifficulty}">${formatPercent(
      rawDifficulty
    )}</span></td>
        <td><span class="as-filterable" data-filter-key="anime" data-filter-value="${anime}">${anime}</span></td>
        <td><span class="as-filterable" data-filter-key="type" data-filter-value="${type}">${type}</span></td>
        <td class="as-num">${plays}</td>
        <td class="as-num">${correct}</td>
        <td class="as-num">${formatPercent(song.percentage)}</td>
        <td class="as-num">${formatPercent(song.recentPercent)}</td>
      </tr>
    `;
  }

  function animeRowHtml(anime) {
    const name = escapeHtml(anime.anime || "");
    const plays = Number(anime.plays || 0);
    const correct = Number(anime.correct || 0);
    return `
      <tr>
        <td><span class="as-clickable" data-drill-anime="${name}">${name}</span></td>
        <td class="as-num">${plays}</td>
        <td class="as-num">${correct}</td>
        <td class="as-num">${formatPercent(anime.percentage)}</td>
      </tr>
    `;
  }

  function artistRowHtml(artistObj) {
    const name = escapeHtml(artistObj.artist || "");
    const plays = Number(artistObj.plays || 0);
    const correct = Number(artistObj.correct || 0);
    return `
      <tr>
        <td><span class="as-clickable" data-drill-artist="${name}">${name}</span></td>
        <td class="as-num">${plays}</td>
        <td class="as-num">${correct}</td>
        <td class="as-num">${formatPercent(artistObj.percentage)}</td>
      </tr>
    `;
  }

  function initIncrementalRendering(root, stats) {
    const token = { cancelled: false };

    // Stop background work when modal is removed
    const observer = new MutationObserver(() => {
      if (!document.body.contains(root)) {
        token.cancelled = true;
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const cfgs = [
      {
        tabId: "songStats",
        tbodyId: "asTbody-songStats",
        labelId: "asLoad-songStats",
        items: (stats && stats.songStats) || [],
        rowHtml: songishRowHtml,
      },
      {
        tabId: "songsToLearnStats",
        tbodyId: "asTbody-songsToLearnStats",
        labelId: "asLoad-songsToLearnStats",
        items: (stats && stats.songsToLearn) || [],
        rowHtml: songishRowHtml,
      },
      {
        tabId: "songsNeverGotStats",
        tbodyId: "asTbody-songsNeverGotStats",
        labelId: "asLoad-songsNeverGotStats",
        items: (stats && stats.songsNeverGot) || [],
        rowHtml: songishRowHtml,
      },
      {
        tabId: "animeStats",
        tbodyId: "asTbody-animeStats",
        labelId: "asLoad-animeStats",
        items: (stats && stats.animeStats) || [],
        rowHtml: animeRowHtml,
      },
      {
        tabId: "animeToLearnStats",
        tbodyId: "asTbody-animeToLearnStats",
        labelId: "asLoad-animeToLearnStats",
        items: (stats && stats.animeToLearn) || [],
        rowHtml: animeRowHtml,
      },
      {
        tabId: "artistStats",
        tbodyId: "asTbody-artistStats",
        labelId: "asLoad-artistStats",
        items: (stats && stats.artistStats) || [],
        rowHtml: artistRowHtml,
      },
    ];

    const makeRenderer = (cfg) => {
      let i = 0;
      let started = false;

      const tbody = root.querySelector("#" + cfg.tbodyId);
      const items = Array.isArray(cfg.items) ? cfg.items : [];
      const total = items.length;

      const renderSome = (count) => {
        if (token.cancelled || !tbody || !tbody.isConnected) return;
        const end = Math.min(total, i + count);
        if (end <= i) return;

        const parts = new Array(end - i);
        for (let j = i, k = 0; j < end; j++, k++)
          parts[k] = cfg.rowHtml(items[j]);
        const html = parts.join("");
        i = end;

        const rows = appendRowsHtml(tbody, html);

        // Apply badges + current filters to newly-added rows only
        rows.forEach((r) => decorateAcc(r));
        try {
          root.dispatchEvent(
            new CustomEvent("as-apply-rows", {
              detail: { rows, tabId: cfg.tabId },
            })
          );
        } catch (e) {}
      };

      const schedule = () => {
        if (token.cancelled || !tbody || !tbody.isConnected) return;
        if (i >= total) return;

        const work = () => {
          if (token.cancelled || !tbody || !tbody.isConnected) return;
          renderSome(250);
          schedule();
        };

        if (window.requestIdleCallback) {
          window.requestIdleCallback(work, { timeout: 200 });
        } else {
          window.setTimeout(work, 0);
        }
      };

      return {
        start() {
          if (started) return;
          started = true;

          // First chunk: show something immediately
          renderSome(500);

          // Remaining chunks: background
          schedule();
        },
        get started() {
          return started;
        },
      };
    };

    const renderers = new Map();
    cfgs.forEach((cfg) => renderers.set(cfg.tabId, makeRenderer(cfg)));

    const startFor = (tabId) => {
      const r = renderers.get(tabId);
      if (r) r.start();
    };

    // Start rendering the tab the user visits first
    root.addEventListener("as-tab-changed", (ev) => {
      const tabId = ev && ev.detail && ev.detail.tabId;
      if (tabId) startFor(tabId);
    });

    // Prewarm the biggest table shortly after open (keeps UI snappy on first click)
    window.setTimeout(() => startFor("songStats"), 0);
  }

  function formatArtistStats(stats) {
    const total = ((stats && stats.artistStats) || []).length;
    return `
            <div id="artistStats" class="as-tableSection">
                <div class="as-sectionHeading">
                    <span>Artist Stats</span>
                    <span class="as-count">${total}</span>
                </div>

                <table class="as-table" data-section="artistStats">
                    <thead>
                        <tr>
                            <th style="width: 30%;">Name</th>
                            <th class="as-num" style="width: 20%;">Plays</th>
                            <th class="as-num" style="width: 20%;">Correct Count</th>
                            <th class="as-num" style="width: 30%;">Percentage</th>
                        </tr>
                    </thead>
                    <tbody id="asTbody-artistStats"></tbody>
                </table>
            </div>
        `;
  }

  function formatSongStats(stats) {
    const total = ((stats && stats.songStats) || []).length;
    return `
            <div id="songStats" class="as-tableSection">
                <div class="as-sectionHeading">
                    <span>Song Stats</span>
                    <span class="as-count">${total}</span>
                </div>

                <table class="as-table" data-section="songStats">
                    <thead>
                        <tr>
                            <th style="white-space: nowrap;">Song</th>
                            <th style="white-space: nowrap;">Artist</th>
                            <th class="as-num" style="white-space: nowrap;">Difficulty</th>
                            <th style="white-space: nowrap;">Anime</th>
                            <th style="white-space: nowrap;">Type</th>
                            <th class="as-num" style="white-space: nowrap;">Plays</th>
                            <th class="as-num" style="white-space: nowrap;">Correct Count</th>
                            <th class="as-num" style="white-space: nowrap;">Percentage</th>
                            <th class="as-num" style="white-space: nowrap;">Recent Percentage</th>
                        </tr>
                    </thead>
                    <tbody id="asTbody-songStats"></tbody>
                </table>
            </div>
        `;
  }

  function formatAnimeToLearnStats(stats) {
    const total = ((stats && stats.animeToLearn) || []).length;
    return `
            <div id="animeToLearnStats" class="as-tableSection">
                <div class="as-sectionHeading">
                    <span>Anime To Learn</span>
                    <span class="as-count">${total}</span>
                </div>

                <table class="as-table" data-section="animeToLearnStats">
                    <thead>
                        <tr>
                            <th style="width: 30%;">Name</th>
                            <th class="as-num" style="width: 20%;">Plays</th>
                            <th class="as-num" style="width: 20%;">Correct Count</th>
                            <th class="as-num" style="width: 30%;">Percentage</th>
                        </tr>
                    </thead>
                    <tbody id="asTbody-animeToLearnStats"></tbody>
                </table>
            </div>
        `;
  }

  function formatSongsToLearnStats(stats) {
    const total = ((stats && stats.songsToLearn) || []).length;
    return `
            <div id="songsToLearnStats" class="as-tableSection">
                <div class="as-sectionHeading">
                    <span>Songs to Learn</span>
                    <span class="as-count">${total}</span>
                </div>

                <table class="as-table" data-section="songsToLearnStats">
                    <thead>
                        <tr>
                            <th style="white-space: nowrap;">Song</th>
                            <th style="white-space: nowrap;">Artist</th>
                            <th class="as-num" style="white-space: nowrap;">Difficulty</th>
                            <th style="white-space: nowrap;">Anime</th>
                            <th style="white-space: nowrap;">Type</th>
                            <th class="as-num" style="white-space: nowrap;">Plays</th>
                            <th class="as-num" style="white-space: nowrap;">Correct Count</th>
                            <th class="as-num" style="white-space: nowrap;">Percentage</th>
                            <th class="as-num" style="white-space: nowrap;">Recent Percentage</th>
                        </tr>
                    </thead>
                    <tbody id="asTbody-songsToLearnStats"></tbody>
                </table>
            </div>
        `;
  }

  function formatSongsNeverGotStats(stats) {
    const total = ((stats && stats.songsNeverGot) || []).length;
    return `
            <div id="songsNeverGotStats" class="as-tableSection">
                <div class="as-sectionHeading">
                    <span>Songs Never Got</span>
                    <span class="as-count">${total}</span>
                </div>

                <table class="as-table" data-section="songsNeverGotStats">
                    <thead>
                        <tr>
                            <th style="white-space: nowrap;">Song</th>
                            <th style="white-space: nowrap;">Artist</th>
                            <th class="as-num" style="white-space: nowrap;">Difficulty</th>
                            <th style="white-space: nowrap;">Anime</th>
                            <th style="white-space: nowrap;">Type</th>
                            <th class="as-num" style="white-space: nowrap;">Plays</th>
                            <th class="as-num" style="white-space: nowrap;">Correct Count</th>
                            <th class="as-num" style="white-space: nowrap;">Percentage</th>
                            <th class="as-num" style="white-space: nowrap;">Recent Percentage</th>
                        </tr>
                    </thead>
                    <tbody id="asTbody-songsNeverGotStats"></tbody>
                </table>
            </div>
        `;
  }

  function ensureStyles() {
    if (document.getElementById("amqStatsDisplayStyles")) return;
    const style = document.createElement("style");
    style.id = "amqStatsDisplayStyles";
    style.textContent = `
            #statsModal{font-family:inherit;}
            #statsModal .as-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;}
            #statsModal .as-panel{background:rgba(35,35,35,.98);border:1px solid rgba(255,255,255,.15);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.55);width:min(1200px,95vw);height:min(760px,92vh);display:flex;flex-direction:column;overflow:hidden;}
            #statsModal .as-header{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.12);}
            #statsModal .as-title{font-size:16px;font-weight:700;letter-spacing:.2px;opacity:.95;white-space:nowrap;}
            #statsModal .as-tabs{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
            #statsModal .as-tab{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);color:#fff;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:13px;}
            #statsModal .as-tab.as-active{background:rgba(0,123,255,.35);border-color:rgba(0,123,255,.65);}
            #statsModal .as-spacer{flex:1;}
            #statsModal .as-close{background:rgba(255,0,0,.30);border:1px solid rgba(255,0,0,.55);color:#fff;padding:6px 10px;border-radius:8px;cursor:pointer;}
            #statsModal .as-controls{display:flex;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.12);flex-wrap:wrap;}
            #statsModal .as-controls input,#statsModal .as-controls select{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:8px;padding:6px 10px;font-size:13px;}
            #statsModal .as-controls select.as-amq-select{appearance:none;background:rgba(20,20,20,.85);border-color:rgba(255,255,255,.18);padding-right:28px;}
            #statsModal .as-controls select.as-amq-select:focus{outline:none;border-color:rgba(0,123,255,.65);box-shadow:0 0 0 2px rgba(0,123,255,.20);}
            #statsModal .as-diffRange{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
            #statsModal .as-diffRange input[type="text"]{width:72px;-moz-appearance:textfield;}
            #statsModal .as-diffRange input[type="number"]::-webkit-outer-spin-button,
            #statsModal .as-diffRange input[type="number"]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}

            #statsModal .as-dualSlider{position:relative;width:170px;height:18px;display:inline-flex;align-items:center;margin:0 4px;;--as-thumb:14px;--as-thumbPad:10px}
            #statsModal .as-dualSlider .as-dualTrack{position:absolute;left:var(--as-thumbPad);right:var(--as-thumbPad);top:50%;transform:translateY(-50%);height:4px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.10);z-index:1;}
            #statsModal .as-dualSlider .as-dualFill{position:absolute;left:var(--as-thumbPad);right:var(--as-thumbPad);top:50%;transform:translateY(-50%);height:4px;border-radius:999px;background:rgba(0,123,255,.55);z-index:2;pointer-events:none;}

            /* Dual-handle slider: two overlapping ranges that look like one bar */
            #statsModal .as-dualSlider input[type="range"]{position:absolute;left:0;top:0;width:100%;height:18px;margin:0;background:transparent;pointer-events:none;-webkit-appearance:none;appearance:none;z-index:3;}
            #statsModal .as-dualSlider input[type="range"]::-webkit-slider-runnable-track{height:4px;background:transparent;border:none;}
            #statsModal .as-dualSlider input[type="range"]::-webkit-slider-thumb{pointer-events:auto;-webkit-appearance:none;height:14px;width:14px;border-radius:50%;background:rgba(255,255,255,.90);border:1px solid rgba(0,0,0,.45);box-shadow:0 0 0 2px rgba(0,0,0,.18);}
            #statsModal .as-dualSlider input[type="range"]::-moz-range-track{height:4px;background:transparent;border:none;}
            #statsModal .as-dualSlider input[type="range"]::-moz-range-thumb{pointer-events:auto;height:14px;width:14px;border-radius:50%;background:rgba(255,255,255,.90);border:1px solid rgba(0,0,0,.45);box-shadow:0 0 0 2px rgba(0,0,0,.18);}

            #statsModal .as-controls label{display:flex;gap:6px;align-items:center;font-size:13px;opacity:.95;}
            #statsModal .as-controls .as-pill{padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);font-size:12px;}
            #statsModal .as-body{flex:1;overflow:auto;padding:0;scrollbar-gutter:stable;}
            #statsModal .as-overallFooter{position:sticky;bottom:0;z-index:6;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;background:rgba(35,35,35,.98);border-top:1px solid rgba(255,255,255,.10);}
            #statsModal .as-footerBtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
            #statsModal .as-status{font-size:12px;opacity:.85;max-width:60%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
            #statsModal .as-status.good{color:rgb(46,204,113);}
            #statsModal .as-status.bad{color:rgb(231,76,60);}
            #statsModal .as-status.ok{color:rgb(241,196,15);}
            /* Inner table scrolling: scrollbar begins below the section heading.
               IMPORTANT: use flex sizing (not percentage heights) so scrolling never "dies". */
            #statsModal .as-body{min-height:0;} /* allow flex children to shrink */
            #statsModal.as-innerScroll .as-panel{height:min(760px,92vh);} /* give inner scroll a definite height */
            #statsModal.as-innerScroll .as-body{overflow:hidden;display:flex;flex-direction:column;min-height:0;}
            #statsModal.as-innerScroll .as-section.as-visible{display:flex !important;flex-direction:column;flex:1;min-height:0;}
            #statsModal.as-innerScroll .as-tableSection{display:flex;flex-direction:column;flex:1;min-height:0;}
            #statsModal.as-innerScroll .as-tableWrap{flex:1;min-height:0;overflow:hidden;}
            #statsModal.as-innerScroll table.as-table{width:100%;height:100%;display:block;table-layout:fixed;}
            #statsModal.as-innerScroll table.as-table thead{display:block;}
            #statsModal.as-innerScroll table.as-table tbody{display:block;overflow:auto;height:calc(100% - var(--as-thead-h, 0px));scrollbar-gutter:stable;}
            #statsModal.as-innerScroll table.as-table thead tr,
            #statsModal.as-innerScroll table.as-table tbody tr{display:table;width:100%;table-layout:fixed;}
            #statsModal.as-innerScroll table.as-table thead th{position:relative !important;top:auto !important;}

            #statsModal .as-section{display:none !important;}
            #statsModal .as-section.as-visible{display:block !important;}
            #statsModal .as-tableSection{min-height:100%;}
            #statsModal .as-sectionHeading{position:sticky;top:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;font-size:13px;font-weight:700;letter-spacing:.2px;background:rgba(42,42,42,.98);border-bottom:1px solid rgba(255,255,255,.12);}
            #statsModal .as-sectionHeading .as-count{font-size:11px;font-weight:600;opacity:.85;padding:2px 8px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.04);}
            #statsModal .as-num{text-align:left;font-variant-numeric:tabular-nums;}

            #statsModal table{width:100%;border-collapse:collapse;font-size:13px;}
            #statsModal table.as-table thead th{position:sticky;top:var(--as-thead-top, 0px);background:rgba(50,50,50,.98);z-index:2;border-bottom:1px solid rgba(255,255,255,.15);padding:8px;text-align:left;cursor:pointer;user-select:none;white-space:nowrap;}
            #statsModal table.as-table thead th.as-sortable{padding-right:22px;}
            #statsModal table.as-table thead th.as-sortable::after{content:"";position:absolute;right:8px;top:50%;transform:translateY(-50%);opacity:.55;font-size:11px;}
            #statsModal table.as-table thead th.as-sortable[data-sort-dir="asc"]::after{content:"▲";}
            #statsModal table.as-table thead th.as-sortable[data-sort-dir="desc"]::after{content:"▼";}

            #statsModal tbody td{border-bottom:1px solid rgba(255,255,255,.08);padding:8px;vertical-align:top;}
            #statsModal table.as-table tbody tr:nth-child(even){background:rgba(255,255,255,.02);}
            #statsModal table.as-table tbody tr:hover{background:rgba(255,255,255,.05);} 
            #statsModal .as-clickable{color:#9ad1ff;cursor:pointer;text-decoration:underline;text-underline-offset:2px;}

            #statsModal .as-filter-add{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
            #statsModal .as-filterChips{display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-height:18px;}
            #statsModal .as-chip{display:inline-flex;gap:6px;align-items:center;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);font-size:12px;cursor:pointer;user-select:none;white-space:nowrap;}
            #statsModal .as-chip:hover{background:rgba(255,255,255,.09);}
            #statsModal .as-chip .as-x{opacity:.85;font-weight:700;line-height:1;}
            #statsModal .as-quickFilters{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
            #statsModal .as-filterable{cursor:pointer;text-decoration:underline dotted rgba(255,255,255,.35);text-underline-offset:3px;}
            #statsModal .as-filterable:hover{text-decoration-color:rgba(255,255,255,.75);}
#statsModal .as-muted{opacity:.75;}
        
/* --- Table alignment refresh --- */
#statsModal table.as-table th, #statsModal table.as-table td{ text-align:left !important; }

/* Song/artist/anime columns remain left-aligned on song-ish tables */


/* --- Table alignment / stickies (final overrides) --- */
/* All table content left-aligned (including numeric columns) */
#statsModal table.as-table th,
#statsModal table.as-table td { text-align: left !important; }

#statsModal .as-num { text-align: left !important; font-variant-numeric: tabular-nums; }

/* Header row sticks directly under the section heading */
#statsModal:not(.as-innerScroll) table.as-table thead th { top: var(--as-thead-top, 0px) !important; z-index: 3; }

/* Avoid any "see-through" seams between sticky heading + sticky table head */
#statsModal .as-sectionHeading { margin: 0; }
#statsModal table.as-table { margin: 0; }
#statsModal table.as-table thead { background: rgba(50,50,50,.98); }
`;
    document.head.appendChild(style);
  }

  function showModal(stats) {
    ensureStyles();

    const existing = document.getElementById("statsModal");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "statsModal";

    root.innerHTML = `
          <div class="as-overlay" role="dialog" aria-modal="true">
            <div class="as-panel">
              <div class="as-header">
                <div class="as-title">AMQ Stats</div>
                <div class="as-tabs">
                  <button class="as-tab as-active" data-tab="overallStats">Overall</button>
                  <button class="as-tab" data-tab="animeStats">Anime</button>
                  <button class="as-tab" data-tab="artistStats">Artist</button>
                  <button class="as-tab" data-tab="songStats">Songs</button>
                  <button class="as-tab" data-tab="animeToLearnStats">Anime to Learn</button>
                  <button class="as-tab" data-tab="songsToLearnStats">Songs to Learn</button>
                  <button class="as-tab" data-tab="songsNeverGotStats">Never Got</button>
                </div>
                <div class="as-spacer"></div>
                <button class="as-close" data-action="close">Close</button>
              </div>

              <div class="as-controls" id="asControls">
                <input id="asSearch" type="text" placeholder="Search (anime / artist / song)..." />
                <div class="as-filter-add" id="asFilterAdd">
                  <select id="asFilterField" class="as-amq-select" title="Filter field">
                    <option value="song">Song</option>
                    <option value="artist">Artist</option>
                    <option value="anime">Anime</option>
                  </select>
                  <input id="asFilterInput" type="text" placeholder="Add filter" />
                  <button class="as-tab" id="asAddFilter" type="button">Add</button>
                </div>
                <div class="as-quickFilters" id="asQuickFilters">
                  <span class="as-muted">Type:</span>
                  <span class="as-chip as-qf" data-qf-key="type" data-qf-value="OP">OP</span>
                  <span class="as-chip as-qf" data-qf-key="type" data-qf-value="ED">ED</span>
                  <span class="as-chip as-qf" data-qf-key="type" data-qf-value="IN">IN</span>
                </div>
                <div class="as-diffRange" id="asDiffRange" title="Difficulty filter (min/max)">
                  <span class="as-muted">Difficulty:</span>
                  <input id="asDiffMin" type="text" inputmode="numeric" pattern="[0-9]*" value="0" />
                  <div class="as-dualSlider" id="asDiffDual" aria-label="Difficulty range">
                    <div class="as-dualTrack"></div>
                    <div class="as-dualFill" id="asDiffFill"></div>
                    <input id="asDiffMinRange" type="range" min="0" max="100" step="1" value="0" />
                    <input id="asDiffMaxRange" type="range" min="0" max="100" step="1" value="100" />
                  </div>
                  <input id="asDiffMax" type="text" inputmode="numeric" pattern="[0-9]*" value="100" />
                </div>
                <div class="as-filterChips" id="asFilterChips"></div>
                <button class="as-tab" id="asClearFilters" type="button">Clear</button>
              </div>
<div class="as-body" id="asBody">
                ${formatOverallStats(stats)}
                ${formatAnimeStats(stats)}
                ${formatArtistStats(stats)}
                ${formatSongStats(stats)}
                ${formatAnimeToLearnStats(stats)}
                ${formatSongsToLearnStats(stats)}
                ${formatSongsNeverGotStats(stats)}
              </div>
            </div>
          </div>
        `;

    root
      .querySelectorAll(
        "#overallStats,#animeStats,#artistStats,#songStats,#animeToLearnStats,#songsToLearnStats,#songsNeverGotStats"
      )
      .forEach((el) => {
        el.classList.add("as-section");
      });

    // Prepare per-table scroll containers.
    ensureTableWrap(root);

    root.querySelector("#overallStats").classList.add("as-visible");

    const onResize = () => syncStickyOffsets(root);
    window.addEventListener("resize", onResize);

    function closeModal() {
      try {
        window.removeEventListener("resize", onResize);
      } catch (e) {}
      root.remove();
    }

    root
      .querySelector('[data-action="close"]')
      .addEventListener("click", () => closeModal());
    root.querySelector(".as-overlay").addEventListener("click", (e) => {
      if (e.target.classList.contains("as-overlay")) closeModal();
    });

    document.addEventListener("keydown", function escListener(e) {
      if (e.key === "Escape" && document.getElementById("statsModal")) {
        closeModal();
        document.removeEventListener("keydown", escListener);
      }
    });

    // quick navigation from overall (or anywhere)
    root.addEventListener("click", (e) => {
      const t = e.target.closest("[data-goto-tab]");
      if (!t) return;
      e.preventDefault();
      const tabId = t.dataset.gotoTab;
      const tabBtn = root.querySelector(`.as-tab[data-tab="${tabId}"]`);
      if (tabBtn) tabBtn.click(); // triggers filtering scheduleApply()
      const q = t.dataset.gotoSearch || "";
      const song = t.dataset.gotoSong || "";
      const artist = t.dataset.gotoArtist || "";

      // If we have structured song/artist, apply a robust filter (song name + artist)
      if (song || artist) {
        root.dispatchEvent(
          new CustomEvent("as-set-filters", {
            detail: {
              search: song || q,
              artist: artist || "",
            },
          })
        );
      } else if (q) {
        const search = root.querySelector("#asSearch");
        if (search) {
          search.value = q;
          search.dispatchEvent(new Event("input"));
        }
      }
    });

    document.body.appendChild(root);

    // Cache initial (unfiltered) item counts so we can switch between total vs filtered counts.
    root.querySelectorAll(".as-sectionHeading .as-count").forEach((el) => {
      if (!el.dataset.total)
        el.dataset.total = String(el.textContent || "").trim();
    });

    // Allow mouse-wheel scrolling anywhere in the content area when using inner table scroll.
    // (Without this, scrolling only works when the cursor is over the table body.)
    const bodyEl = root.querySelector("#asBody");
    if (bodyEl) {
      bodyEl.addEventListener(
        "wheel",
        (e) => {
          if (!root.classList.contains("as-innerScroll")) return;

          // Don't hijack scroll from form controls.
          const tag =
            e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
          if (tag === "input" || tag === "textarea" || tag === "select") return;

          // If the wheel event originated inside the scrollable table area, let it scroll naturally.
          if (
            e.target &&
            e.target.closest &&
            e.target.closest(".as-tableWrap tbody")
          )
            return;

          const wrap = bodyEl.querySelector(
            ".as-section.as-visible .as-tableWrap"
          );
          const scroller = wrap ? wrap.querySelector("tbody") : null;
          if (!scroller) return;

          // If the table body can scroll, scroll it and prevent the "dead" feeling.
          const prev = scroller.scrollTop;
          scroller.scrollTop += e.deltaY;
          if (scroller.scrollTop !== prev) {
            e.preventDefault();
          }
        },
        { passive: false }
      );
    }

    window.requestAnimationFrame(() => syncStickyOffsets(root));
    window.requestAnimationFrame(() => syncStickyOffsets(root));
    initTableSorting(root);
    renderDailyAccuracyChart(root);
    initFilteringAndDrilldown(root);
    initIncrementalRendering(root, stats);
    decorateAcc(root.querySelector("#overallStats"));
    initExport(root, stats);
    initUpdateUnplayed(root);
    initUpdateNeverGot(root);
    initTrackMissedToggle(root);
  }

  // ---------------------------
  // Custom list sync: "Unplayed"
  // ---------------------------
  

  function setFooterStatus(root, text, level) {
    try {
      const el = root && root.querySelector ? root.querySelector("#asFooterStatus") : null;
      if (!el) return;
      el.textContent = text || "";
      el.classList.remove("good", "ok", "bad");
      if (level) el.classList.add(level);
    } catch (e) {}
  }

  // ---------------------------
  // Custom list rate limiting
  // ---------------------------
  // AMQ's custom list operations send a socket command per add/remove.
  // Spacing them out avoids hitting server/client rate limits.
  const AS_CUSTOM_LIST_DELAY_MS = 125;
  const AS_CUSTOM_LIST_PROGRESS_EVERY = 50;

  function asSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  

  function getAnnSongId(entry, fallbackKey) {
    // Prefer the explicit annSongId field. This avoids issues where multiple entries share the same amqSongId.
    let id = entry && (entry.annSongId ?? entry.annSongID ?? entry.ann_song_id);
    if (id === null || id === undefined) {
      // Fallback: the Extended Song List is typically keyed by annSongId
      if (typeof fallbackKey === "string" && /^\d+$/.test(fallbackKey)) id = Number(fallbackKey);
      else if (typeof fallbackKey === "number") id = fallbackKey;
    }
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }

async function applyRateLimitedSongMutations({ root, label, list, toRemove, toAdd, delayMs }) {
    const ms = Number.isFinite(Number(delayMs)) ? Number(delayMs) : AS_CUSTOM_LIST_DELAY_MS;

    let removed = 0;
    let added = 0;
    let i = 0;
    const total = (toRemove?.length || 0) + (toAdd?.length || 0);

    const progress = () => {
      if (!root) return;
      setFooterStatus(root, `${label}: ${i}/${total}… (added ${added}, removed ${removed})`, "ok");
    };

    // Removes first, then adds
    for (const id of toRemove || []) {
      list.removeSongEntry(id);
      removed += 1;
      i += 1;
      if (i % AS_CUSTOM_LIST_PROGRESS_EVERY === 0) progress();
      await asSleep(ms);
    }

    for (const id of toAdd || []) {
      const ok = list.addSongEntry(id);
      if (ok) added += 1;
      i += 1;
      if (i % AS_CUSTOM_LIST_PROGRESS_EVERY === 0) progress();
      await asSleep(ms);
    }

    if (total > 0) progress();
    return { added, removed };
  }

  function initUpdateUnplayed(root) {
    if (!root) return;
    const btn = root.querySelector("#asUpdateUnplayedBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const prevText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Updating…";
      setFooterStatus(root, "Updating 'Unplayed'…", "ok");

      try {
        const res = await syncUnplayedCustomList({ root });
        setFooterStatus(
          root,
          `Unplayed updated — added ${res.added}, removed ${res.removed}.`,
          "good"
        );
      } catch (e) {
        console.error("[AMQ Stats] Update Unplayed failed", e);
        const msg =
          (e && e.message) ||
          "Update Unplayed failed (see console). Tip: open Song Library → Custom Lists once to initialize customListHandler.";
        setFooterStatus(root, msg, "bad");
        if (window.messageDisplayer && typeof window.messageDisplayer.displayMessage === "function") {
          window.messageDisplayer.displayMessage(msg);
        }
      } finally {
        btn.disabled = false;
        btn.textContent = prevText;
      }
    });
  }


function initUpdateNeverGot(root) {
  if (!root) return;
  const btn = root.querySelector("#asUpdateNeverGotBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const prevText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Updating…";
    setFooterStatus(root, "Updating 'Never Got'…", "ok");

    try {
      const res = await syncNeverGotCustomList({ root });
      setFooterStatus(
        root,
        `Never Got updated — added ${res.added}, removed ${res.removed}.`,
        "good"
      );
    } catch (e) {
      console.error("[AMQ Stats] Update Never Got failed", e);
      const msg =
        (e && e.message) ||
        "Update Never Got failed (see console). Tip: open Song Library → Custom Lists once to initialize customListHandler.";
      setFooterStatus(root, msg, "bad");
      if (window.messageDisplayer && typeof window.messageDisplayer.displayMessage === "function") {
        window.messageDisplayer.displayMessage(msg);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = prevText;
    }
  });
}

  // ---------------------------
  // Recent Missed tracking toggle (UI)
  // ---------------------------
  const AS_RECENT_MISSED_TOGGLE_KEY = "amqStats_recentMissed_tracking";

  function isRecentMissedTrackingOn() {
    try {
      return localStorage.getItem(AS_RECENT_MISSED_TOGGLE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setRecentMissedTrackingOn(on) {
    try {
      localStorage.setItem(AS_RECENT_MISSED_TOGGLE_KEY, on ? "1" : "0");
    } catch (e) {}
  }

  function syncRecentMissedToggleButton(root) {
    try {
      const btn = root && root.querySelector ? root.querySelector("#asTrackMissedToggleBtn") : null;
      if (!btn) return;
      const on = isRecentMissedTrackingOn();
      btn.classList.toggle("as-trackOn", on);
      btn.classList.toggle("as-trackOff", !on);
      btn.textContent = on ? "Track Missed On" : "Track Missed Off";
    } catch (e) {}
  }

  function initTrackMissedToggle(root) {
    if (!root) return;
    const btn = root.querySelector("#asTrackMissedToggleBtn");
    if (!btn) return;

    // Initial state
    syncRecentMissedToggleButton(root);

    btn.addEventListener("click", () => {
      const next = !isRecentMissedTrackingOn();
      setRecentMissedTrackingOn(next);
      syncRecentMissedToggleButton(root);
      setFooterStatus(root, next ? "Recent Missed tracking enabled." : "Recent Missed tracking disabled.", "ok");
    });
  }

  // ---------------------------
  // Recent Missed tracking (game hook)
  // ---------------------------
  function getCustomListByNameCaseInsensitive(name) {
    const h = window.customListHandler;
    if (!h || !h.customListMap) return null;
    const want = String(name || "").trim().toLowerCase();
    const lists = Array.from(h.customListMap.values());
    return lists.find((l) => ((l && l.name) || "").trim().toLowerCase() === want) || null;
  }

  function getRecentMissedListOrThrow() {
    const list = getCustomListByNameCaseInsensitive("Recent Missed");
    if (!list) throw new Error('Custom list "Recent Missed" was not found.');
    if (list.onlyAnime) throw new Error('"Recent Missed" is set to Anime Only. Switch it to Anime + Songs first.');
    return list;
  }

  function isSoloQuiz(quizObj) {
    try {
      if (!quizObj || quizObj.isSpectator) return false;
      const players = Object.values(quizObj.players || {}).filter((p) => p && p._inGame);
      if (players.length !== 1) return false;
      return !!players[0].isSelf;
    } catch (e) {
      return false;
    }
  }

  function getSelfGamePlayerId(quizObj) {
    try {
      const self = Object.values(quizObj.players || {}).find((p) => p && p.isSelf);
      return self ? self.gamePlayerId : null;
    } catch (e) {
      return null;
    }
  }

  function getSelfCorrectFromResult(result, selfGamePlayerId) {
    try {
      const plist = Array.isArray(result.players)
        ? result.players
        : result.players
        ? Object.values(result.players)
        : [];
      const selfRes = plist.find((p) => p && p.gamePlayerId === selfGamePlayerId);
      return selfRes ? !!selfRes.correct : null;
    } catch (e) {
      return null;
    }
  }

  function getAnnSongIdFromResult(result) {
    const id = result && result.songInfo ? result.songInfo.annSongId : null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }

  function initRecentMissedQueue() {
    if (window.__amqStatsRecentMissedQueue) return window.__amqStatsRecentMissedQueue;
    window.__amqStatsRecentMissedQueue = {
      running: false,
      pendingAdd: new Set(),
      pendingRemove: new Set(),
    };
    return window.__amqStatsRecentMissedQueue;
  }

  function enqueueRecentMissedMutation(kind, annSongId) {
    const q = initRecentMissedQueue();
    if (kind === "add") {
      q.pendingAdd.add(annSongId);
      q.pendingRemove.delete(annSongId);
    } else {
      q.pendingRemove.add(annSongId);
      q.pendingAdd.delete(annSongId);
    }
    if (q.running) return;
    q.running = true;
    processRecentMissedQueue(q);
  }

  async function processRecentMissedQueue(q) {
    while (q.pendingAdd.size || q.pendingRemove.size) {
      // If handler/list isn't ready, stop quietly.
      let list;
      try {
        list = getRecentMissedListOrThrow();
      } catch (e) {
        // Don't spam console; user can open Song Library → Custom Lists to init.
        break;
      }

      // Removes first
      if (q.pendingRemove.size) {
        const id = q.pendingRemove.values().next().value;
        q.pendingRemove.delete(id);
        try {
          if (list.songMap && list.songMap.has(id)) list.removeSongEntry(id);
        } catch (e) {}
        await asSleep(AS_CUSTOM_LIST_DELAY_MS);
        continue;
      }

      if (q.pendingAdd.size) {
        const id = q.pendingAdd.values().next().value;
        q.pendingAdd.delete(id);
        try {
          if (list.songMap && !list.songMap.has(id)) list.addSongEntry(id);
        } catch (e) {}
        await asSleep(AS_CUSTOM_LIST_DELAY_MS);
        continue;
      }
    }

    q.running = false;
  }

  function initRecentMissedTracking() {
    if (window.__amqStatsRecentMissedHooked) return;
    window.__amqStatsRecentMissedHooked = true;

    const tryBind = () => {
      const ListenerCtor = window.Listener || (typeof Listener !== "undefined" ? Listener : null);
      const quizObj = window.quiz;
      if (!ListenerCtor || !quizObj || !quizObj.players) return false;

      try {
        const l = new ListenerCtor("answer results", (result) => {
          try {
            if (!isRecentMissedTrackingOn()) return;
            if (!isSoloQuiz(quizObj)) return;

            const annSongId = getAnnSongIdFromResult(result);
            if (annSongId === null) return;

            const selfId = getSelfGamePlayerId(quizObj);
            if (selfId === null) return;
            const correct = getSelfCorrectFromResult(result, selfId);
            if (correct === null) return;

            if (correct) enqueueRecentMissedMutation("remove", annSongId);
            else enqueueRecentMissedMutation("add", annSongId);
          } catch (e) {}
        });

        if (typeof l.bindListener === "function") l.bindListener();
        else if (typeof l.bind === "function") l.bind();
        else if (typeof l.on === "function") l.on();
        return true;
      } catch (e) {
        return false;
      }
    };

    const interval = setInterval(() => {
      if (tryBind()) clearInterval(interval);
    }, 1000);
  }

  function hasSongUpload(entry) {
    // Songs without uploads have no fileName in extendedSongList (null/undefined/empty).
    // These entries should not count toward stats or custom-list sync.
    return !!(entry && entry.fileName);
  }


  async function syncUnplayedCustomList({ root } = {}) {
    const raw = localStorage.getItem("extendedSongList");
    if (!raw) {
      throw new Error('No data found in localStorage under "extendedSongList".');
    }

    const h = window.customListHandler;
    if (!h || !h.customListMap) {
      throw new Error("customListHandler is not available yet. Open Song Library → Custom Lists once and try again.");
    }

    // Find the list named "Unplayed" (case-insensitive)
    const lists = Array.from(h.customListMap.values());
    const list = lists.find((l) => ((l && l.name) || "").trim().toLowerCase() === "unplayed");
    if (!list) {
      throw new Error('Custom list "Unplayed" was not found.');
    }
    if (list.onlyAnime) {
      throw new Error('"Unplayed" is set to Anime Only. Switch it to Anime + Songs first.');
    }

    let data;
    try {
      data = JSON.parse(raw) || {};
    } catch (e) {
      throw new Error('Failed to parse "extendedSongList" JSON.');
    }

    /**
     * Some songs have multiple annSongId entries but share the same amqSongId (same underlying audio / AMQ "song").
     * If ANY entry for an amqSongId has been played, we treat the whole group as played so "phantom unplayed"
     * duplicates don't get stuck.
     */
    const byAmq = new Map(); // amqSongId -> { played:boolean, annIds:Set<number> }
    const fallbackUnplayed = new Set(); // if amqSongId missing, fall back to per-entry check

    for (const [key, entry] of Object.entries(data)) {
      if (!entry) continue;
      if (!hasSongUpload(entry)) continue;
      if (!hasSongUpload(entry)) continue;
      if (!hasSongUpload(entry)) continue;

      const correct = Number(entry.totalCorrectCount) || 0;
      const wrong = Number(entry.totalWrongCount) || 0;
      const plays = correct + wrong;

      const annId = getAnnSongId(entry, key);
      const amqId = Number(entry.amqSongId);

      if (Number.isFinite(amqId) && amqId > 0) {
        let g = byAmq.get(amqId);
        if (!g) {
          g = { played: false, annIds: new Set() };
          byAmq.set(amqId, g);
        }
        if (annId !== null) g.annIds.add(annId);
        if (plays > 0) g.played = true;
      } else {
        // Rare: no amqSongId; use per-entry plays
        if (plays === 0 && annId !== null) fallbackUnplayed.add(annId);
      }
    }

    const unplayed = new Set(fallbackUnplayed);
    for (const g of byAmq.values()) {
      if (!g.played) {
        for (const id of g.annIds) unplayed.add(id);
      }
    }

    // Existing songs in the custom list
    const existing = new Set(Array.from(list.songMap.keys()).map((x) => Number(x)).filter(Number.isFinite));

    const toRemove = [];
    for (const id of existing) {
      if (!unplayed.has(id)) toRemove.push(id);
    }

    const toAdd = [];
    for (const id of unplayed) {
      if (!existing.has(id)) toAdd.push(id);
    }

    return await applyRateLimitedSongMutations({
      root,
      label: "Unplayed",
      list,
      toRemove,
      toAdd,
    });
  }


// ---------------------------
// Custom list sync: "Never Got"
// ---------------------------
async function syncNeverGotCustomList({ root } = {}) {
  const raw = localStorage.getItem("extendedSongList");
  if (!raw) {
    throw new Error('No data found in localStorage under "extendedSongList".');
  }

  const h = window.customListHandler;
  if (!h || !h.customListMap) {
    throw new Error("customListHandler is not available yet. Open Song Library → Custom Lists once and try again.");
  }

  // Find the list named "Never Got" (case-insensitive)
  const lists = Array.from(h.customListMap.values());
  const list = lists.find((l) => ((l && l.name) || "").trim().toLowerCase() === "never got");
  if (!list) {
    throw new Error('Custom list "Never Got" was not found.');
  }
  if (list.onlyAnime) {
    throw new Error('"Never Got" is set to Anime Only. Switch it to Anime + Songs first.');
  }

  let data;
  try {
    data = JSON.parse(raw) || {};
  } catch (e) {
    throw new Error('Failed to parse "extendedSongList" JSON.');
  }

  /**
   * Group by amqSongId for the same reason as Unplayed:
   * - "Never Got" should disappear once you've EVER gotten the AMQ song correct,
   *   even if one duplicate annSongId entry remains at 0 due to data duplication.
   */
  const byAmq = new Map(); // amqSongId -> { played:boolean, everCorrect:boolean, annIds:Set<number> }
  const fallbackNeverGot = new Set(); // if amqSongId missing, fall back to per-entry check

  for (const [key, entry] of Object.entries(data)) {
    if (!entry) continue;
      if (!hasSongUpload(entry)) continue;

    const correct = Number(entry.totalCorrectCount) || 0;
    const wrong = Number(entry.totalWrongCount) || 0;
    const plays = correct + wrong;

    const annId = getAnnSongId(entry, key);
    const amqId = Number(entry.amqSongId);

    if (Number.isFinite(amqId) && amqId > 0) {
      let g = byAmq.get(amqId);
      if (!g) {
        g = { played: false, everCorrect: false, annIds: new Set() };
        byAmq.set(amqId, g);
      }
      if (annId !== null) g.annIds.add(annId);
      if (plays > 0) g.played = true;
      if (correct > 0) g.everCorrect = true;
    } else {
      // Rare: no amqSongId; use per-entry logic
      if (plays > 0 && correct === 0 && annId !== null) fallbackNeverGot.add(annId);
    }
  }

  const neverGot = new Set(fallbackNeverGot);
  for (const g of byAmq.values()) {
    if (g.played && !g.everCorrect) {
      for (const id of g.annIds) neverGot.add(id);
    }
  }

  // Existing songs in the custom list
  const existing = new Set(Array.from(list.songMap.keys()).map((x) => Number(x)).filter(Number.isFinite));

  const toRemove = [];
  for (const id of existing) {
    if (!neverGot.has(id)) toRemove.push(id);
  }

  const toAdd = [];
  for (const id of neverGot) {
    if (!existing.has(id)) toAdd.push(id);
  }

  return await applyRateLimitedSongMutations({
    root,
    label: "Never Got",
    list,
    toRemove,
    toAdd,
  });
}


// CSV Export (Overall tab)
  // ---------------------------
  function initExport(root, stats) {
    if (!root) return;
    const btn = root.querySelector("#asExportBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      try {
        const csvText = buildStatsCsv(stats);
        const ts = new Date();
        const y = ts.getFullYear();
        const m = String(ts.getMonth() + 1).padStart(2, "0");
        const d = String(ts.getDate()).padStart(2, "0");
        const filename = `amq_stats_${y}-${m}-${d}.csv`;
        downloadTextAsFile(filename, csvText, "text/csv;charset=utf-8");
      } catch (e) {
        console.error("[AMQ Stats] export failed", e);
        setFooterStatus(root, "Export failed (see console).", "bad");
      }
    });
  }

  function downloadTextAsFile(filename, text, mime) {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const s = String(value);
    // Escape if contains comma, quote, or newline
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function buildStatsCsv(stats) {
    // Spreadsheet-friendly "long" format:
    // One header row, no blank lines, consistent columns across all datasets.
    // Percent columns are numeric (0-100), not including a % symbol.
    const now = new Date();
    const exportedAt = now.toISOString();

    const cols = [
      "ExportedAt",
      "Dataset",
      "Metric",
      "Value",
      "Anime",
      "Artist",
      "Song",
      "Type",
      "Difficulty",
      "Plays",
      "Correct",
      "AccuracyPct",
      "RecentPct",
    ];

    const lines = [];
    // UTF-8 BOM helps Excel open UTF-8 CSV correctly
    lines.push("\ufeff" + cols.join(","));

    const toFixed2 = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : "";
    };

    const pushRow = (row) => {
      const out = cols.map((k) => csvEscape(row[k] ?? ""));
      lines.push(out.join(","));
    };

    // KPI rows (Overall + Under30)
    const overall = (stats && stats.overall) || {};
    const under30 = (stats && stats.under30) || {};

    const pushKpi = (dataset, metric, value) =>
      pushRow({
        ExportedAt: exportedAt,
        Dataset: dataset,
        Metric: metric,
        Value: value,
      });

    pushKpi("Overall", "Total Entries", overall.totalEntries ?? 0);
    pushKpi("Overall", "Total Plays", overall.totalPlays ?? 0);
    pushKpi("Overall", "Correct Count", overall.correctCount ?? 0);
    pushKpi(
      "Overall",
      "AccuracyPct",
      overall.totalPlays > 0
        ? toFixed2((overall.correctCount / overall.totalPlays) * 100)
        : "0.00"
    );
    pushKpi("Overall", "Gettable", overall.gettable ?? 0);
    pushKpi("Overall", "Learned", overall.learned ?? 0);
    pushKpi("Overall", "Unlearned", overall.unlearned ?? 0);
    pushKpi("Overall", "Unplayed", overall.unplayed ?? 0);

    pushKpi("Under30", "Total Plays", under30.totalPlays ?? 0);
    pushKpi("Under30", "Correct Count", under30.correctCount ?? 0);
    pushKpi(
      "Under30",
      "AccuracyPct",
      under30.totalPlays > 0
        ? toFixed2((under30.correctCount / under30.totalPlays) * 100)
        : "0.00"
    );

    // Helper: push rows from a dataset with shared fields
    const pushRows = (dataset, rows) => {
      (rows || []).forEach((r) =>
        pushRow({
          ExportedAt: exportedAt,
          Dataset: dataset,
          Anime: r.anime ?? "",
          Artist: r.artist ?? "",
          Song: r.song ?? "",
          Type: r.type ?? "",
          Difficulty: r.difficulty ?? "",
          Plays: r.plays ?? 0,
          Correct: r.correct ?? 0,
          AccuracyPct:
            r.percentage !== undefined && r.percentage !== null
              ? toFixed2(r.percentage)
              : "",
          RecentPct:
            r.recentPercent !== undefined && r.recentPercent !== null
              ? toFixed2(r.recentPercent)
              : "",
        })
      );
    };

    pushRows("Anime Stats", (stats && stats.animeStats) || []);
    pushRows("Artist Stats", (stats && stats.artistStats) || []);
    pushRows("Song Stats", (stats && stats.songStats) || []);
    pushRows("Anime to Learn", (stats && stats.animeToLearn) || []);
    pushRows("Songs to Learn", (stats && stats.songsToLearn) || []);
    pushRows("Never Correct", (stats && stats.neverCorrect) || []);

    // Use CRLF for best compatibility
    return lines.join("\r\n");
  }

  function setActiveTab(root, tabId) {
    root
      .querySelectorAll(".as-tab[data-tab]")
      .forEach((b) => b.classList.toggle("as-active", b.dataset.tab === tabId));
    root
      .querySelectorAll(".as-section")
      .forEach((sec) => sec.classList.toggle("as-visible", sec.id === tabId));

    // Controls visibility rules:
    // - Overall: hide everything (no controls)
    // - Anime: search only (filters removed here)
    // - Other tabs: show search + filters; quick type filters only on song-ish tabs
    const controls = root.querySelector("#asControls");
    const filterAdd = root.querySelector("#asFilterAdd");
    const chips = root.querySelector("#asFilterChips");
    const quick = root.querySelector("#asQuickFilters");
    const clearBtn = root.querySelector("#asClearFilters");
    const diffRange = root.querySelector("#asDiffRange");
    const search = root.querySelector("#asSearch");

    const isOverall = tabId === "overallStats";

    // Use inner scrolling for table tabs so the scrollbar begins below the section heading.
    root.classList.toggle("as-innerScroll", !isOverall);
    if (!isOverall) ensureTableWrap(root);

    const isSearchOnly = [
      "animeStats",
      "artistStats",
      "animeToLearnStats",
    ].includes(tabId);
    const isSongish = [
      "songStats",
      "songsToLearnStats",
      "songsNeverGotStats",
    ].includes(tabId);

    if (controls) controls.style.display = isOverall ? "none" : "flex";
    if (search) search.style.display = "inline-flex";

    // Filters only make sense on song-ish tables; other tabs behave like Anime (search-only).
    const showFilters = !isOverall && !isSearchOnly;
    if (filterAdd) filterAdd.style.display = showFilters ? "flex" : "none";
    if (chips) chips.style.display = showFilters ? "flex" : "none";
    if (clearBtn) clearBtn.style.display = showFilters ? "inline-flex" : "none";

    const showDiffRange = showFilters && isSongish;
    if (diffRange) diffRange.style.display = showDiffRange ? "flex" : "none";

    if (quick) quick.style.display = showFilters && isSongish ? "flex" : "none";
    try {
      root.dispatchEvent(
        new CustomEvent("as-tab-changed", { detail: { tabId } })
      );
    } catch (e) {}

    // After switching tabs, recompute sticky offsets now that the section is visible.
    window.requestAnimationFrame(() => syncStickyOffsets(root));
  }

  function decorateAcc(root) {
    // Adds accuracy badges. Safe to call multiple times.
    if (!root) return;
    const nodes = root.querySelectorAll("td, p, li, span");
    nodes.forEach((el) => {
      if (!el || !el.textContent) return;
      if (el.querySelector && el.querySelector(".as-badge")) return; // already decorated

      const txt = el.textContent;
      const m = txt.match(/(\d+(?:\.\d+)?)%/);
      if (!m) return;

      const pct = Math.max(0, Math.min(100, parseFloat(m[1])));
      let badgeClass;
      if (el.classList && el.classList.contains("as-unplayed-pct")) {
        // For unplayed %, lower is better:
        // green under 10%, red at 50%+
        badgeClass = pct < 10 ? "good" : pct >= 50 ? "bad" : "ok";
      } else {
        badgeClass = pct >= 70 ? "good" : pct <= 29 ? "bad" : "ok";
      }
      const badgeHtml = `<span class="as-badge ${badgeClass}">${pct.toFixed(
        2
      )}%</span>`;

      // Replace only the first occurrence of the matched percent
      if (el.innerHTML && el.innerHTML.includes(m[0])) {
        el.innerHTML = el.innerHTML.replace(m[0], badgeHtml);
      }
    });
  }

  function initTableSorting(root) {
    root.querySelectorAll("table").forEach((table) => {
      const thead = table.querySelector("thead");
      const tbody = table.querySelector("tbody");
      if (!thead || !tbody) return;

      const headers = Array.from(thead.querySelectorAll("th"));
      if (!headers.length) return;

      const normText = (s) => (s ?? "").toString().trim();
      const numOrNull = (s) => {
        const t = normText(s).replace(/%/g, "").replace(/,/g, "");
        if (!t) return null;
        const n = parseFloat(t);
        return Number.isFinite(n) ? n : null;
      };

      const sortBy = (idx) => {
        const curIdx = Number.isFinite(parseInt(table.dataset.sortIdx, 10))
          ? parseInt(table.dataset.sortIdx, 10)
          : null;

        // Default: first click = DESC (more useful for numeric stats tables)
        let dir;
        if (curIdx === idx) {
          dir = table.dataset.sortDir === "desc" ? "asc" : "desc";
        } else {
          dir = "desc";
        }

        table.dataset.sortIdx = String(idx);
        table.dataset.sortDir = dir;

        // Update header indicators
        headers.forEach((h, i) => {
          h.classList.add("as-sortable");
          if (i === idx) h.dataset.sortDir = dir;
          else delete h.dataset.sortDir;
        });

        const rows = Array.from(tbody.querySelectorAll("tr"));
        const withKey = rows.map((tr, i) => ({ tr, i }));

        const strOpts = { numeric: true, sensitivity: "base" };

        withKey.sort((A, B) => {
          const aText = normText(A.tr.children[idx]?.textContent);
          const bText = normText(B.tr.children[idx]?.textContent);

          // Empty values always sink to bottom
          const aEmpty = !aText;
          const bEmpty = !bText;
          if (aEmpty && bEmpty) return A.i - B.i;
          if (aEmpty) return 1;
          if (bEmpty) return -1;

          const aNum = numOrNull(aText);
          const bNum = numOrNull(bText);
          const bothNum = aNum !== null && bNum !== null;

          let cmp = 0;
          if (bothNum) cmp = aNum - bNum;
          else cmp = aText.localeCompare(bText, undefined, strOpts);

          if (cmp === 0) return A.i - B.i;
          return dir === "asc" ? cmp : -cmp;
        });

        withKey.forEach(({ tr }) => tbody.appendChild(tr));
      };

      headers.forEach((th, idx) => {
        th.classList.add("as-sortable");
        th.title = "Click to sort (desc / asc)";
        th.addEventListener("click", () => sortBy(idx));
      });
    });
  }

  // Ensure table headers sit exactly under the sticky section heading (no jitter/gaps).

  function ensureTableWrap(root) {
    // Wrap tables so the scrollbar begins below the sticky section heading.
    root.querySelectorAll(".as-tableSection").forEach((section) => {
      // Find a direct table child (avoid wrapping nested tables).
      let table = null;
      for (const ch of Array.from(section.children)) {
        if (ch && ch.tagName === "TABLE" && ch.classList.contains("as-table")) {
          table = ch;
          break;
        }
      }
      if (!table) return;
      if (
        table.parentElement &&
        table.parentElement.classList.contains("as-tableWrap")
      )
        return;

      const wrap = document.createElement("div");
      wrap.className = "as-tableWrap";
      section.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function syncStickyOffsets(root) {
    const inner = root.classList.contains("as-innerScroll");
    const scope = root.querySelector(".as-section.as-visible") || root;

    // Table tabs: we use an inner layout. The section heading + column headers stay fixed,
    // and ONLY the tbody scrolls so the scrollbar begins under the column headers.
    scope.querySelectorAll(".as-tableSection").forEach((section) => {
      const heading = section.querySelector(".as-sectionHeading");
      if (!heading) return;

      if (inner) {
        section.style.setProperty("--as-thead-top", "0px");

        // Measure thead height so tbody can fill the remaining space (prevents clipping).
        const table = section.querySelector("table.as-table");
        if (table) {
          const thead = table.querySelector("thead");
          const h = Math.ceil(thead?.getBoundingClientRect().height || 0);
          table.style.setProperty("--as-thead-h", `${h}px`);
        }
        return;
      }

      const h = Math.ceil(heading.getBoundingClientRect().height || 0);
      section.style.setProperty("--as-thead-top", `${h}px`);
    });
  }

  function initFilteringAndDrilldown(root) {
    const state = {
      search: "",
      filters: {
        song: [],
        artist: [],
        anime: [],
        type: [],
      },
      diff: { min: 0, max: 100 },
    };

    const search = root.querySelector("#asSearch");
    const fieldSel = root.querySelector("#asFilterField");
    const input = root.querySelector("#asFilterInput");
    const addBtn = root.querySelector("#asAddFilter");
    const chips = root.querySelector("#asFilterChips");
    const clear = root.querySelector("#asClearFilters");

    const diffMin = root.querySelector("#asDiffMin");
    const diffMax = root.querySelector("#asDiffMax");
    const diffMinRange = root.querySelector("#asDiffMinRange");
    const diffMaxRange = root.querySelector("#asDiffMaxRange");
    const diffFill = root.querySelector("#asDiffFill");
    const diffDual = root.querySelector("#asDiffDual");

    const norm = (v) => String(v ?? "").trim();
    const lc = (v) => norm(v).toLowerCase();

    const clamp01 = (n) => {
      if (n === null || n === undefined) return null;
      const s = String(n).trim();
      if (s === "") return null;
      const x = Number(s);
      if (!Number.isFinite(x)) return null;
      return Math.max(0, Math.min(100, x));
    };

    // Throttled apply: coalesce rapid UI input events into a single filter pass per animation frame.
    let _applyRaf = 0;
    let _applyImpl = null;
    const scheduleApply = () => {
      if (!_applyImpl) return;
      if (_applyRaf) return;
      _applyRaf = window.requestAnimationFrame(() => {
        _applyRaf = 0;
        _applyImpl();
      });
    };

    const syncDifficultyUI = () => {
      if (!diffMin || !diffMax || !diffMinRange || !diffMaxRange) return;
      diffMin.value = String(state.diff.min);
      diffMax.value = String(state.diff.max);
      diffMinRange.value = String(state.diff.min);
      diffMaxRange.value = String(state.diff.max);

      // Keep thumbs usable when they get close
      try {
        diffMinRange.style.zIndex = Number(state.diff.min) > 50 ? "6" : "4";
        diffMaxRange.style.zIndex = "5";
      } catch (e) {}
      // Update the highlighted segment on the shared track
      if (diffFill) {
        // Use pure CSS calc() based on percentages so the fill is correct on first paint
        const inner = "(100% - (var(--as-thumbPad) * 2))";
        diffFill.style.left = `calc(var(--as-thumbPad) + (${state.diff.min} * ${inner} / 100))`;
        diffFill.style.right = `calc(var(--as-thumbPad) + (${
          100 - state.diff.max
        } * ${inner} / 100))`;
      }
    };

    const setDifficulty = (minV, maxV, source = "both", doApply = true) => {
      let mn = clamp01(minV);
      let mx = clamp01(maxV);

      if (source === "min") {
        if (mn === null) mn = state.diff.min;
        mx = state.diff.max;
        if (mn > mx) mn = mx;
      } else if (source === "max") {
        if (mx === null) mx = state.diff.max;
        mn = state.diff.min;
        if (mx < mn) mx = mn;
      } else {
        if (mn === null) mn = state.diff.min;
        if (mx === null) mx = state.diff.max;
        if (mn > mx) [mn, mx] = [mx, mn];
      }

      state.diff.min = mn;
      state.diff.max = mx;
      syncDifficultyUI();
      if (doApply) scheduleApply();
    };

    const hasFilter = (key, value) =>
      state.filters[key].some((x) => lc(x) === lc(value));

    const addFilter = (key, rawValue, doApply = true) => {
      const k = norm(key);
      if (!k || !(k in state.filters)) return;

      let v = norm(rawValue);
      if (!v) return;

      if (k === "type") v = v.toUpperCase();

      if (!hasFilter(k, v)) state.filters[k].push(v);
      if (doApply) scheduleApply();
    };

    const removeFilter = (key, value, doApply = true) => {
      const k = norm(key);
      const v = norm(value);
      if (!k || !(k in state.filters) || !v) return;
      state.filters[k] = state.filters[k].filter((x) => lc(x) !== lc(v));
      if (doApply) scheduleApply();
    };

    const clearAll = () => {
      state.search = "";
      Object.keys(state.filters).forEach((k) => (state.filters[k] = []));
      state.diff.min = 0;
      state.diff.max = 100;
      if (search) search.value = "";
      if (input) input.value = "";
      syncDifficultyUI();
      scheduleApply();
    };

    const renderChips = () => {
      if (!chips) return;
      const entries = [];
      Object.keys(state.filters).forEach((k) => {
        state.filters[k].forEach((v) => entries.push({ k, v }));
      });

      if (!entries.length) {
        chips.innerHTML = '<span class="as-muted">No filters</span>';
        return;
      }

      const niceKey = (k) =>
        k === "song"
          ? "Song"
          : k === "artist"
          ? "Artist"
          : k === "anime"
          ? "Anime"
          : k === "type"
          ? "Type"
          : k;

      chips.innerHTML = entries
        .map(({ k, v }) => {
          const show = escapeHtml(v);
          return `
            <span class="as-chip as-chip-active" data-chip-key="${escapeHtml(
              k
            )}" data-chip-value="${escapeHtml(v)}" title="Click to remove">
              ${niceKey(k)}: ${show} <span class="as-x">×</span>
            </span>
          `;
        })
        .join("");
    };

    const matchAny = (hay, filters) => {
      if (!filters || !filters.length) return true;
      const h = lc(hay);
      return filters.some((f) => h.includes(lc(f)));
    };

    const rowPasses = (tr, sectionId, q) => {
      let ok = true;

      const txt = (tr.textContent || "").toLowerCase();
      if (q && !txt.includes(q)) ok = false;

      const isSongish = [
        "songStats",
        "songsToLearnStats",
        "songsNeverGotStats",
      ].includes(sectionId);

      if (ok && isSongish) {
        const rowSong = tr.getAttribute("data-song") || "";
        const rowArtist = tr.getAttribute("data-artist") || "";
        const rowAnime = tr.getAttribute("data-anime") || "";
        const rowType = (tr.getAttribute("data-type") || "").toUpperCase();
        const rowDiff = Number(tr.getAttribute("data-difficulty"));

        if (!matchAny(rowSong, state.filters.song)) ok = false;
        if (ok && !matchAny(rowArtist, state.filters.artist)) ok = false;
        if (ok && !matchAny(rowAnime, state.filters.anime)) ok = false;

        if (ok && state.filters.type.length) {
          ok = state.filters.type.some((t) => t.toUpperCase() === rowType);
        }

        if (ok && Number.isFinite(rowDiff)) {
          if (rowDiff < state.diff.min || rowDiff > state.diff.max) ok = false;
        }
      }

      return ok;
    };

    const applyRow = (tr, sectionId, q) => {
      const pass = rowPasses(tr, sectionId, q);
      tr.style.display = pass ? "" : "none";
      return pass;
    };

    const anyActiveForSection = (sectionId, qLc) => {
      if (qLc) return true;
      const isSongish = [
        "songStats",
        "songsToLearnStats",
        "songsNeverGotStats",
      ].includes(sectionId);
      if (!isSongish) return false;
      const anyFilterChips = Object.values(state.filters).some(
        (a) => a && a.length
      );
      const anyDiff = state.diff.min !== 0 || state.diff.max !== 100;
      return anyFilterChips || anyDiff;
    };

    const setSectionCount = (sectionId, visibleCount, filtered) => {
      const section = root.querySelector(`#${sectionId}`);
      const el = section
        ? section.querySelector(".as-sectionHeading .as-count")
        : null;
      if (!el) return;
      const total =
        parseInt(el.dataset.total || String(el.textContent || "0"), 10) || 0;
      if (filtered) {
        el.textContent = String(visibleCount);
        el.title = `${visibleCount} shown (of ${total})`;
      } else {
        el.textContent = String(total);
        el.title = `${total} items`;
      }
    };

    // Track visible counts for the active tab so incremental rendering can update counts smoothly.
    const visibleBySection = {};

    const apply = () => {
      const activeId = root.querySelector(".as-section.as-visible")?.id;
      const q = lc(state.search);

      renderChips();

      if (!activeId) return;
      const rows = root.querySelectorAll(`#${activeId} table tbody tr`);
      let visible = 0;
      rows.forEach((tr) => {
        if (applyRow(tr, activeId, q)) visible += 1;
      });

      const filtered = anyActiveForSection(activeId, q);
      if (filtered) {
        visibleBySection[activeId] = visible;
      } else {
        visibleBySection[activeId] = rows.length;
      }
      setSectionCount(activeId, visibleBySection[activeId], filtered);
    };

    // Wire throttled apply to the actual apply implementation.
    _applyImpl = apply;

    // Apply current filters/search to newly-rendered rows (incremental rendering)
    root.addEventListener("as-apply-rows", (ev) => {
      const d = (ev && ev.detail) || {};
      const rows = Array.isArray(d.rows) ? d.rows : [];
      if (!rows.length) return;

      const q = lc(state.search);
      const anyFilters =
        !!q ||
        Object.values(state.filters).some((a) => a && a.length) ||
        state.diff.min !== 0 ||
        state.diff.max !== 100;

      if (!anyFilters) return;

      rows.forEach((tr) => {
        if (!tr || tr.nodeType !== 1) return;
        const sectionId = d.tabId || tr.closest?.(".as-section")?.id;
        if (!sectionId) return;
        const pass = applyRow(tr, sectionId, q);

        // Keep the section count accurate while incremental rendering adds rows.
        const activeId = root.querySelector(".as-section.as-visible")?.id;
        if (
          activeId &&
          sectionId === activeId &&
          anyActiveForSection(activeId, q)
        ) {
          if (!(activeId in visibleBySection)) visibleBySection[activeId] = 0;
          if (pass) visibleBySection[activeId] += 1;
        }
      });

      // If we're currently viewing this tab and filters are active, refresh the header count.
      const activeId2 = root.querySelector(".as-section.as-visible")?.id;
      if (
        activeId2 &&
        d.tabId === activeId2 &&
        anyActiveForSection(activeId2, q)
      ) {
        setSectionCount(activeId2, visibleBySection[activeId2] || 0, true);
      }
    });

    // Allow other UI elements (e.g., Overall tab lists) to set filters robustly
    root.addEventListener("as-set-filters", (ev) => {
      const d = (ev && ev.detail) || {};

      if ("search" in d) {
        state.search = String(d.search || "");
        if (search) search.value = state.search;
      }

      // Replace-by-default semantics for these fields
      const keys = ["song", "artist", "anime", "type"];
      keys.forEach((k) => {
        if (k in d) {
          state.filters[k] = [];
          const v = d[k];
          if (Array.isArray(v)) v.forEach((x) => addFilter(k, x, false));
          else addFilter(k, v, false);
        }
      });

      if ("diffMin" in d || "diffMax" in d || "difficulty" in d) {
        let mn = state.diff.min;
        let mx = state.diff.max;
        if ("diffMin" in d) mn = d.diffMin;
        if ("diffMax" in d) mx = d.diffMax;

        // Back-compat: allow {difficulty: 67} to pin to a single value
        if ("difficulty" in d && !("diffMin" in d) && !("diffMax" in d)) {
          const v = clamp01(String(d.difficulty).replace(/%/g, ""));
          if (v !== null) {
            mn = v;
            mx = v;
          }
        }
        setDifficulty(mn, mx, "both", false);
      }

      scheduleApply();
    });

    root.querySelectorAll(".as-tab[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveTab(root, btn.dataset.tab);
        scheduleApply();
      });
    });

    if (search) {
      const applySearch = () => {
        state.search = search.value.trim();
        scheduleApply();
      };

      const debouncedApplySearch = debounce(applySearch, 150);

      search.addEventListener("input", debouncedApplySearch);
      search.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applySearch();
        }
      });
    }

    // Difficulty slider / inputs (min/max)
    const throttledDifficultyApply = throttle(() => scheduleApply(), 80);

    if (diffMinRange) {
      diffMinRange.addEventListener("input", () => {
        setDifficulty(diffMinRange.value, null, "min", false);
        throttledDifficultyApply();
      });

      // Ensure we apply immediately once the user finishes dragging
      diffMinRange.addEventListener("change", () => {
        setDifficulty(diffMinRange.value, null, "min", true);
      });
    }

    if (diffMaxRange) {
      diffMaxRange.addEventListener("input", () => {
        setDifficulty(null, diffMaxRange.value, "max", false);
        throttledDifficultyApply();
      });

      // Ensure we apply immediately once the user finishes dragging
      diffMaxRange.addEventListener("change", () => {
        setDifficulty(null, diffMaxRange.value, "max", true);
      });
    }

    const sanitizeDigits = (el) => {
      if (!el) return "";
      const raw = String(el.value ?? "");
      const cleaned = raw.replace(/[^0-9]/g, "");
      if (cleaned !== raw) el.value = cleaned;
      return cleaned;
    };

    const handleDifficultyTextInput = (which) => {
      const el = which === "min" ? diffMin : diffMax;
      if (!el) return;
      const s = sanitizeDigits(el);
      if (s === "") return; // allow clearing while typing

      const v = clamp01(s);
      if (v === null) return;

      // Don't force-clamp until commit (blur/Enter); wait until value is valid vs the other bound.
      if (which === "min" && v > state.diff.max) return;
      if (which === "max" && v < state.diff.min) return;

      setDifficulty(
        which === "min" ? v : null,
        which === "max" ? v : null,
        which,
        true
      );
    };

    const commitDifficultyText = (which) => {
      if (which === "min")
        setDifficulty(diffMin ? diffMin.value : null, null, "min");
      else setDifficulty(null, diffMax ? diffMax.value : null, "max");
    };

    if (diffMin) {
      diffMin.addEventListener("input", () => handleDifficultyTextInput("min"));
      diffMin.addEventListener("blur", () => commitDifficultyText("min"));
      diffMin.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitDifficultyText("min");
          diffMin.blur();
        }
      });
    }
    if (diffMax) {
      diffMax.addEventListener("input", () => handleDifficultyTextInput("max"));
      diffMax.addEventListener("blur", () => commitDifficultyText("max"));
      diffMax.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitDifficultyText("max");
          diffMax.blur();
        }
      });
    }

    const doAddFromInput = () => {
      if (!fieldSel || !input) return;
      const k = fieldSel.value;
      const v = input.value;
      addFilter(k, v);
      input.value = "";
      input.focus();
    };

    if (addBtn) addBtn.addEventListener("click", doAddFromInput);
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          doAddFromInput();
        }
      });
    }

    if (clear) clear.addEventListener("click", clearAll);

    // Click-to-add filters (table cells, quick filters) + click-to-remove chips
    root.addEventListener("click", (e) => {
      const t = e.target;

      const chip = t.closest?.("[data-chip-key][data-chip-value]");
      if (chip && root.contains(chip)) {
        removeFilter(chip.dataset.chipKey, chip.dataset.chipValue);
        return;
      }

      const qf = t.closest?.("[data-qf-key][data-qf-value]");
      if (qf && root.contains(qf)) {
        addFilter(qf.dataset.qfKey, qf.dataset.qfValue);
        return;
      }

      const f = t.closest?.("[data-filter-key][data-filter-value]");
      if (f && root.contains(f)) {
        if (f.dataset.filterKey === "difficulty") {
          const v = clamp01(String(f.dataset.filterValue).replace(/%/g, ""));
          if (v !== null) setDifficulty(v, v);
        } else {
          addFilter(f.dataset.filterKey, f.dataset.filterValue);
        }
      }
    });

    // Drilldown (delegated): works with incrementally-rendered rows too
    root.addEventListener("click", (e) => {
      const el = e.target.closest?.("[data-drill-anime],[data-drill-artist]");
      if (!el || !root.contains(el)) return;

      if (el.hasAttribute("data-drill-anime")) {
        addFilter("anime", el.getAttribute("data-drill-anime") || "");
        setActiveTab(root, "songStats");
        scheduleApply();
      } else if (el.hasAttribute("data-drill-artist")) {
        addFilter("artist", el.getAttribute("data-drill-artist") || "");
        setActiveTab(root, "songStats");
        scheduleApply();
      }
    });

    setActiveTab(root, "overallStats");

    syncDifficultyUI();
    scheduleApply();
  }
  // ---------------------------
  // AMQ-native Lobby button logic
  // ---------------------------

  const BTN_ID = "amqStatsLobbyButton";

  function openStatsModal() {
    const stats = calculateStats();
    if (stats) showModal(stats);
  }

  function removeLobbyStatsButton() {
    $("#" + BTN_ID).remove();
  }

  function addLobbyStatsButton() {
    const $topBar = $("#lobbyPage .topMenuBar");
    if (!$topBar.length) return;
    if ($("#" + BTN_ID).length) return;

    injectStatsButtonCSS();

    const $btn = $(`
        <div id="${BTN_ID}" class="clickAble topMenuButton topMenuMediumButton">
            <h3>Stats</h3>
        </div>
    `);

    $btn.css("margin-left", "250px");

    const $start = $topBar
      .find(
        '#startButton, .startButton, [id*="startButton"], .topMenuStartButton'
      )
      .first();
    if ($start.length) $btn.insertBefore($start);
    else $topBar.append($btn);

    $btn.on("click", openStatsModal);
  }

  function hookLobbyLifecycle() {
    if (window.__amqStatsDisplayLobbyHooked) return;
    if (!window.lobby) return; // not ready yet

    window.__amqStatsDisplayLobbyHooked = true;

    // Hook into lobby setup (runs when lobby screen is built/shown)
    const originalSetupLobby = lobby.setupLobby;
    lobby.setupLobby = function (...args) {
      const res = originalSetupLobby && originalSetupLobby.apply(this, args);
      try {
        addLobbyStatsButton();
      } catch (e) {}
      return res;
    };

    // Hook into leaving lobby (cleanup)
    const originalLeaveLobby = lobby.leave;
    lobby.leave = function (...args) {
      try {
        removeLobbyStatsButton();
      } catch (e) {}
      return originalLeaveLobby && originalLeaveLobby.apply(this, args);
    };

    // Also attempt immediate add in case we're already in lobby
    try {
      addLobbyStatsButton();
    } catch (e) {}
  }

  // ---------------------------
  // Boot / keepalive
  // ---------------------------

  function boot() {
    initDailyAccuracyTracking();
    initRecentMissedTracking();
    hookLobbyLifecycle();
    // If lobby already exists but setupLobby hasn’t fired yet, try add
    try {
      addLobbyStatsButton();
    } catch (e) {}
  }

  // SPA-safe: keep trying until lobby exists, then hooks take over.
  const observer = new MutationObserver(() => boot());
  observer.observe(document.body, { childList: true, subtree: true });

  // initial
  boot();
})();
