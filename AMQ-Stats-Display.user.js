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
            #statsModal .as-actions .as-action{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;padding:6px 10px;border-radius:10px;cursor:pointer;font-size:13px;}
            #statsModal .as-actions .as-action:hover{background:rgba(255,255,255,.09);}

            #statsModal .as-badge{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:999px;font-size:12px;border:1px solid rgba(var(--ink),.18);background:rgba(255,255,255,.06);white-space:nowrap;font-variant-numeric:tabular-nums;}
            #statsModal .as-badge.good{background:rgba(var(--good),.18);border-color:rgba(var(--good),.40);}
            #statsModal .as-badge.ok{background:rgba(var(--ok),.18);border-color:rgba(var(--ok),.40);}
            #statsModal .as-badge.bad{background:rgba(var(--bad),.18);border-color:rgba(var(--bad),.40);}
/* Compact density (default) */
            #statsModal table{font-size:12px;}
            #statsModal tbody td{padding:4px 6px !important;}
            #statsModal thead th{padding:6px 8px !important;}
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

`;
    document.head.appendChild(style);
  }

  function calculateStats() {
    const rawData = localStorage.getItem("extendedSongList");
    if (!rawData) {
      alert(
        'No data found in localStorage under "extendedSongList". Please ensure it is available.'
      );
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
        if (!songData[song]) {
          songData[song] = {
            plays: 0,
            correct: 0,
            artist: entry.artist,
            difficulty: entry.globalPercent,
            anime: entry.anime,
            type: type,
            recentPercent: entry.recentPercent,
          };
        }
        songData[song].plays += plays;
        songData[song].correct += correct;

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
    for (const song in songData) {
      const { plays, correct, artist, difficulty, anime, type, recentPercent } =
        songData[song];
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
      return `
        <div class="as-card">
          <h4>${label}</h4>
          <div class="as-row"><span class="as-muted">Entries</span><span>${
            t.total || 0
          }</span></div>
          <div class="as-row"><span class="as-muted">Plays</span><span>${
            t.plays || 0
          }</span></div>
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
    const uLearn = safePct(under30.learned, under30.totalEntries);

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
                <div class="as-kpi"><b>Unplayed</b><span>${unplayedPct.toFixed(
                  2
                )}%</span></div>
              </div>

              <div class="as-actions">
                <button class="as-action" type="button" data-goto-tab="songStats">Browse songs</button>
                <button class="as-action" type="button" data-goto-tab="songsToLearnStats">Songs to learn</button>
                <button class="as-action" type="button" data-goto-tab="songsNeverGotStats">Never got</button>
                <button class="as-action" type="button" data-goto-tab="animeToLearnStats">Anime to learn</button>
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
                  <div class="as-row"><span class="as-muted">Learned</span><span>${
                    under30.learned
                  } / ${under30.totalEntries} ${uLearn.toFixed(2)}%</span></div>
                
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
            </div>
        `;
  }

  function formatAnimeStats(stats) {
    return `
            <div id="animeStats" style="height: 100%; overflow-y: auto; position: relative;">
                <h3 style="position: sticky; top: 0; background-color: #333; margin: 0; padding: 10px 20px; color: #FFFFFF; text-align: center; z-index: 10; border-bottom: 2px solid #FFFFFF;">
                    Anime Stats
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; text-align: left;">
                    <thead style="position: sticky; top: 47px; background-color: #444; z-index: 5;">
                        <tr>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 30%;">Name</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 20%;">Plays</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 20%;">Correct Count</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 30%;">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.animeStats
                          .map(
                            (anime) => `
                            <tr>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span data-drill-anime="${
                                  anime.anime
                                }">${anime.anime}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  anime.plays
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  anime.correct
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.percentage.toFixed(
                                  2
                                )}%</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
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

  function formatArtistStats(stats) {
    return `
            <div id="artistStats" style="height: 100%; overflow-y: auto; position: relative;">
                <h3 style="position: sticky; top: 0; background-color: #333; margin: 0; padding: 10px 20px; color: #FFFFFF; text-align: center; z-index: 10; border-bottom: 2px solid #FFFFFF;">
                    Artist Stats
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; text-align: left;">
                    <thead style="position: sticky; top: 47px; background-color: #444; z-index: 5;">
                        <tr>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 30%;">Name</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 20%;">Plays</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 20%;">Correct Count</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 30%;">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.artistStats
                          .map(
                            (artist) => `
                            <tr>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span data-drill-artist="${
                                  artist.artist
                                }">${artist.artist}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  artist.plays
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  artist.correct
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${formatPercent(
                                  artist.percentage
                                )}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
  }

  function formatSongStats(stats) {
    return `
            <div id="songStats" style="height: 100%; overflow-y: auto; position: relative;">
                <h3 style="position: sticky; top: 0; background-color: #333; margin: 0; padding: 10px 20px; color: #FFFFFF; text-align: center; z-index: 10; border-bottom: 2px solid #FFFFFF;">
                    Song Stats
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; text-align: left;">
                    <thead style="position: sticky; top: 47px; background-color: #444; z-index: 5;">
                        <tr>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Song</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Artist</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Difficulty</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Anime</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Type</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Plays</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Correct Count</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Percentage</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Recent Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.songStats
                          .map(
                            (song) => `
                            <tr data-type="${song.type}" data-plays="${
                              song.plays
                            }" data-artist="${escapeHtml(
                              song.artist || ""
                            )}" data-anime="${escapeHtml(
                              song.anime || ""
                            )}" data-song="${escapeHtml(
                              song.song
                            )}" data-difficulty="${song.difficulty}">
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="song" data-filter-value="${escapeHtml(
                                  song.song
                                )}">${escapeHtml(song.song)}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="artist" data-filter-value="${escapeHtml(
                                  song.artist || ""
                                )}">${escapeHtml(song.artist || "")}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="difficulty" data-filter-value="${
                                  song.difficulty
                                }">${formatPercent(song.difficulty)}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="anime" data-filter-value="${escapeHtml(
                                  song.anime || ""
                                )}">${escapeHtml(song.anime || "")}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="type" data-filter-value="${
                                  song.type
                                }">${song.type}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.plays
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.correct
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${formatPercent(
                                  song.percentage
                                )}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${formatPercent(
                                  song.recentPercent
                                )}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
  }

  function formatAnimeToLearnStats(stats) {
    return `
            <div id="animeToLearnStats" style="height: 100%; overflow-y: auto; position: relative;">
                <h3 style="position: sticky; top: 0; background-color: #333; margin: 0; padding: 10px 20px; color: #FFFFFF; text-align: center; z-index: 10; border-bottom: 2px solid #FFFFFF;">
                    Anime to Learn
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; text-align: left;">
                    <thead style="position: sticky; top: 47px; background-color: #444; z-index: 5;">
                        <tr>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 40%">Name</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 20%">Plays</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 20%">Correct Count</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 20%">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.animeToLearn
                          .map(
                            (anime) => `
                            <tr>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span data-drill-anime="${
                                  anime.anime
                                }">${anime.anime}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  anime.plays
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  anime.correct
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.percentage.toFixed(
                                  2
                                )}%</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
  }

  function formatSongsToLearnStats(stats) {
    return `
            <div id="songsToLearnStats" style="height: 100%; overflow-y: auto; position: relative;">
                <h3 style="position: sticky; top: 0; background-color: #333; margin: 0; padding: 10px 20px; color: #FFFFFF; text-align: center; z-index: 10; border-bottom: 2px solid #FFFFFF;">
                    Songs to Learn
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; text-align: left;">
                    <thead style="position: sticky; top: 47px; background-color: #444; z-index: 5;">
                        <tr>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Song</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Artist</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Difficulty</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Anime</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Type</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Plays</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Correct Count</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Percentage</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap;">Recent Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.songsToLearn
                          .map(
                            (song) => `
                            <tr data-type="${song.type}" data-plays="${
                              song.plays
                            }" data-artist="${escapeHtml(
                              song.artist || ""
                            )}" data-anime="${escapeHtml(
                              song.anime || ""
                            )}" data-song="${escapeHtml(
                              song.song
                            )}" data-difficulty="${song.difficulty}">
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="song" data-filter-value="${escapeHtml(
                                  song.song
                                )}">${escapeHtml(song.song)}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="artist" data-filter-value="${escapeHtml(
                                  song.artist || ""
                                )}">${escapeHtml(song.artist || "")}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="difficulty" data-filter-value="${
                                  song.difficulty
                                }">${formatPercent(song.difficulty)}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="anime" data-filter-value="${escapeHtml(
                                  song.anime || ""
                                )}">${escapeHtml(song.anime || "")}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="type" data-filter-value="${
                                  song.type
                                }">${song.type}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.plays
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.correct
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${formatPercent(
                                  song.percentage
                                )}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${formatPercent(
                                  song.recentPercent
                                )}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
  }

  function formatSongsNeverGotStats(stats) {
    return `
            <div id="songsNeverGotStats" style="height: 100%; overflow-y: auto; position: relative;">
                <h3 style="position: sticky; top: 0; background-color: #333; margin: 0; padding: 10px 20px; color: #FFFFFF; text-align: center; z-index: 10; border-bottom: 2px solid #FFFFFF;">
                    Songs Never Got
                </h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; text-align: left;">
                    <thead style="position: sticky; top: 47px; background-color: #444; z-index: 5;">
                        <tr>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 20%;">Song</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 20%;">Artist</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 15%;">Difficulty</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 25%;">Anime</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 10%;">Type</th>
                            <th style="border: 1px solid #FFFFFF; padding: 8px; width: 10%;">Plays</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.songsNeverGot
                          .map(
                            (song) => `
                            <tr data-type="${song.type}" data-plays="${
                              song.plays
                            }" data-artist="${escapeHtml(
                              song.artist || ""
                            )}" data-anime="${escapeHtml(
                              song.anime || ""
                            )}" data-song="${escapeHtml(
                              song.song
                            )}" data-difficulty="${song.difficulty}">
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="song" data-filter-value="${escapeHtml(
                                  song.song
                                )}">${escapeHtml(song.song)}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="artist" data-filter-value="${escapeHtml(
                                  song.artist || ""
                                )}">${escapeHtml(song.artist || "")}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="difficulty" data-filter-value="${
                                  song.difficulty
                                }">${formatPercent(song.difficulty)}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="anime" data-filter-value="${escapeHtml(
                                  song.anime || ""
                                )}">${escapeHtml(song.anime || "")}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;"><span class="as-filterable" data-filter-key="type" data-filter-value="${
                                  song.type
                                }">${song.type}</span></td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.plays
                                }</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
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

            #statsModal .as-dualSlider{position:relative;width:170px;height:18px;display:inline-flex;align-items:center;margin:0 4px;;--as-thumb:14px;--as-thumbPad:10px\}
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
            #statsModal .as-body{flex:1;overflow:auto;padding:0;}
            #statsModal .as-section{display:none !important;height:100%;}
            #statsModal .as-section.as-visible{display:block !important;}
            #statsModal table{width:100%;border-collapse:collapse;font-size:13px;}
            #statsModal thead th{position:sticky;top:0;background:rgba(50,50,50,.98);z-index:2;border-bottom:1px solid rgba(255,255,255,.15);padding:8px;text-align:left;cursor:pointer;user-select:none;white-space:nowrap;}
            #statsModal thead th.as-sortable{padding-right:22px;}
            #statsModal thead th.as-sortable::after{content:"";position:absolute;right:8px;top:50%;transform:translateY(-50%);opacity:.55;font-size:11px;}
            #statsModal thead th.as-sortable[data-sort-dir="asc"]::after{content:"▲";}
            #statsModal thead th.as-sortable[data-sort-dir="desc"]::after{content:"▼";}

            #statsModal tbody td{border-bottom:1px solid rgba(255,255,255,.08);padding:8px;vertical-align:top;}
            #statsModal tbody tr:hover{background:rgba(255,255,255,.04);}
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

    root.querySelector("#overallStats").classList.add("as-visible");

    root
      .querySelector('[data-action="close"]')
      .addEventListener("click", () => root.remove());
    root.querySelector(".as-overlay").addEventListener("click", (e) => {
      if (e.target.classList.contains("as-overlay")) root.remove();
    });

    document.addEventListener("keydown", function escListener(e) {
      if (e.key === "Escape" && document.getElementById("statsModal")) {
        document.getElementById("statsModal").remove();
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
      if (tabBtn) tabBtn.click(); // triggers filtering apply()
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

    initTableSorting(root);
    renderDailyAccuracyChart(root);
    initFilteringAndDrilldown(root);
    decorateAcc(root);
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
    const isAnime = tabId === "animeStats";
    const isSongish = [
      "songStats",
      "songsToLearnStats",
      "songsNeverGotStats",
    ].includes(tabId);

    if (controls) controls.style.display = isOverall ? "none" : "flex";
    if (search) search.style.display = "inline-flex";

    const showFilters = !isOverall && !isAnime;
    if (filterAdd) filterAdd.style.display = showFilters ? "flex" : "none";
    if (chips) chips.style.display = showFilters ? "flex" : "none";
    if (clearBtn) clearBtn.style.display = showFilters ? "inline-flex" : "none";
    if (diffRange) diffRange.style.display = showFilters ? "flex" : "none";

    if (quick) quick.style.display = showFilters && isSongish ? "flex" : "none";
  }
  function decorateAcc(root) {
    // Adds accuracy badges. Safe to call multiple times.
    const nodes = root.querySelectorAll(
      "#statsModal td, #statsModal p, #statsModal li, #statsModal span"
    );
    nodes.forEach((el) => {
      if (!el || !el.textContent) return;
      if (el.querySelector && el.querySelector(".as-badge")) return; // already decorated

      const txt = el.textContent;
      const m = txt.match(/(\d+(?:\.\d+)?)%/);
      if (!m) return;

      const pct = Math.max(0, Math.min(100, parseFloat(m[1])));
      const badgeClass = pct >= 70 ? "good" : pct <= 29 ? "bad" : "ok";
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
      if (diffFill && diffDual) {
        // Firefox and Chromium lay out range thumbs slightly differently. To keep the highlight
        // from ever peeking past the visible thumbs (especially at 0/100), we draw the fill
        // inside an inner "usable" track that is inset from the edges by a thumb padding.
        const cs = getComputedStyle(diffDual);
        const thumbPx = parseFloat(cs.getPropertyValue("--as-thumb")) || 14;
        const padPx =
          parseFloat(cs.getPropertyValue("--as-thumbPad")) || thumbPx / 2;

        const W = diffDual.clientWidth || 0;
        const innerW = Math.max(0, W - 2 * padPx);

        const minPos = padPx + (state.diff.min / 100) * innerW;
        const maxPos = padPx + (state.diff.max / 100) * innerW;

        const left = Math.max(
          padPx,
          Math.min(W - padPx, Math.min(minPos, maxPos))
        );
        const rightPos = Math.max(
          padPx,
          Math.min(W - padPx, Math.max(minPos, maxPos))
        );

        diffFill.style.left = `${left}px`;
        diffFill.style.right = `${Math.max(0, W - rightPos)}px`;
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
      if (doApply) apply();
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
      if (doApply) apply();
    };

    const removeFilter = (key, value, doApply = true) => {
      const k = norm(key);
      const v = norm(value);
      if (!k || !(k in state.filters) || !v) return;
      state.filters[k] = state.filters[k].filter((x) => lc(x) !== lc(v));
      if (doApply) apply();
    };

    const clearAll = () => {
      state.search = "";
      Object.keys(state.filters).forEach((k) => (state.filters[k] = []));
      state.diff.min = 0;
      state.diff.max = 100;
      if (search) search.value = "";
      if (input) input.value = "";
      syncDifficultyUI();
      apply();
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

    const apply = () => {
      const activeId = root.querySelector(".as-section.as-visible")?.id;
      const q = lc(state.search);

      renderChips();

      root.querySelectorAll(".as-section table tbody tr").forEach((tr) => {
        const section = tr.closest(".as-section");
        if (!section || section.id !== activeId) return;

        let ok = true;

        const txt = (tr.textContent || "").toLowerCase();
        if (q && !txt.includes(q)) ok = false;

        const isSongish = [
          "songStats",
          "songsToLearnStats",
          "songsNeverGotStats",
        ].includes(activeId);

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
            if (rowDiff < state.diff.min || rowDiff > state.diff.max)
              ok = false;
          }
        }

        tr.style.display = ok ? "" : "none";
      });
    };

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

      apply();
    });

    root.querySelectorAll(".as-tab[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveTab(root, btn.dataset.tab);
        apply();
      });
    });

    if (search) {
      search.addEventListener("input", () => {
        state.search = search.value.trim();
        apply();
      });
    }

    // Difficulty slider / inputs (min/max)
    if (diffMinRange) {
      diffMinRange.addEventListener("input", () => {
        setDifficulty(diffMinRange.value, null, "min");
      });
    }
    if (diffMaxRange) {
      diffMaxRange.addEventListener("input", () => {
        setDifficulty(null, diffMaxRange.value, "max");
      });
    }
    if (diffMin) {
      diffMin.addEventListener("input", () => {
        setDifficulty(diffMin.value, null, "min");
      });
    }
    if (diffMax) {
      diffMax.addEventListener("input", () => {
        setDifficulty(null, diffMax.value, "max");
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

    // Drilldown from Overall tab elements
    root.querySelectorAll("[data-drill-anime]").forEach((el) => {
      el.classList.add("as-clickable");
      el.addEventListener("click", () => {
        addFilter("anime", el.getAttribute("data-drill-anime") || "");
        setActiveTab(root, "songStats");
        apply();
      });
    });

    root.querySelectorAll("[data-drill-artist]").forEach((el) => {
      el.classList.add("as-clickable");
      el.addEventListener("click", () => {
        addFilter("artist", el.getAttribute("data-drill-artist") || "");
        setActiveTab(root, "songStats");
        apply();
      });
    });

    setActiveTab(root, "overallStats");
    syncDifficultyUI();
    apply();
  }
  // ---------------------------
  // AMQ-native Lobby button logic
  // (modeled after training mode scripts)
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
