document.addEventListener('DOMContentLoaded', () => {
    const startAuditBtn = document.getElementById('start-audit-btn');
    if (startAuditBtn) {
        startAuditBtn.addEventListener('click', runAudit);
    }
});

async function runAudit() {
    const pageId = document.getElementById('page-select').value;

    const resultsContainer = document.getElementById('results-container');
    const summaryContainer = document.getElementById('summary-container');
    resultsContainer.innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
    summaryContainer.innerHTML = '';

    try {
        const [localData, sksData] = await Promise.all([
            fetchJSON(`data/${pageId}_data.json`),
            fetchJSON('dumpfiles/sks_processed.json')
        ]);

        const localMap = createMapFromJson(localData);
        
        const comparisonResults = compareData(localMap, sksData);

        renderSummary(comparisonResults, summaryContainer);
        renderResults(comparisonResults, resultsContainer);

    } catch (error) {
        resultsContainer.innerHTML = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message}</div>`;
        console.error("Audit failed:", error);
    }
}

async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${url}`);
    return response.json();
}

function createMapFromJson(jsonData) {
    const map = new Map();
    if (!jsonData.Groups) return map;

    jsonData.Groups.forEach(group => {
        group.Items.forEach(item => {
            if (item.SKScode && item.SKSnavn && item.Show === true) {
                map.set(item.SKScode, item.SKSnavn);
            }
        });
    });
    return map;
}

function compareData(localMap, sksData) {
    const results = {
        matches: [],
        missingInDump: []
    };

    for (const [code, localText] of localMap.entries()) {
        if (code in sksData) {
            const dumpText = sksData[code];
            const maxLength = Math.max(localText.length, dumpText.length);
            const similarity = maxLength === 0 ? 100 : (1 - levenshtein(localText, dumpText) / maxLength) * 100;
            results.matches.push({ code, localText, dumpText, similarity });
        } else {
            results.missingInDump.push({ code, localText });
        }
    }

    return results;
}

function renderSummary(results, container) {
    const totalCompared = results.matches.length + results.missingInDump.length;
    const perfectMatches = results.matches.filter(m => m.similarity === 100).length;
    const averageSimilarity = results.matches.reduce((acc, m) => acc + m.similarity, 0) / (results.matches.length || 1);

    const summaryHtml = `
        <div class="summary">
            <h4>Audit Summary</h4>
            <p><strong>Overall Accuracy:</strong> ${averageSimilarity.toFixed(2)}%</p>
            <ul>
                <li><strong>${totalCompared}</strong> codes in local data audited.</li>
                <li><strong>${perfectMatches}</strong> perfect matches (100%).</li>
                <li><strong>${results.missingInDump.length}</strong> codes missing from the dump file.</li>
            </ul>
        </div>
    `;
    container.innerHTML = summaryHtml;
}

function renderResults(results, container) {
    let tableHtml = '<table class="table table-bordered table-hover"><thead><tr><th>SKS Code</th><th>Local SKSnavn</th><th>Dump File Text</th><th>Similarity</th></tr></thead><tbody>';

    results.missingInDump.forEach(item => {
        tableHtml += `
            <tr class="table-danger">
                <td>${item.code}</td>
                <td>${item.localText}</td>
                <td><em>Not found in dump file</em></td>
                <td>0.00%</td>
            </tr>
        `;
    });

    results.matches.sort((a, b) => a.similarity - b.similarity);
    results.matches.forEach(item => {
        let rowClass = 'similarity-perfect';
        if (item.similarity < 100) rowClass = 'similarity-good';
        if (item.similarity < 90) rowClass = 'similarity-bad';

        tableHtml += `
            <tr class="${rowClass}">
                <td>${item.code}</td>
                <td>${item.localText}</td>
                <td>${item.dumpText}</td>
                <td>${item.similarity.toFixed(2)}%</td>
            </tr>
        `;
    });

    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
}

function levenshtein(s1, s2) {
    if (s1.length > s2.length) {
        [s1, s2] = [s2, s1];
    }

    const distances = Array.from({ length: s1.length + 1 }, (_, i) => i);

    for (let j = 0; j < s2.length; j++) {
        let previousDiagonal = distances[0];
        distances[0]++;

        for (let i = 0; i < s1.length; i++) {
            const currentDiagonal = distances[i + 1];
            const cost = s1[i] === s2[j] ? 0 : 1;
            distances[i + 1] = Math.min(distances[i + 1] + 1, distances[i] + 1, previousDiagonal + cost);
            previousDiagonal = currentDiagonal;
        }
    }

    return distances[s1.length];
}