// Albatross Project Data Extraction Workflow
// Bundles: verify page → wait for content → extract all key fields → return structured data
// Execute via javascript_tool after navigating to project URL
//
// Usage:
//   1. navigate("https://albatross.myblueraven.com/project/{ID}/status")
//   2. javascript_tool: this script
//   3. Returns structured project data

(function() {
    const result = {
        workflow: 'albatross_project_extract',
        success: false,
        ready: false,
        project: null,
        error: null
    };

    try {
        // Step 1: Verify we're on a project page
        const url = window.location.href;
        if (!url.includes('/project/')) {
            result.error = 'Not on a project page. Navigate to /project/{id}/status first.';
            return JSON.stringify(result, null, 2);
        }

        // Extract project ID from URL
        const projectIdMatch = url.match(/\/project\/(\d+)/);
        const projectIdFromUrl = projectIdMatch ? projectIdMatch[1] : null;

        // Step 2: Check page readiness
        const isLoading = document.querySelector('.spinner, .loading, [class*="loading"]:not(.loaded)');
        const hasContent = document.querySelector('.project-content, .main-content, [class*="project"]');

        if (isLoading || !hasContent) {
            result.ready = false;
            result.error = 'Project content still loading. Wait 2-3 seconds and retry.';
            return JSON.stringify(result, null, 2);
        }
        result.ready = true;

        // Step 3: Extract all available project data
        const project = {
            id: null,
            name: null,
            stage: null,
            status: null,
            statusType: null,
            owner: null,
            utility: null,
            address: null,
            customer: null,
            systemSize: null,
            daysInQueue: null,
            activeProcessSteps: [],
            tags: [],
            recentNotes: []
        };

        // Project ID - try multiple sources
        project.id = projectIdFromUrl ||
            document.querySelector('.project-id, [data-project-id]')?.textContent?.trim() ||
            document.querySelector('[class*="project-id"]')?.textContent?.trim();

        // Project Name
        project.name = document.querySelector('.project-name, h1.project-title, h1')?.textContent?.trim();

        // Stage and Status
        project.stage = document.querySelector('.project-stage, .stage-badge, [class*="stage"]')?.textContent?.trim();
        project.status = document.querySelector('.status-badge, .status, [class*="status-type"]')?.textContent?.trim();

        // Determine if HELD/ACTIVE
        const statusEl = document.querySelector('.status-type, [class*="held"], [class*="active"]');
        if (statusEl) {
            const statusText = statusEl.textContent?.toLowerCase() || '';
            project.statusType = statusText.includes('held') ? 'HELD' :
                                 statusText.includes('active') ? 'ACTIVE' : 'unknown';
        }

        // Owner
        project.owner = document.querySelector('.owner, .owner-name, .assigned-to, [class*="owner"]')?.textContent?.trim();

        // Utility
        project.utility = document.querySelector('.utility, .utility-company, [class*="utility"]')?.textContent?.trim();

        // Address
        project.address = document.querySelector('.address, .service-address, [class*="address"]')?.textContent?.trim();

        // Customer
        project.customer = document.querySelector('.customer, .customer-name, [class*="customer"]')?.textContent?.trim();

        // System Size
        const sizeEl = document.querySelector('.system-size, [class*="system-size"], [class*="kw"]');
        if (sizeEl) {
            project.systemSize = sizeEl.textContent?.trim();
        }

        // Days in Queue
        const daysEl = document.querySelector('.days-in-queue, .queue-days, [class*="days"]');
        if (daysEl) {
            const daysMatch = daysEl.textContent?.match(/\d+/);
            project.daysInQueue = daysMatch ? parseInt(daysMatch[0]) : null;
        }

        // Active Process Steps (blockers)
        const processSteps = document.querySelectorAll('.process-step, .active-step, [class*="process-step"]');
        project.activeProcessSteps = Array.from(processSteps).slice(0, 5).map(step => ({
            name: step.querySelector('.step-name, .name')?.textContent?.trim() || step.textContent?.trim(),
            status: step.querySelector('.step-status, .status')?.textContent?.trim()
        })).filter(s => s.name);

        // Tags
        const tags = document.querySelectorAll('.tag, .label, [class*="tag"]:not([class*="stage"])');
        project.tags = Array.from(tags).map(tag => tag.textContent?.trim()).filter(Boolean).slice(0, 10);

        // Recent Notes (first 3)
        const notes = document.querySelectorAll('.note-item, .activity-item, [class*="note"]');
        project.recentNotes = Array.from(notes).slice(0, 3).map(note => ({
            date: note.querySelector('.date, .timestamp, [class*="date"]')?.textContent?.trim(),
            author: note.querySelector('.author, .created-by, [class*="author"]')?.textContent?.trim(),
            content: note.querySelector('.content, .note-text, .note-content')?.textContent?.trim()?.substring(0, 200)
        })).filter(n => n.content);

        result.project = project;
        result.success = true;

        // Quality check - warn if minimal data extracted
        const fieldsFound = Object.values(project).filter(v => v !== null && v !== undefined &&
            (Array.isArray(v) ? v.length > 0 : true)).length;

        if (fieldsFound < 4) {
            result.warning = 'Limited data extracted. Page structure may have changed - check selectors.';
        }

    } catch (e) {
        result.error = `Extraction error: ${e.message}`;
        result.success = false;
    }

    return JSON.stringify(result, null, 2);
})();
