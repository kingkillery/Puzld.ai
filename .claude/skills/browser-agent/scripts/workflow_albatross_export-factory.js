// Albatross Queue Export Workflow
// Bundles: wait for page ready → find export button → click → confirm download
// Execute via javascript_tool after navigating to queue URL
//
// Usage:
//   1. navigate("https://albatross.myblueraven.com/workQueue/38?smartlistId=2246")
//   2. javascript_tool: this script
//   3. File downloads automatically

(function() {
    const result = {
        workflow: 'albatross_export',
        success: false,
        steps: [],
        error: null
    };

    try {
        // Step 1: Verify we're on a queue page
        const url = window.location.href;
        if (!url.includes('workQueue')) {
            result.error = 'Not on a workQueue page. Navigate to queue first.';
            return JSON.stringify(result, null, 2);
        }
        result.steps.push({ step: 'verify_page', status: 'ok', url });

        // Step 2: Check for loading indicators
        const isLoading = document.querySelector('.spinner, .loading, [class*="loading"]');
        if (isLoading) {
            result.error = 'Page still loading. Wait and retry.';
            result.steps.push({ step: 'check_loading', status: 'waiting' });
            return JSON.stringify(result, null, 2);
        }
        result.steps.push({ step: 'check_loading', status: 'ok' });

        // Step 3: Find export button (multiple selector strategies)
        const exportSelectors = [
            'button:contains("Export")',
            '[class*="export"]',
            'button[title*="export" i]',
            'a[href*="export"]',
            'button[aria-label*="export" i]'
        ];

        let exportButton = null;

        // Try text content match first (most reliable)
        const buttons = document.querySelectorAll('button, a.btn, [role="button"]');
        for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase() || '';
            if (text.includes('export')) {
                exportButton = btn;
                break;
            }
        }

        // Fallback to selector-based search
        if (!exportButton) {
            for (const selector of exportSelectors) {
                try {
                    exportButton = document.querySelector(selector);
                    if (exportButton) break;
                } catch (e) {
                    // Invalid selector, skip
                }
            }
        }

        if (!exportButton) {
            result.error = 'Export button not found. Try scrolling or check page state.';
            result.steps.push({ step: 'find_export', status: 'not_found' });
            return JSON.stringify(result, null, 2);
        }
        result.steps.push({ step: 'find_export', status: 'found', element: exportButton.textContent?.trim() });

        // Step 4: Check if button is enabled
        if (exportButton.disabled || exportButton.getAttribute('aria-disabled') === 'true') {
            result.error = 'Export button is disabled. Queue may be empty or still loading.';
            result.steps.push({ step: 'check_enabled', status: 'disabled' });
            return JSON.stringify(result, null, 2);
        }
        result.steps.push({ step: 'check_enabled', status: 'ok' });

        // Step 5: Click export button
        exportButton.click();
        result.steps.push({ step: 'click_export', status: 'clicked' });

        // Step 6: Report success
        result.success = true;
        result.message = 'Export triggered. CSV download should start automatically.';

        // Step 7: Capture queue info for logging
        const queueTitle = document.querySelector('h1, h2, .queue-title, .page-title')?.textContent?.trim();
        const projectCount = document.querySelectorAll('.project-row, .queue-item, tbody tr').length;
        result.queueInfo = {
            title: queueTitle,
            projectCount: projectCount,
            url: url
        };

    } catch (e) {
        result.error = `Workflow error: ${e.message}`;
        result.success = false;
    }

    return JSON.stringify(result, null, 2);
})();
