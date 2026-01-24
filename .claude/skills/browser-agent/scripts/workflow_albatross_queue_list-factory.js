// Albatross Queue List Extraction
// Execute on: /workQueue/{QUEUE_ID}?smartlistId={SMARTLIST_ID}
//
// Purpose: Extract all project IDs and basic info from a queue list view.
// Handles pagination detection (shows 1-100 of N).
//
// Usage:
//   1. navigate("https://albatross.myblueraven.com/workQueue/38?smartlistId=2246")
//   2. wait 2-3 seconds
//   3. javascript_tool: this script
//   4. If hasMorePages is true, use pagination_next.js then repeat

(function() {
    const result = {
        workflow: 'albatross_queue_list',
        version: '1.0',
        timestamp: new Date().toISOString(),
        queueUrl: window.location.href,
        success: false,

        // Queue metadata
        queueId: null,
        smartlistId: null,

        // Pagination
        pagination: {
            start: 0,
            end: 0,
            total: 0,
            hasMorePages: false
        },

        // Extracted projects
        projects: [],
        projectCount: 0,

        error: null
    };

    try {
        // Verify we're on a queue page
        if (!window.location.href.includes('/workQueue/')) {
            result.error = 'Not on a work queue page. Navigate to /workQueue/{ID}?smartlistId={ID} first.';
            return JSON.stringify(result, null, 2);
        }

        // Extract queue and smartlist IDs from URL
        const queueMatch = window.location.href.match(/\/workQueue\/(\d+)/);
        const smartlistMatch = window.location.href.match(/smartlistId=(\d+)/);
        result.queueId = queueMatch ? queueMatch[1] : null;
        result.smartlistId = smartlistMatch ? smartlistMatch[1] : null;

        // Get pagination info (format: "1-100 of 149")
        const pageText = document.body.innerText;
        const paginationMatch = pageText.match(/(\d+)-(\d+)\s+of\s+(\d+)/i);

        if (paginationMatch) {
            result.pagination.start = parseInt(paginationMatch[1]);
            result.pagination.end = parseInt(paginationMatch[2]);
            result.pagination.total = parseInt(paginationMatch[3]);
            result.pagination.hasMorePages = result.pagination.end < result.pagination.total;
        }

        // Find the queue table/list
        // Try multiple selectors as Albatross UI may vary
        const tableRows = document.querySelectorAll('table tbody tr');
        const queueItems = document.querySelectorAll('.queue-item, .project-row, [class*="queue-row"]');
        const rows = tableRows.length > 0 ? tableRows : queueItems;

        // Also try to find links to project pages
        const projectLinks = document.querySelectorAll('a[href*="/project/"]');

        // Extract from table rows
        for (const row of rows) {
            const project = {
                id: null,
                name: null,
                statusType: null,
                daysInQueue: null,
                owner: null,
                utility: null,
                stage: null,
                activeProcessSteps: null,
                tags: [],
                notePreview: null
            };

            const rowText = row.innerText;
            const rowTextUpper = rowText.toUpperCase();

            // Extract project ID (6-7 digit number, usually linked)
            const linkInRow = row.querySelector('a[href*="/project/"]');
            if (linkInRow) {
                const idMatch = linkInRow.href.match(/\/project\/(\d+)/);
                if (idMatch) project.id = idMatch[1];
            }

            // Fallback: find ID in row text
            if (!project.id) {
                const idMatch = rowText.match(/\b(\d{6,7})\b/);
                if (idMatch) project.id = idMatch[1];
            }

            // Project name (usually first cell or linked text)
            const nameEl = row.querySelector('.project-name, [class*="name"] a, td:first-child a');
            if (nameEl) {
                project.name = nameEl.innerText.trim().split('\n')[0];
            }

            // Status type
            if (rowTextUpper.includes('HELD')) {
                project.statusType = 'HELD';
            } else if (rowTextUpper.includes('ACTIVE')) {
                project.statusType = 'ACTIVE';
            }

            // Days in queue
            const daysMatch = rowText.match(/\b(\d{1,4})\s*(?:days?|d\b)/i);
            if (daysMatch) {
                project.daysInQueue = parseInt(daysMatch[1]);
            }

            // Owner (look for known names)
            const ownerPatterns = ['Rachel', 'Daniel', 'Ben', 'Jacob', 'Cody', 'BMM', 'Hatch', 'Kron', 'Myles', 'Cook', 'Baxter'];
            for (const pattern of ownerPatterns) {
                if (rowText.includes(pattern)) {
                    // Find the full name
                    const ownerMatch = rowText.match(new RegExp(`(${pattern}[\\s\\w-]*?)(?:\\s{2,}|$|\\t)`, 'i'));
                    if (ownerMatch) {
                        project.owner = ownerMatch[1].trim();
                        break;
                    }
                }
            }

            // Utility (look for common patterns)
            const utilityPatterns = ['PG&E', 'SCE', 'SDG&E', 'Xcel', 'Duke', 'ComEd', 'DTE', 'Evergy', 'AES', 'First Energy', 'NV Energy', 'Consumers'];
            for (const pattern of utilityPatterns) {
                if (rowTextUpper.includes(pattern.toUpperCase())) {
                    project.utility = pattern;
                    break;
                }
            }

            // Stage
            const stages = ['Design', 'Installation Prep', 'Installation', 'Inspection', 'Energization'];
            for (const stage of stages) {
                if (rowTextUpper.includes(stage.toUpperCase())) {
                    project.stage = stage;
                    break;
                }
            }

            // Tags (badges)
            const tagEls = row.querySelectorAll('.tag, .badge, .label, [class*="tag"]');
            tagEls.forEach(el => {
                const tagText = el.innerText.trim();
                if (tagText && tagText.length < 30) {
                    project.tags.push(tagText);
                }
            });

            // Check for critical tags in text
            if (rowTextUpper.includes('ESCALAT')) project.tags.push('Escalated');
            if (rowTextUpper.includes('LEGAL')) project.tags.push('Legal');
            if (rowTextUpper.includes('ITC')) project.tags.push('ITC');

            // Note preview if visible
            const noteEl = row.querySelector('.note-preview, .note-content, [class*="note"]');
            if (noteEl) {
                project.notePreview = noteEl.innerText.trim().substring(0, 200);
            }

            // Only add if we have a project ID
            if (project.id) {
                result.projects.push(project);
            }
        }

        // Fallback: extract from project links if table didn't work
        if (result.projects.length === 0 && projectLinks.length > 0) {
            const seen = new Set();
            projectLinks.forEach(link => {
                const idMatch = link.href.match(/\/project\/(\d+)/);
                if (idMatch && !seen.has(idMatch[1])) {
                    seen.add(idMatch[1]);
                    result.projects.push({
                        id: idMatch[1],
                        name: link.innerText.trim().split('\n')[0] || null,
                        statusType: null,
                        daysInQueue: null,
                        owner: null,
                        utility: null,
                        stage: null,
                        tags: [],
                        notePreview: null
                    });
                }
            });
        }

        result.projectCount = result.projects.length;
        result.success = result.projectCount > 0;

        if (result.projectCount === 0) {
            result.warning = 'No projects extracted. Page may still be loading or structure changed.';
        }

    } catch (e) {
        result.error = 'Extraction error: ' + e.message;
        result.success = false;
    }

    return JSON.stringify(result, null, 2);
})();
