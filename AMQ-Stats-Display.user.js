// ==UserScript==
// @name         AMQ Stats Display
// @namespace    https://animemusicquiz.com/
// @version      1.1
// @description  Display stats
// @author       Problem02
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://github.com/Nick-NCSU/AMQ-Extended-Song-List/raw/main/src/generator.user.js
// @downloadURL  https://github.com/Problem02/AMQ-Stats-Display/raw/refs/heads/main/AMQ-Stats-Display.user.js
// @updateURL    https://github.com/Problem02/AMQ-Stats-Display/raw/refs/heads/main/AMQ-Stats-Display.user.js
// ==/UserScript==

(function () {
    'use strict';

    const types = ['OP', 'ED', 'IN'];

    function calculateStats() {
        const rawData = localStorage.getItem('extendedSongList');
        if (!rawData) {
            alert('No data found in localStorage under "extendedSongList". Please ensure it is available.');
            return null;
        }

        const data = JSON.parse(rawData);
        const stats = {
            overall: { totalEntries: 0, correctCount: 0, gettable: 0, totalPlays: 0, learned: 0, unlearned: 0, unplayed: 0 },
            types: { OP: {}, ED: {}, IN: {} },
            under30: { totalEntries: 0, totalPlays: 0, correctCount: 0, gettable: 0, learned: 0, unlearned: 0, unplayed: 0 },
            animeStats: [],
            artistStats: [],
            songStats: [],
            animeToLearn: [],
            songsToLearn: [],
            songsNeverGot: []
        };

        const animeData = {};
        const artistData = {};
        const songData = {};

        types.forEach(type => {
            stats.types[type] = { total: 0, plays: 0, correct: 0, learned: 0, unlearned: 0, unplayed: 0, gettable: 0, under30: {} };
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
                const anime = entry.anime[animeId].names.EN || entry.anime[animeId].names.JA;
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
                    songData[song] = { plays: 0, correct: 0, artist: entry.artist, difficulty: entry.globalPercent, anime: entry.anime, type: type, recentPercent: entry.recentPercent };
                }
                songData[song].plays += plays;
                songData[song].correct += correct;

                // Add to songsNeverGot if plays > 0 and correct == 0
                if (plays > 0 && correct == 0) {
                    stats.songsNeverGot.push({
                        song: song,
                        artist: entry.artist,
                        difficulty: entry.globalPercent,
                        anime: Object.values(entry.anime).map(a => a.names.EN || a.names.JA).join(', '),
                        type: type,
                        plays: plays
                    });
                }
            }
        });

        // Prepare anime stats
        for (const anime in animeData) {
            const { plays, correct } = animeData[anime];
            const percentage = plays > 0 ? (correct / plays) * 100 : 0;
            stats.animeStats.push({
                anime: anime,
                plays: plays,
                correct: correct,
                percentage: percentage
            });

            // Add to animeToLearn if plays > 0 and percentage < 60
            if (plays > 0 && percentage < 60) {
                stats.animeToLearn.push({
                    anime: anime,
                    plays: plays,
                    correct: correct,
                    percentage: percentage
                });
            }
        }

        stats.animeStats.sort((a, b) => b.plays - a.plays); // Sort anime stats by total plays
        stats.animeToLearn.sort((a, b) => b.plays - a.plays); // Sort anime to learn by total plays

        // Prepare artist stats
        for (const artist in artistData) {
            const { plays, correct } = artistData[artist];
            stats.artistStats.push({
                artist: artist,
                plays: plays,
                correct: correct,
                percentage: plays > 0 ? (correct / plays) * 100 : 0
            });
        }

        stats.artistStats.sort((a, b) => b.plays - a.plays); // Sort artist stats by total plays

        // Prepare song stats
        for (const song in songData) {
            const { plays, correct, artist, difficulty, anime, type, recentPercent } = songData[song];
            const percentage = plays > 0 ? (correct / plays) * 100 : 0;
            stats.songStats.push({
                song: song,
                artist: artist,
                difficulty: difficulty,
                anime: Object.values(anime).map(a => a.names.EN || a.names.JA).join(', '),
                type: type,
                plays: plays,
                correct: correct,
                percentage: percentage,
                recentPercent: recentPercent
            });

            // Add to songsToLearn if plays > 0 and percentage < 50
            if (plays > 0 && percentage < 50) {
                stats.songsToLearn.push({
                    song: song,
                    artist: artist,
                    difficulty: difficulty,
                    anime: Object.values(anime).map(a => a.names.EN || a.names.JA).join(', '),
                    type: type,
                    plays: plays,
                    correct: correct,
                    percentage: percentage,
                    recentPercent: recentPercent
                });
            }
        }

        stats.songStats.sort((a, b) => b.plays - a.plays); // Sort song stats by total plays
        stats.songsToLearn.sort((a, b) => b.plays - a.plays); // Sort songs to learn by total plays
        stats.songsNeverGot.sort((a, b) => b.plays - a.plays); // Sort songs never got by total plays

        return stats;
    }

    function formatOverallStats(stats) {
    const { overall, under30, types } = stats;
    return `
        <div id="overallStats">
            <h3>Overall Stats</h3>
            <p>Total entries: ${overall.totalEntries}</p>
            <p>Guess rate: ${overall.correctCount} / ${overall.totalPlays} ${(overall.correctCount / overall.totalPlays * 100).toFixed(2)}%</p>
            <p>Gettable %: ${overall.gettable} / ${overall.totalEntries} ${((overall.gettable) / overall.totalEntries * 100).toFixed(2)}%</p>
            <p>Learned entries (>70%): ${overall.learned} / ${overall.totalEntries} ${(overall.learned / overall.totalEntries * 100).toFixed(2)}%</p>
            <p>Unlearned entries (<70%): ${overall.unlearned} / ${overall.totalEntries} ${(overall.unlearned / overall.totalEntries * 100).toFixed(2)}%</p>
            <p>Unplayed entries: ${overall.unplayed} / ${overall.totalEntries} ${(overall.unplayed / overall.totalEntries * 100).toFixed(2)}%</p>
            <hr>
            <h3>Openings: ${types.OP.total}</h3>
            <p>Openings guess rate %: ${types.OP.correct} / ${types.OP.plays} ${(types.OP.correct / types.OP.plays * 100).toFixed(2)}%</p>
            <p>Openings gettable %: ${types.OP.gettable} / ${types.OP.total} ${((types.OP.gettable) / types.OP.total * 100).toFixed(2)}%</p>
            <p>Openings learned %: ${types.OP.learned} / ${types.OP.total} ${(types.OP.learned / types.OP.total * 100).toFixed(2)}%</p>
            <p>Openings unlearned %: ${(types.OP.unlearned / types.OP.total * 100).toFixed(2)}%</p>
            <p>Openings unplayed %: ${(types.OP.unplayed / types.OP.total * 100).toFixed(2)}%</p>
            <hr>
            <h3>Endings: ${types.ED.total}</h3>
            <p>Endings guess rate %: ${types.ED.correct} / ${types.ED.plays} ${(types.ED.correct / types.ED.plays * 100).toFixed(2)}%</p>
            <p>Endings gettable %: ${types.ED.gettable} / ${types.ED.total} ${((types.ED.gettable) / types.ED.total * 100).toFixed(2)}%</p>
            <p>Endings learned %: ${types.ED.learned} / ${types.ED.total} ${(types.ED.learned / types.ED.total * 100).toFixed(2)}%</p>
            <p>Endings unlearned %: ${(types.ED.unlearned / types.ED.total * 100).toFixed(2)}%</p>
            <p>Endings unplayed %: ${(types.ED.unplayed / types.ED.total * 100).toFixed(2)}%</p>
            <hr>
            <h3>Inserts: ${types.IN.total}</h3>
            <p>Inserts guess rate %: ${types.IN.correct} / ${types.IN.plays} ${(types.IN.correct / types.IN.plays * 100).toFixed(2)}%</p>
            <p>Inserts gettable %: ${types.IN.gettable} / ${types.IN.total} ${((types.IN.gettable) / types.IN.total * 100).toFixed(2)}%</p>
            <p>Inserts learned %: ${types.IN.learned} / ${types.IN.total} ${(types.IN.learned / types.IN.total * 100).toFixed(2)}%</p>
            <p>Inserts unlearned %: ${(types.IN.unlearned / types.IN.total * 100).toFixed(2)}%</p>
            <p>Inserts unplayed %: ${(types.IN.unplayed / types.IN.total * 100).toFixed(2)}%</p>
            <hr>
            <h3>Under 30 Overall</h3>
            <p>Under 30 overall guess rate %: ${under30.correctCount} / ${under30.totalPlays} ${(under30.correctCount / under30.totalPlays * 100).toFixed(2)}%</p>
            <p>Under 30 overall gettable %: ${under30.gettable} / ${under30.totalEntries} ${((under30.gettable) / (under30.totalEntries) * 100).toFixed(2)}%</p>
            <p>Under 30 overall learned %: ${under30.learned} / ${under30.totalEntries} ${(under30.learned / (under30.totalEntries) * 100).toFixed(2)}%</p>
            <p>Under 30 overall unlearned %: ${(under30.unlearned / (under30.totalEntries) * 100).toFixed(2)}%</p>
            <p>Under 30 overall unplayed %: ${(under30.unplayed / (under30.totalEntries) * 100).toFixed(2)}%</p>
        </div>
    `;
}

    function formatAnimeStats(stats) {
    return `
        <div id="animeStats" style="display:none; height: 100%; overflow-y: auto; position: relative;">
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
                        .map(anime => `
                            <tr>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.anime}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.plays}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.correct}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.percentage.toFixed(2)}%</td>
                            </tr>
                        `)
                        .join('')}
                </tbody>
            </table>
        </div>
    `;
}

function formatArtistStats(stats) {
    return `
        <div id="artistStats" style="display:none; height: 100%; overflow-y: auto; position: relative;">
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
                        .map(artist => `
                            <tr>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${artist.artist}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${artist.plays}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${artist.correct}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${artist.percentage.toFixed(2)}%</td>
                            </tr>
                        `)
                        .join('')}
                </tbody>
            </table>
        </div>
    `;
}

function formatSongStats(stats) {
    return `
        <div id="songStats" style="display:none; height: 100%; overflow-y: auto; position: relative;">
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
                        .map(song => `
                            <tr>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.song}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.artist}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.difficulty.toFixed(2)}%</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.anime}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.type}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.plays}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.correct}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.percentage.toFixed(2)}%</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.recentPercent.toFixed(2)}%</td>
                            </tr>
                        `)
                        .join('')}
                </tbody>
            </table>
        </div>
    `;
}

function formatAnimeToLearnStats(stats) {
    return `
        <div id="animeToLearnStats" style="display:none; height: 100%; overflow-y: auto; position: relative;">
            <h3 style="position: sticky; top: 0; background-color: #333; margin: 0; padding: 10px 20px; color: #FFFFFF; text-align: center; z-index: 10; border-bottom: 2px solid #FFFFFF;">
                Anime to Learn
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px; text-align: left;">
                <thead style="position: sticky; top: 47px; background-color: #444; z-index: 5;">
                    <tr>
                        <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap; width: 30%">Anime</th>
                        <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap; width: 20%">Plays</th>
                        <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap; width: 20%">Correct Count</th>
                        <th style="border: 1px solid #FFFFFF; padding: 8px; white-space: nowrap; width: 20%">Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.animeToLearn
                        .map(anime => `
                            <tr>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.anime}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.plays}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.correct}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${anime.percentage.toFixed(2)}%</td>
                            </tr>
                        `)
                        .join('')}
                </tbody>
            </table>
        </div>
    `;
}

function formatSongsToLearnStats(stats) {
    return `
        <div id="songsToLearnStats" style="display:none; height: 100%; overflow-y: auto; position: relative;">
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
                        .map(song => `
                            <tr>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.song}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.artist}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.difficulty.toFixed(2)}%</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.anime}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.type}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.plays}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.correct}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.percentage.toFixed(2)}%</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.recentPercent.toFixed(2)}%</td>
                            </tr>
                        `)
                        .join('')}
                </tbody>
            </table>
        </div>
    `;
}

function formatSongsNeverGotStats(stats) {
    return `
        <div id="songsNeverGotStats" style="display:none; height: 100%; overflow-y: auto; position: relative;">
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
                        .map(song => `
                            <tr>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.song}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.artist}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.difficulty.toFixed(2)}%</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.anime}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.type}</td>
                                <td style="border: 1px solid #FFFFFF; padding: 8px;">${song.plays}</td>
                            </tr>
                        `)
                        .join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showModal(stats) {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'statsModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.color = '#FFFFFF';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.padding = '20px';

    // Create tabs
    const tabs = document.createElement('div');
    tabs.style.display = 'flex';
    tabs.style.justifyContent = 'center';
    tabs.style.marginBottom = '20px';
    tabs.style.gap = '10px';

    const overallTab = document.createElement('button');
    overallTab.textContent = 'Overall Stats';
    overallTab.style.padding = '10px';
    overallTab.style.backgroundColor = '#007BFF';
    overallTab.style.color = '#FFFFFF';
    overallTab.style.border = 'none';
    overallTab.style.cursor = 'pointer';
    overallTab.addEventListener('click', () => {
        document.getElementById('overallStats').style.display = 'block';
        document.getElementById('animeStats').style.display = 'none';
        document.getElementById('artistStats').style.display = 'none';
        document.getElementById('songStats').style.display = 'none';
        document.getElementById('animeToLearnStats').style.display = 'none';
        document.getElementById('songsToLearnStats').style.display = 'none';
        document.getElementById('songsNeverGotStats').style.display = 'none';
    });

    const animeTab = document.createElement('button');
    animeTab.textContent = 'Anime Stats';
    animeTab.style.padding = '10px';
    animeTab.style.backgroundColor = '#007BFF';
    animeTab.style.color = '#FFFFFF';
    animeTab.style.border = 'none';
    animeTab.style.cursor = 'pointer';
    animeTab.addEventListener('click', () => {
        document.getElementById('overallStats').style.display = 'none';
        document.getElementById('animeStats').style.display = 'block';
        document.getElementById('artistStats').style.display = 'none';
        document.getElementById('songStats').style.display = 'none';
        document.getElementById('animeToLearnStats').style.display = 'none';
        document.getElementById('songsToLearnStats').style.display = 'none';
        document.getElementById('songsNeverGotStats').style.display = 'none';
    });

    const artistTab = document.createElement('button');
    artistTab.textContent = 'Artist Stats';
    artistTab.style.padding = '10px';
    artistTab.style.backgroundColor = '#007BFF';
    artistTab.style.color = '#FFFFFF';
    artistTab.style.border = 'none';
    artistTab.style.cursor = 'pointer';
    artistTab.addEventListener('click', () => {
        document.getElementById('overallStats').style.display = 'none';
        document.getElementById('animeStats').style.display = 'none';
        document.getElementById('artistStats').style.display = 'block';
        document.getElementById('songStats').style.display = 'none';
        document.getElementById('animeToLearnStats').style.display = 'none';
        document.getElementById('songsToLearnStats').style.display = 'none';
        document.getElementById('songsNeverGotStats').style.display = 'none';
    });

    const songTab = document.createElement('button');
    songTab.textContent = 'Song Stats';
    songTab.style.padding = '10px';
    songTab.style.backgroundColor = '#007BFF';
    songTab.style.color = '#FFFFFF';
    songTab.style.border = 'none';
    songTab.style.cursor = 'pointer';
    songTab.addEventListener('click', () => {
        document.getElementById('overallStats').style.display = 'none';
        document.getElementById('animeStats').style.display = 'none';
        document.getElementById('artistStats').style.display = 'none';
        document.getElementById('songStats').style.display = 'block';
        document.getElementById('animeToLearnStats').style.display = 'none';
        document.getElementById('songsToLearnStats').style.display = 'none';
        document.getElementById('songsNeverGotStats').style.display = 'none';
    });

    const animeToLearnTab = document.createElement('button');
    animeToLearnTab.textContent = 'Anime to Learn';
    animeToLearnTab.style.padding = '10px';
    animeToLearnTab.style.backgroundColor = '#007BFF';
    animeToLearnTab.style.color = '#FFFFFF';
    animeToLearnTab.style.border = 'none';
    animeToLearnTab.style.cursor = 'pointer';
    animeToLearnTab.addEventListener('click', () => {
        document.getElementById('overallStats').style.display = 'none';
        document.getElementById('animeStats').style.display = 'none';
        document.getElementById('artistStats').style.display = 'none';
        document.getElementById('songStats').style.display = 'none';
        document.getElementById('animeToLearnStats').style.display = 'block';
        document.getElementById('songsToLearnStats').style.display = 'none';
        document.getElementById('songsNeverGotStats').style.display = 'none';
    });

    const songsToLearnTab = document.createElement('button');
    songsToLearnTab.textContent = 'Songs to Learn';
    songsToLearnTab.style.padding = '10px';
    songsToLearnTab.style.backgroundColor = '#007BFF';
    songsToLearnTab.style.color = '#FFFFFF';
    songsToLearnTab.style.border = 'none';
    songsToLearnTab.style.cursor = 'pointer';
    songsToLearnTab.addEventListener('click', () => {
        document.getElementById('overallStats').style.display = 'none';
        document.getElementById('animeStats').style.display = 'none';
        document.getElementById('artistStats').style.display = 'none';
        document.getElementById('songStats').style.display = 'none';
        document.getElementById('animeToLearnStats').style.display = 'none';
        document.getElementById('songsToLearnStats').style.display = 'block';
        document.getElementById('songsNeverGotStats').style.display = 'none';
    });

    const songsNeverGotTab = document.createElement('button');
    songsNeverGotTab.textContent = 'Songs Never Got';
    songsNeverGotTab.style.padding = '10px';
    songsNeverGotTab.style.backgroundColor = '#007BFF';
    songsNeverGotTab.style.color = '#FFFFFF';
    songsNeverGotTab.style.border = 'none';
    songsNeverGotTab.style.cursor = 'pointer';
    songsNeverGotTab.addEventListener('click', () => {
        document.getElementById('overallStats').style.display = 'none';
        document.getElementById('animeStats').style.display = 'none';
        document.getElementById('artistStats').style.display = 'none';
        document.getElementById('songStats').style.display = 'none';
        document.getElementById('animeToLearnStats').style.display = 'none';
        document.getElementById('songsToLearnStats').style.display = 'none';
        document.getElementById('songsNeverGotStats').style.display = 'block';
    });

    tabs.appendChild(overallTab);
    tabs.appendChild(animeTab);
    tabs.appendChild(artistTab);
    tabs.appendChild(songTab);
    tabs.appendChild(animeToLearnTab);
    tabs.appendChild(songsToLearnTab);
    tabs.appendChild(songsNeverGotTab);

    // Add content container
    const contentContainer = document.createElement('div');
    contentContainer.style.backgroundColor = '#333';
    contentContainer.style.borderRadius = '10px';
    contentContainer.style.padding = '20px';
    contentContainer.style.width = '90%';
    contentContainer.style.height = '80%';
    contentContainer.style.overflowY = 'auto';
    contentContainer.innerHTML = formatOverallStats(stats) + formatAnimeStats(stats) + formatArtistStats(stats) + formatSongStats(stats) + formatAnimeToLearnStats(stats) + formatSongsToLearnStats(stats) + formatSongsNeverGotStats(stats);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '20px';
    closeButton.style.padding = '10px';
    closeButton.style.backgroundColor = '#FF0000';
    closeButton.style.color = '#FFFFFF';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => modal.remove());

    modal.appendChild(tabs);
    modal.appendChild(contentContainer);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);
}

    function addStatsButton() {
        if (document.getElementById('showStatsButton')) return;

        const button = document.createElement('button');
        button.id = 'showStatsButton';
        button.textContent = 'Show Stats';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.padding = '10px';
        button.style.backgroundColor = '#007BFF';
        button.style.color = '#FFFFFF';
        button.style.border = 'none';
        button.style.cursor = 'pointer';

        button.addEventListener('click', () => {
            const stats = calculateStats();
            if (stats) {
                showModal(stats);
            }
        });

        document.body.appendChild(button);
    }

    function removeStatsButton() {
        const button = document.getElementById('showStatsButton');
        if (button) button.remove();
    }

    const observer = new MutationObserver(() => {
        const targetElement = document.getElementById('expandLibraryPage');
        if (targetElement && targetElement.className === 'gamePage') {
            addStatsButton();
        } else {
            removeStatsButton();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();