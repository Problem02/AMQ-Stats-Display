// ==UserScript==
// @name         AMQ Stats Display
// @namespace    https://animemusicquiz.com/
// @version      1.1
// @description  Display stats (Lobby-only button, AMQ-native placement)
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
          )}" data-goto-anime="${escapeHtml(
            s.anime || ""
          )}" data-goto-type="${escapeHtml(s.type || "")}">${escapeHtml(
        s.song
      )}</span>
          <span class="as-muted"> — ${escapeHtml(s.artist)}</span>
        </span>
        <span class="as-muted">plays: ${s.plays} · ${(s.percentage || 0).toFixed(
      2
    )}%</span>
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
                            <tr data-type="${song.type}" data-song="${escapeHtml(
                              song.song
                            )}" data-plays="${song.plays}" data-artist="${escapeHtml(
        song.artist || ""
      )}" data-anime="${escapeHtml(song.anime || "")}" data-difficulty="${
        song.difficulty ?? ""
      }" data-recent="${song.recentPercent ?? ""}">
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.song
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.artist || ""
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${formatPercent(
                                  song.difficulty
                                )}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.anime || ""
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.type
                                }</td>
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
                            <tr data-type="${song.type}" data-song="${escapeHtml(
                              song.song
                            )}" data-plays="${song.plays}" data-artist="${escapeHtml(
        song.artist || ""
      )}" data-anime="${escapeHtml(song.anime || "")}" data-difficulty="${
        song.difficulty ?? ""
      }" data-recent="${song.recentPercent ?? ""}">
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.song
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.artist || ""
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${formatPercent(
                                  song.difficulty
                                )}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.anime || ""
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.type
                                }</td>
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
                            <tr data-type="${song.type}" data-song="${escapeHtml(
                              song.song
                            )}" data-plays="${song.plays}" data-artist="${escapeHtml(
        song.artist || ""
      )}" data-anime="${escapeHtml(song.anime || "")}" data-difficulty="${
        song.difficulty ?? ""
      }" data-recent="${song.recentPercent ?? ""}">
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.song
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.artist || ""
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${formatPercent(
                                  song.difficulty
                                )}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.anime || ""
                                }</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${
                                  song.type
                                }</td>
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
            #statsModal .as-controls input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:8px;padding:6px 10px;font-size:13px;min-width:240px;}
            #statsModal .as-controls label{display:flex;gap:6px;align-items:center;font-size:13px;opacity:.95;}
            #statsModal .as-controls .as-pill{padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);font-size:12px;}
            #statsModal .as-controls .as-range-row{display:flex;gap:10px;flex-wrap:wrap;width:100%;}
            #statsModal .as-controls .as-range-field{display:flex;gap:6px;align-items:center;font-size:13px;opacity:.95;}
            #statsModal .as-controls input.as-compact{min-width:120px;width:120px;}
            #statsModal .as-chip-groups{display:flex;gap:10px;flex-wrap:wrap;width:100%;}
            #statsModal .as-chip-column{flex:1 1 220px;min-width:200px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:8px;}
            #statsModal .as-chip-column h5{margin:0 0 6px;font-size:12px;opacity:.85;text-transform:uppercase;letter-spacing:.5px;}
            #statsModal .as-chips{display:flex;gap:6px;flex-wrap:wrap;}
            #statsModal .as-chip{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;cursor:pointer;transition:background .12s,border-color .12s;}
            #statsModal .as-chip:hover{background:rgba(255,255,255,.09);}
            #statsModal .as-chip.as-chip-active{background:rgba(0,123,255,.35);border-color:rgba(0,123,255,.7);}
            #statsModal .as-controls .as-filters-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;width:100%;}
            #statsModal .as-body{flex:1;overflow:auto;padding:0;}
            #statsModal .as-section{display:none !important;height:100%;}
            #statsModal .as-section.as-visible{display:block !important;}
            #statsModal table{width:100%;border-collapse:collapse;font-size:13px;}
            #statsModal thead th{position:sticky;top:0;background:rgba(50,50,50,.98);z-index:2;border-bottom:1px solid rgba(255,255,255,.15);padding:8px;text-align:left;cursor:pointer;user-select:none;white-space:nowrap;}
            #statsModal tbody td{border-bottom:1px solid rgba(255,255,255,.08);padding:8px;vertical-align:top;}
            #statsModal tbody tr:hover{background:rgba(255,255,255,.04);}
            #statsModal .as-clickable{color:#9ad1ff;cursor:pointer;text-decoration:underline;text-underline-offset:2px;}
            #statsModal .as-muted{opacity:.75;}
        `;
    document.head.appendChild(style);
  }

  function showModal(stats) {
    ensureStyles();

    const existing = document.getElementById("statsModal");
    if (existing) existing.remove();

    const uniqueSorted = (arr, limit = 100) =>
      Array.from(new Set(arr.filter(Boolean)))
        .sort((a, b) => String(a).localeCompare(String(b)))
        .slice(0, limit);
    const filterLists = {
      types,
      songs: uniqueSorted(stats.songStats.map((s) => s.song), 120),
      artists: uniqueSorted(stats.artistStats.map((a) => a.artist), 120),
      anime: uniqueSorted(stats.animeStats.map((a) => a.anime), 120),
    };

    const renderChips = (field, values) =>
      values
        .map(
          (val) => `
          <button type="button" class="as-chip" data-filter-field="${field}" data-filter-value="${escapeHtml(
            val
          )}">${escapeHtml(val)}</button>
        `
        )
        .join("");

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
                <div class="as-filters-top">
                  <input id="asSearch" type="text" placeholder="Search (anime / artist / song)..." />
                  <span class="as-pill" id="asFilterPill">No filters</span>
                  <button class="as-tab" id="asClearFilters" type="button">Clear</button>
                </div>
                <div class="as-range-row">
                  <label class="as-range-field">Difficulty
                    <input id="asDifficultyMin" class="as-compact" type="number" min="0" max="100" placeholder="Min %" />
                    <span>–</span>
                    <input id="asDifficultyMax" class="as-compact" type="number" min="0" max="100" placeholder="Max %" />
                  </label>
                  <label class="as-range-field">Recent
                    <input id="asRecentMin" class="as-compact" type="number" min="0" max="100" placeholder="Min %" />
                    <span>–</span>
                    <input id="asRecentMax" class="as-compact" type="number" min="0" max="100" placeholder="Max %" />
                  </label>
                </div>
                <div class="as-chip-groups" id="asFilterGroups">
                  <div class="as-chip-column">
                    <h5>Type</h5>
                    <div class="as-chips">${renderChips(
                      "type",
                      filterLists.types
                    )}</div>
                  </div>
                  <div class="as-chip-column">
                    <h5>Song</h5>
                    <div class="as-chips">${renderChips(
                      "song",
                      filterLists.songs
                    )}</div>
                  </div>
                  <div class="as-chip-column">
                    <h5>Artist</h5>
                    <div class="as-chips">${renderChips(
                      "artist",
                      filterLists.artists
                    )}</div>
                  </div>
                  <div class="as-chip-column">
                    <h5>Anime</h5>
                    <div class="as-chips">${renderChips(
                      "anime",
                      filterLists.anime
                    )}</div>
                  </div>
                </div>
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
      const detail = {};
      if ("gotoSong" in t.dataset) detail.song = t.dataset.gotoSong || "";
      if ("gotoArtist" in t.dataset) detail.artist = t.dataset.gotoArtist || "";
      if ("gotoAnime" in t.dataset) detail.anime = t.dataset.gotoAnime || "";
      if ("gotoType" in t.dataset) detail.type = t.dataset.gotoType || "";
      if ("gotoSearch" in t.dataset) detail.search = t.dataset.gotoSearch || "";

      root.dispatchEvent(new CustomEvent("as-set-filters", { detail }));
    });

    document.body.appendChild(root);

    initTableSorting(root);
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

    // Hide the search/filter bar on the Overall tab to reduce clutter
    const controls = root.querySelector("#asControls");
    if (controls)
      controls.style.display = tabId === "overallStats" ? "none" : "flex";
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

      thead.querySelectorAll("th").forEach((th, idx) => {
        th.title = "Click to sort";
        let asc = false;
        th.addEventListener("click", () => {
          const rows = Array.from(tbody.querySelectorAll("tr"));
          asc = !asc;
          rows.sort((a, b) => {
            const av = (a.children[idx]?.textContent || "").trim();
            const bv = (b.children[idx]?.textContent || "").trim();
            const an = parseFloat(av.replace("%", ""));
            const bn = parseFloat(bv.replace("%", ""));
            const bothNum = Number.isFinite(an) && Number.isFinite(bn);
            if (bothNum) return asc ? an - bn : bn - an;
            return asc ? av.localeCompare(bv) : bv.localeCompare(av);
          });
          rows.forEach((r) => tbody.appendChild(r));
        });
      });
    });
  }

  function initFilteringAndDrilldown(root) {
    const state = {
      search: "",
      type: "",
      anime: "",
      artist: "",
      song: "",
      difficultyMin: "",
      difficultyMax: "",
      recentMin: "",
      recentMax: "",
    };

    const pill = root.querySelector("#asFilterPill");
    const search = root.querySelector("#asSearch");
    const clear = root.querySelector("#asClearFilters");
    const difficultyMin = root.querySelector("#asDifficultyMin");
    const difficultyMax = root.querySelector("#asDifficultyMax");
    const recentMin = root.querySelector("#asRecentMin");
    const recentMax = root.querySelector("#asRecentMax");
    const chipGroups = root.querySelector("#asFilterGroups");

    const syncChips = () => {
      root.querySelectorAll(".as-chip").forEach((chip) => {
        const field = chip.getAttribute("data-filter-field");
        const value = (chip.getAttribute("data-filter-value") || "").toLowerCase();
        if (!field) return;
        const isActive = (state[field] || "").toLowerCase() === value;
        chip.classList.toggle("as-chip-active", isActive);
      });
    };

    const applyAndSync = () => {
      apply();
      syncChips();
    };

    const setChipState = (field, value, { toggle = false, applyNow = true } = {}) => {
      const normalizedValue = (value || "").toLowerCase();
      const normalizedCurrent = (state[field] || "").toLowerCase();
      const nextValue = toggle && normalizedCurrent === normalizedValue ? "" : value;
      const changed = state[field] !== nextValue;
      state[field] = nextValue;
      if (applyNow && (changed || toggle)) applyAndSync();
      return changed;
    };

    const apply = () => {
      const activeId = root.querySelector(".as-section.as-visible")?.id;
      const q = state.search.toLowerCase();
      const diffMin = Number.isFinite(parseFloat(state.difficultyMin))
        ? parseFloat(state.difficultyMin)
        : null;
      const diffMax = Number.isFinite(parseFloat(state.difficultyMax))
        ? parseFloat(state.difficultyMax)
        : null;
      const recentMinVal = Number.isFinite(parseFloat(state.recentMin))
        ? parseFloat(state.recentMin)
        : null;
      const recentMaxVal = Number.isFinite(parseFloat(state.recentMax))
        ? parseFloat(state.recentMax)
        : null;

      const parts = [];
      if (state.search) parts.push(`Search: "${state.search}"`);
      if (state.song) parts.push(`Song: ${state.song}`);
      if (state.anime) parts.push(`Anime: ${state.anime}`);
      if (state.artist) parts.push(`Artist: ${state.artist}`);
      if (state.type) parts.push(`Type: ${state.type}`);
      if (diffMin !== null || diffMax !== null)
        parts.push(
          `Difficulty: ${diffMin !== null ? diffMin : 0}–${
            diffMax !== null ? diffMax : 100
          }%`
        );
      if (recentMinVal !== null || recentMaxVal !== null)
        parts.push(
          `Recent: ${recentMinVal !== null ? recentMinVal : 0}–${
            recentMaxVal !== null ? recentMaxVal : 100
          }%`
        );
      if (pill)
        pill.textContent = parts.length ? parts.join(" · ") : "No filters";

      root.querySelectorAll(".as-section table tbody tr").forEach((tr) => {
        let ok = true;

        const section = tr.closest(".as-section");
        if (!section || section.id !== activeId) return;

        const text = tr.textContent.toLowerCase();
        if (q && !text.includes(q)) ok = false;

        const isSongish = ["songStats", "songsToLearnStats", "songsNeverGotStats"].includes(
          activeId
        );
        if (ok && isSongish) {
          const rowType = tr.getAttribute("data-type") || "";
          const rowAnime = (tr.getAttribute("data-anime") || "").toLowerCase();
          const rowArtist = (tr.getAttribute("data-artist") || "").toLowerCase();
          const rowSong = (tr.getAttribute("data-song") || "").toLowerCase();
          const rowDiff = parseFloat(tr.getAttribute("data-difficulty"));
          const rowRecent = parseFloat(tr.getAttribute("data-recent"));

          if (state.type && rowType.toLowerCase() !== state.type.toLowerCase())
            ok = false;
          if (ok && state.song && rowSong !== state.song.toLowerCase()) ok = false;
          if (
            ok &&
            state.anime &&
            !rowAnime.includes(state.anime.toLowerCase())
          )
            ok = false;
          if (
            ok &&
            state.artist &&
            !rowArtist.includes(state.artist.toLowerCase())
          )
            ok = false;
          if (ok && diffMin !== null && (!Number.isFinite(rowDiff) || rowDiff < diffMin))
            ok = false;
          if (ok && diffMax !== null && (!Number.isFinite(rowDiff) || rowDiff > diffMax))
            ok = false;
          if (
            ok &&
            recentMinVal !== null &&
            (!Number.isFinite(rowRecent) || rowRecent < recentMinVal)
          )
            ok = false;
          if (
            ok &&
            recentMaxVal !== null &&
            (!Number.isFinite(rowRecent) || rowRecent > recentMaxVal)
          )
            ok = false;
        }

        tr.style.display = ok ? "" : "none";
      });
    };

    // Allow other UI elements (e.g., Overall tab lists) to set filters robustly
    root.addEventListener("as-set-filters", (ev) => {
      const d = (ev && ev.detail) || {};
      let dirty = false;
      ["search", "type", "anime", "artist", "song"].forEach((key) => {
        if (key in d) {
          if (key === "search") {
            state.search = String(d[key] || "");
            if (search) search.value = state.search;
            dirty = true;
          } else {
            dirty = setChipState(key, String(d[key] || ""), { applyNow: false }) || dirty;
          }
        }
      });
      if (dirty) applyAndSync();
    });

    root.querySelectorAll(".as-tab[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveTab(root, btn.dataset.tab);
        apply();
      });
    });

    if (search)
      search.addEventListener("input", () => {
        state.search = search.value.trim();
        applyAndSync();
      });

    const handleRangeInput = (inputEl, key) => {
      if (!inputEl) return;
      inputEl.addEventListener("input", () => {
        state[key] = inputEl.value.trim();
        apply();
      });
    };

    handleRangeInput(difficultyMin, "difficultyMin");
    handleRangeInput(difficultyMax, "difficultyMax");
    handleRangeInput(recentMin, "recentMin");
    handleRangeInput(recentMax, "recentMax");

    if (chipGroups) {
      chipGroups.addEventListener("click", (e) => {
        const chip = e.target.closest(".as-chip");
        if (!chip) return;
        const field = chip.getAttribute("data-filter-field");
        const value = chip.getAttribute("data-filter-value") || "";
        if (!field) return;
        setChipState(field, value, { toggle: true });
      });
    }

    if (clear)
      clear.addEventListener("click", () => {
        state.search = "";
        state.type = "";
        state.anime = "";
        state.artist = "";
        state.song = "";
        state.difficultyMin = "";
        state.difficultyMax = "";
        state.recentMin = "";
        state.recentMax = "";
        ["type", "anime", "artist", "song"].forEach((field) => {
          setChipState(field, "", { applyNow: false });
        });
        if (search) search.value = "";
        if (difficultyMin) difficultyMin.value = "";
        if (difficultyMax) difficultyMax.value = "";
        if (recentMin) recentMin.value = "";
        if (recentMax) recentMax.value = "";
        applyAndSync();
      });

    root.querySelectorAll("[data-drill-anime]").forEach((el) => {
      el.classList.add("as-clickable");
      el.addEventListener("click", () => {
        setActiveTab(root, "songStats");
        root.dispatchEvent(
          new CustomEvent("as-set-filters", {
            detail: {
              anime: el.getAttribute("data-drill-anime") || "",
              artist: "",
              song: "",
            },
          })
        );
      });
    });

    root.querySelectorAll("[data-drill-artist]").forEach((el) => {
      el.classList.add("as-clickable");
      el.addEventListener("click", () => {
        setActiveTab(root, "songStats");
        root.dispatchEvent(
          new CustomEvent("as-set-filters", {
            detail: {
              artist: el.getAttribute("data-drill-artist") || "",
              anime: "",
              song: "",
            },
          })
        );
      });
    });

    setActiveTab(root, "overallStats");
    apply();
    syncChips();
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
