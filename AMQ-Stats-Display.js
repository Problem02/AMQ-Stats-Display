// ==UserScript==
// @name         AMQ Stats Display
// @namespace    https://animemusicquiz.com/
// @version      1.0
// @description  Display stats
// @author       Problem02
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://github.com/Nick-NCSU/AMQ-Extended-Song-List/raw/main/src/generator.user.js
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
            overall: { totalEntries: 0, correctCount: 0, totalPlays: 0, learned: 0, unlearned: 0, unplayed: 0 },
            types: { OP: {}, ED: {}, IN: {} },
            under30: { totalPlays: 0, correctCount: 0, learned: 0, unlearned: 0, unplayed: 0 },
            animeStats: []
        };

        const animeData = {};

        types.forEach(type => {
            stats.types[type] = { total: 0, plays: 0, correct: 0, learned: 0, unlearned: 0, unplayed: 0, under30: {} };
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
            stats.overall.totalPlays += plays;
            if (percentage >= 70) stats.overall.learned++;
            else if (plays > 0) stats.overall.unlearned++;
            else stats.overall.unplayed++;

            // Update type-specific stats
            const typeStats = stats.types[type];
            typeStats.total++;
            typeStats.plays += plays;
            typeStats.correct += correct;
            if (percentage >= 70) typeStats.learned++;
            else if (plays > 0) typeStats.unlearned++;
            else typeStats.unplayed++;

            // Update under-30 stats
            if (diff < 30) {
                stats.under30.totalPlays += plays;
                stats.under30.correctCount += correct;
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
        });

        // Prepare anime stats
        for (const anime in animeData) {
            const { plays, correct } = animeData[anime];
            stats.animeStats.push({
                anime: anime,
                plays: plays,
                correct: correct,
                percentage: plays > 0 ? (correct / plays) * 100 : 0
            });
        }

        stats.animeStats.sort((a, b) => b.plays - a.plays); // Sort anime stats by total plays

        return stats;
    }

    function formatOverallStats(stats) {
    const { overall, under30, types } = stats;
    return `
        <div id="overallStats">
            <h3>Overall Stats</h3>
            <p>Total entries: ${overall.totalEntries}</p>
            <p>Guess rate: ${overall.correctCount} / ${overall.totalPlays} ${(overall.correctCount / overall.totalPlays * 100).toFixed(2)}%</p>
            <p>Gettable %: ${overall.learned + overall.unlearned} / ${overall.totalEntries} ${((overall.learned + overall.unlearned) / overall.totalEntries * 100).toFixed(2)}%</p>
            <p>Learned entries (>70%): ${overall.learned} / ${overall.totalEntries} ${(overall.learned / overall.totalEntries * 100).toFixed(2)}%</p>
            <p>Unlearned entries (<70%): ${overall.unlearned} / ${overall.totalEntries} ${(overall.unlearned / overall.totalEntries * 100).toFixed(2)}%</p>
            <p>Unplayed entries: ${overall.unplayed} / ${overall.totalEntries} ${(overall.unplayed / overall.totalEntries * 100).toFixed(2)}%</p>
            <hr>
            <h3>Openings: ${types.OP.total}</h3>
            <p>Openings guess rate %: ${types.OP.correct} / ${types.OP.plays} ${(types.OP.correct / types.OP.plays * 100).toFixed(2)}</p>
            <p>Openings gettable %: ${types.OP.learned + types.OP.unlearned} / ${types.OP.total} ${((types.OP.learned + types.OP.unlearned) / types.OP.total * 100).toFixed(2)}</p>
            <p>Openings learned %: ${types.OP.learned} / ${types.OP.total} ${(types.OP.learned / types.OP.total * 100).toFixed(2)}</p>
            <p>Openings unlearned %: ${(types.OP.unlearned / types.OP.total * 100).toFixed(2)}</p>
            <p>Openings unplayed %: ${(types.OP.unplayed / types.OP.total * 100).toFixed(2)}</p>
            <hr>
            <h3>Endings: ${types.ED.total}</h3>
            <p>Endings guess rate %: ${types.ED.correct} / ${types.ED.plays} ${(types.ED.correct / types.ED.plays * 100).toFixed(2)}</p>
            <p>Endings gettable %: ${types.ED.learned + types.ED.unlearned} / ${types.ED.total} ${((types.ED.learned + types.ED.unlearned) / types.ED.total * 100).toFixed(2)}</p>
            <p>Endings learned %: ${types.ED.learned} / ${types.ED.total} ${(types.ED.learned / types.ED.total * 100).toFixed(2)}</p>
            <p>Endings unlearned %: ${(types.ED.unlearned / types.ED.total * 100).toFixed(2)}</p>
            <p>Endings unplayed %: ${(types.ED.unplayed / types.ED.total * 100).toFixed(2)}</p>
            <hr>
            <h3>Inserts: ${types.IN.total}</h3>
            <p>Inserts guess rate %: ${types.IN.correct} / ${types.IN.plays} ${(types.IN.correct / types.IN.plays * 100).toFixed(2)}</p>
            <p>Inserts gettable %: ${types.IN.learned + types.IN.unlearned} / ${types.IN.total} ${((types.IN.learned + types.IN.unlearned) / types.IN.total * 100).toFixed(2)}</p>
            <p>Inserts learned %: ${types.IN.learned} / ${types.IN.total} ${(types.IN.learned / types.IN.total * 100).toFixed(2)}</p>
            <p>Inserts unlearned %: ${(types.IN.unlearned / types.IN.total * 100).toFixed(2)}</p>
            <p>Inserts unplayed %: ${(types.IN.unplayed / types.IN.total * 100).toFixed(2)}</p>
            <hr>
            <h3>Under 30 Overall</h3>
            <p>Under 30 overall guess rate %: ${under30.correctCount} / ${under30.totalPlays} ${(under30.correctCount / under30.totalPlays * 100).toFixed(2)}</p>
            <p>Under 30 overall gettable %: ${under30.learned + under30.unlearned} / ${under30.learned + under30.unlearned + under30.unplayed} ${((under30.learned + under30.unlearned) / (under30.learned + under30.unlearned + under30.unplayed) * 100).toFixed(2)}</p>
            <p>Under 30 overall learned %: ${under30.learned} / ${under30.learned + under30.unlearned + under30.unplayed} ${(under30.learned / (under30.learned + under30.unlearned + under30.unplayed) * 100).toFixed(2)}</p>
            <p>Under 30 overall unlearned %: ${(under30.unlearned / (under30.learned + under30.unlearned + under30.unplayed) * 100).toFixed(2)}</p>
            <p>Under 30 overall unplayed %: ${(under30.unplayed / (under30.learned + under30.unlearned + under30.unplayed) * 100).toFixed(2)}</p>
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
                        <th style="border: 1px solid #FFFFFF; padding: 8px;">Name</th>
                        <th style="border: 1px solid #FFFFFF; padding: 8px;">Plays</th>
                        <th style="border: 1px solid #FFFFFF; padding: 8px;">Correct Count</th>
                        <th style="border: 1px solid #FFFFFF; padding: 8px;">Percentage</th>
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
        });

        tabs.appendChild(overallTab);
        tabs.appendChild(animeTab);

        // Add content container
        const contentContainer = document.createElement('div');
        contentContainer.style.backgroundColor = '#333';
        contentContainer.style.borderRadius = '10px';
        contentContainer.style.padding = '20px';
        contentContainer.style.width = '80%';
        contentContainer.style.height = '70%';
        contentContainer.style.overflowY = 'auto';
        contentContainer.innerHTML = formatOverallStats(stats) + formatAnimeStats(stats);

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