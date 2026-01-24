// Navigate + Wait + Extract Combo Workflow
// Bundles: check page ready → wait if needed → extract data → return structured result
// Execute via javascript_tool after navigation completes
//
// This script handles the common pattern of:
// 1. Page navigated to
// 2. Wait for dynamic content to load
// 3. Extract relevant data
// 4. Return in structured format
//
// Usage:
//   1. navigate(url)
//   2. javascript_tool: this script
//   3. If not ready, wait and retry once

(function() {
    const result = {
        workflow: 'navigate_extract',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ready: false,
        waitRecommendation: null,
        data: null,
        error: null
    };

    try {
        // Step 1: Check document ready state
        const docReady = document.readyState === 'complete';

        // Step 2: Check for loading indicators
        const loadingSelectors = [
            '.spinner', '.loading', '[class*="loading"]', '[class*="spinner"]',
            '.slds-spinner', '.skeleton', '[class*="skeleton"]',
            '[aria-busy="true"]', '.progress', '[class*="progress"]'
        ];

        let hasLoading = false;
        for (const sel of loadingSelectors) {
            const el = document.querySelector(sel);
            if (el && isVisible(el)) {
                hasLoading = true;
                break;
            }
        }

        // Step 3: Check for content presence
        const contentIndicators = [
            // Generic
            'main', 'article', '.content', '.main-content', '#content',
            // Tables/lists (data loaded)
            'table tbody tr', '.list-item', '.card', '.row',
            // Portal specific
            '.project-content', '.queue-content', '.application-form',
            '.slds-page-header', '.oneContent', '.dashboard'
        ];

        let hasContent = false;
        for (const sel of contentIndicators) {
            if (document.querySelector(sel)) {
                hasContent = true;
                break;
            }
        }

        // Determine readiness
        result.ready = docReady && !hasLoading && hasContent;

        if (!result.ready) {
            result.waitRecommendation = hasLoading ? 'Wait 2-3 seconds for loading to complete' :
                                        !hasContent ? 'Wait 2-3 seconds for content to load' :
                                        'Wait for document ready state';
            // Still extract what we can
        }

        // Step 4: Detect page type and extract accordingly
        const url = window.location.href.toLowerCase();
        const pageType = detectPageType(url);
        result.pageType = pageType;

        // Step 5: Extract data based on page type
        switch (pageType) {
            case 'albatross_project':
                result.data = extractAlbatrossProject();
                break;
            case 'albatross_queue':
                result.data = extractAlbatrossQueue();
                break;
            case 'salesforce_record':
                result.data = extractSalesforceRecord();
                break;
            case 'powerclerk':
                result.data = extractPowerClerk();
                break;
            default:
                result.data = extractGeneric();
        }

        result.success = result.ready && result.data !== null;

    } catch (e) {
        result.error = `Extraction error: ${e.message}`;
    }

    return JSON.stringify(result, null, 2);

    // Helper functions

    function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               el.offsetParent !== null;
    }

    function detectPageType(url) {
        if (url.includes('albatross') && url.includes('/project/')) return 'albatross_project';
        if (url.includes('albatross') && url.includes('/workqueue')) return 'albatross_queue';
        if (url.includes('salesforce') || url.includes('lightning.force.com')) return 'salesforce_record';
        if (url.includes('powerclerk')) return 'powerclerk';
        return 'generic';
    }

    function extractAlbatrossProject() {
        return {
            projectId: getText('.project-id, [data-project-id]'),
            projectName: getText('.project-name, h1'),
            stage: getText('.project-stage, .stage-badge'),
            status: getText('.status-badge, .status'),
            owner: getText('.owner, .assigned-to'),
            utility: getText('.utility, .utility-company'),
            daysInQueue: getText('.days-in-queue, .queue-days')
        };
    }

    function extractAlbatrossQueue() {
        const rows = document.querySelectorAll('.project-row, .queue-item, tbody tr');
        return {
            queueTitle: getText('h1, h2, .queue-title'),
            projectCount: rows.length,
            projects: Array.from(rows).slice(0, 10).map(row => ({
                name: getText('.project-name, td:first-child', row),
                id: getText('.project-id', row),
                status: getText('.status', row),
                days: getText('.days, .days-in-queue', row)
            }))
        };
    }

    function extractSalesforceRecord() {
        return {
            recordType: getText('.slds-page-header__name-title'),
            recordName: getText('.slds-page-header__title, h1'),
            fields: Array.from(document.querySelectorAll('.slds-form-element')).slice(0, 15).map(el => ({
                label: getText('.slds-form-element__label', el),
                value: getText('.slds-form-element__static, input, select', el)
            })).filter(f => f.label)
        };
    }

    function extractPowerClerk() {
        return {
            pageTitle: getText('h1, .page-title'),
            applicationId: getText('.application-id, [data-field="application-id"]'),
            status: getText('.application-status, .status-badge'),
            formFields: Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'))
                .slice(0, 20)
                .map(el => ({
                    name: el.name || el.id || el.placeholder,
                    type: el.type || el.tagName.toLowerCase(),
                    value: el.value,
                    required: el.required
                }))
                .filter(f => f.name)
        };
    }

    function extractGeneric() {
        return {
            title: document.title,
            h1: getText('h1'),
            formCount: document.querySelectorAll('form').length,
            inputCount: document.querySelectorAll('input:not([type="hidden"])').length,
            buttonCount: document.querySelectorAll('button').length,
            linkCount: document.querySelectorAll('a').length,
            tableCount: document.querySelectorAll('table').length
        };
    }

    function getText(selector, context = document) {
        const el = context.querySelector(selector);
        return el?.textContent?.trim() || null;
    }
})();
