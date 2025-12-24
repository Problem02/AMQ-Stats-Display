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

  function formatOverallStats(stats) {
    const { overall, under30, types } = stats;
    return `
            <div id="overallStats">
                <h3>Overall Stats</h3>
                <p>Total entries: ${overall.totalEntries}</p>
                <p>Guess rate: ${overall.correctCount} / ${
      overall.totalPlays
    } ${((overall.correctCount / overall.totalPlays) * 100).toFixed(2)}%</p>
                <p>Gettable %: ${overall.gettable} / ${overall.totalEntries} ${(
      (overall.gettable / overall.totalEntries) *
      100
    ).toFixed(2)}%</p>
                <p>Learned entries (>70%): ${overall.learned} / ${
      overall.totalEntries
    } ${((overall.learned / overall.totalEntries) * 100).toFixed(2)}%</p>
                <p>Unlearned entries (<70%): ${overall.unlearned} / ${
      overall.totalEntries
    } ${((overall.unlearned / overall.totalEntries) * 100).toFixed(2)}%</p>
                <p>Unplayed entries: ${overall.unplayed} / ${
      overall.totalEntries
    } ${((overall.unplayed / overall.totalEntries) * 100).toFixed(2)}%</p>
                <hr>
                <h3>Openings: ${types.OP.total}</h3>
                <p>Openings guess rate %: ${types.OP.correct} / ${
      types.OP.plays
    } ${((types.OP.correct / types.OP.plays) * 100).toFixed(2)}%</p>
                <p>Openings gettable %: ${types.OP.gettable} / ${
      types.OP.total
    } ${((types.OP.gettable / types.OP.total) * 100).toFixed(2)}%</p>
                <p>Openings learned %: ${types.OP.learned} / ${
      types.OP.total
    } ${((types.OP.learned / types.OP.total) * 100).toFixed(2)}%</p>
                <p>Openings unlearned %: ${(
                  (types.OP.unlearned / types.OP.total) *
                  100
                ).toFixed(2)}%</p>
                <p>Openings unplayed %: ${(
                  (types.OP.unplayed / types.OP.total) *
                  100
                ).toFixed(2)}%</p>
                <hr>
                <h3>Endings: ${types.ED.total}</h3>
                <p>Endings guess rate %: ${types.ED.correct} / ${
      types.ED.plays
    } ${((types.ED.correct / types.ED.plays) * 100).toFixed(2)}%</p>
                <p>Endings gettable %: ${types.ED.gettable} / ${
      types.ED.total
    } ${((types.ED.gettable / types.ED.total) * 100).toFixed(2)}%</p>
                <p>Endings learned %: ${types.ED.learned} / ${
      types.ED.total
    } ${((types.ED.learned / types.ED.total) * 100).toFixed(2)}%</p>
                <p>Endings unlearned %: ${(
                  (types.ED.unlearned / types.ED.total) *
                  100
                ).toFixed(2)}%</p>
                <p>Endings unplayed %: ${(
                  (types.ED.unplayed / types.ED.total) *
                  100
                ).toFixed(2)}%</p>
                <hr>
                <h3>Inserts: ${types.IN.total}</h3>
                <p>Inserts guess rate %: ${types.IN.correct} / ${
      types.IN.plays
    } ${((types.IN.correct / types.IN.plays) * 100).toFixed(2)}%</p>
                <p>Inserts gettable %: ${types.IN.gettable} / ${
      types.IN.total
    } ${((types.IN.gettable / types.IN.total) * 100).toFixed(2)}%</p>
                <p>Inserts learned %: ${types.IN.learned} / ${
      types.IN.total
    } ${((types.IN.learned / types.IN.total) * 100).toFixed(2)}%</p>
                <p>Inserts unlearned %: ${(
                  (types.IN.unlearned / types.IN.total) *
                  100
                ).toFixed(2)}%</p>
                <p>Inserts unplayed %: ${(
                  (types.IN.unplayed / types.IN.total) *
                  100
                ).toFixed(2)}%</p>
                <hr>
                <h3>Under 30 Overall</h3>
                <p>Under 30 overall guess rate %: ${under30.correctCount} / ${
      under30.totalPlays
    } ${((under30.correctCount / under30.totalPlays) * 100).toFixed(2)}%</p>
                <p>Under 30 overall gettable %: ${under30.gettable} / ${
      under30.totalEntries
    } ${((under30.gettable / under30.totalEntries) * 100).toFixed(2)}%</p>
                <p>Under 30 overall learned %: ${under30.learned} / ${
      under30.totalEntries
    } ${((under30.learned / under30.totalEntries) * 100).toFixed(2)}%</p>
                <p>Under 30 overall unlearned %: ${(
                  (under30.unlearned / under30.totalEntries) *
                  100
                ).toFixed(2)}%</p>
                <p>Under 30 overall unplayed %: ${(
                  (under30.unplayed / under30.totalEntries) *
                  100
                ).toFixed(2)}%</p>
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
                            }" data-artist="${song.artist || ""}" data-anime="${
                              song.anime || ""
                            }">
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
                            <tr data-type="${song.type}" data-plays="${
                              song.plays
                            }" data-artist="${song.artist || ""}" data-anime="${
                              song.anime || ""
                            }">
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
                            <tr data-type="${song.type}" data-plays="${
                              song.plays
                            }" data-artist="${song.artist || ""}" data-anime="${
                              song.anime || ""
                            }">
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
            #statsModal .as-controls input,#statsModal .as-controls select{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:8px;padding:6px 10px;font-size:13px;}
            #statsModal .as-controls label{display:flex;gap:6px;align-items:center;font-size:13px;opacity:.95;}
            #statsModal .as-controls .as-pill{padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);font-size:12px;}
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

              <div class="as-controls">
                <input id="asSearch" type="text" placeholder="Search (anime / artist / song)..." />
                <select id="asType">
                  <option value="ALL">All Types</option>
                  <option value="OP">OP</option>
                  <option value="ED">ED</option>
                  <option value="IN">IN</option>
                </select>
                <label><input id="asHideUnplayed" type="checkbox" /> Hide unplayed</label>
                <span class="as-pill" id="asFilterPill">No filters</span>
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

    document.body.appendChild(root);

    initTableSorting(root);
    initFilteringAndDrilldown(root);
  }

  function setActiveTab(root, tabId) {
    root
      .querySelectorAll(".as-tab[data-tab]")
      .forEach((b) => b.classList.toggle("as-active", b.dataset.tab === tabId));
    root
      .querySelectorAll(".as-section")
      .forEach((sec) => sec.classList.toggle("as-visible", sec.id === tabId));
    const typeSel = root.querySelector("#asType");
    const hide = root.querySelector("#asHideUnplayed");
    const isSongish = [
      "songStats",
      "songsToLearnStats",
      "songsNeverGotStats",
    ].includes(tabId);
    typeSel.style.display = isSongish ? "" : "none";
    hide.style.display = isSongish ? "" : "none";
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
      type: "ALL",
      hideUnplayed: false,
      anime: "",
      artist: "",
    };

    const pill = root.querySelector("#asFilterPill");
    const search = root.querySelector("#asSearch");
    const type = root.querySelector("#asType");
    const hide = root.querySelector("#asHideUnplayed");
    const clear = root.querySelector("#asClearFilters");

    const apply = () => {
      const activeId = root.querySelector(".as-section.as-visible")?.id;
      const q = state.search.toLowerCase();

      const parts = [];
      if (state.search) parts.push(`Search: "${state.search}"`);
      if (state.anime) parts.push(`Anime: ${state.anime}`);
      if (state.artist) parts.push(`Artist: ${state.artist}`);
      if (state.type !== "ALL") parts.push(`Type: ${state.type}`);
      if (state.hideUnplayed) parts.push(`Hide unplayed`);
      pill.textContent = parts.length ? parts.join(" · ") : "No filters";

      root.querySelectorAll(".as-section table tbody tr").forEach((tr) => {
        let ok = true;

        const section = tr.closest(".as-section");
        if (!section || section.id !== activeId) return;

        const text = tr.textContent.toLowerCase();
        if (q && !text.includes(q)) ok = false;

        if (
          ok &&
          ["songStats", "songsToLearnStats", "songsNeverGotStats"].includes(
            activeId
          )
        ) {
          const rowType = tr.getAttribute("data-type") || "";
          const plays = Number(tr.getAttribute("data-plays") || "0");
          const rowAnime = (tr.getAttribute("data-anime") || "").toLowerCase();
          const rowArtist = (
            tr.getAttribute("data-artist") || ""
          ).toLowerCase();

          if (state.type !== "ALL" && rowType !== state.type) ok = false;
          if (ok && state.hideUnplayed && plays === 0) ok = false;
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
        }

        tr.style.display = ok ? "" : "none";
      });
    };

    root.querySelectorAll(".as-tab[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveTab(root, btn.dataset.tab);
        apply();
      });
    });

    search.addEventListener("input", () => {
      state.search = search.value.trim();
      apply();
    });
    type.addEventListener("change", () => {
      state.type = type.value;
      apply();
    });
    hide.addEventListener("change", () => {
      state.hideUnplayed = hide.checked;
      apply();
    });

    clear.addEventListener("click", () => {
      state.search = "";
      state.type = "ALL";
      state.hideUnplayed = false;
      state.anime = "";
      state.artist = "";
      search.value = "";
      type.value = "ALL";
      hide.checked = false;
      apply();
    });

    root.querySelectorAll("[data-drill-anime]").forEach((el) => {
      el.classList.add("as-clickable");
      el.addEventListener("click", () => {
        state.anime = el.getAttribute("data-drill-anime") || "";
        state.artist = "";
        setActiveTab(root, "songStats");
        apply();
      });
    });

    root.querySelectorAll("[data-drill-artist]").forEach((el) => {
      el.classList.add("as-clickable");
      el.addEventListener("click", () => {
        state.artist = el.getAttribute("data-drill-artist") || "";
        state.anime = "";
        setActiveTab(root, "songStats");
        apply();
      });
    });

    setActiveTab(root, "overallStats");
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
  // Live tracking (unchanged)
  // ---------------------------

  function setupLiveTracking() {
    if (window.__amqStatsDisplayLiveTrackingSetup) return;
    window.__amqStatsDisplayLiveTrackingSetup = true;

    if (typeof Listener !== "function") return;

    const listener = new Listener("answer results", (payload) => {
      try {
        const quizObj = window.quiz;
        if (!quizObj) return;

        const songId =
          payload?.songInfo?.songId ??
          payload?.songId ??
          payload?.songInfo?.song?.songId ??
          null;

        if (!songId) return;

        let isCorrect = false;
        const myId = quizObj.ownGamePlayerId;

        if (payload?.players && myId != null && payload.players[myId]) {
          const p = payload.players[myId];
          isCorrect = !!(p.correct ?? p.correctAnswer ?? p.isCorrect);
        } else if (
          Array.isArray(payload?.correctAnswerPlayers) &&
          myId != null
        ) {
          isCorrect = payload.correctAnswerPlayers.includes(myId);
        }

        const key = "amqStatsDisplayHistory";
        const hist = JSON.parse(localStorage.getItem(key) || "{}");
        if (!hist[songId]) hist[songId] = { plays: 0, correct: 0 };
        hist[songId].plays += 1;
        if (isCorrect) hist[songId].correct += 1;
        localStorage.setItem(key, JSON.stringify(hist));

        const raw = localStorage.getItem("extendedSongList");
        if (!raw) return;

        const data = JSON.parse(raw);

        for (const k in data) {
          const entry = data[k];
          const entrySongId =
            entry?.songId ?? entry?.songInfo?.songId ?? entry?.id ?? null;
          if (String(entrySongId) !== String(songId)) continue;

          entry.totalCorrectCount =
            (entry.totalCorrectCount || 0) + (isCorrect ? 1 : 0);
          entry.totalWrongCount =
            (entry.totalWrongCount || 0) + (isCorrect ? 0 : 1);
          data[k] = entry;
          break;
        }

        localStorage.setItem("extendedSongList", JSON.stringify(data));
      } catch (e) {
        // swallow
      }
    });

    try {
      listener.bindListener();
    } catch (e) {}
  }

  // ---------------------------
  // Boot / keepalive
  // ---------------------------

  function boot() {
    setupLiveTracking();
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
