// Check if page is ready for interaction
// Returns readiness status and any blockers
// Execute via javascript_tool

(function() {
    const checks = {
        documentReady: document.readyState === 'complete',
        noSpinners: !document.querySelector('.spinner, .loading, .slds-spinner, [class*="loading"]'),
        noOverlays: !document.querySelector('.modal-backdrop, .overlay:not([style*="display: none"])'),
        hasInteractiveElements: document.querySelectorAll('button, a, input, select').length > 0
    };

    // Check for common framework readiness
    const url = window.location.href;

    if (url.includes('salesforce') || url.includes('lightning')) {
        checks.lightningReady = !!document.querySelector('.slds-page-header, .oneContent');
        checks.noLightningSpinner = !document.querySelector('.slds-spinner_container:not(.slds-hide)');
    }

    if (url.includes('albatross')) {
        checks.albatrossReady = !!document.querySelector('.main-content, .project-content, .queue-content');
    }

    if (url.includes('powerclerk')) {
        checks.powerclerkReady = !!document.querySelector('.application-form, .dashboard, .project-list');
    }

    // Determine overall readiness
    const blockers = Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    const ready = blockers.length === 0;

    return JSON.stringify({
        ready: ready,
        blockers: blockers,
        checks: checks,
        recommendation: ready ? 'Page ready for interaction' :
            blockers.includes('noSpinners') ? 'Wait for loading to complete' :
            blockers.includes('noOverlays') ? 'Dismiss modal/overlay first' :
            'Wait and retry'
    }, null, 2);
})();
