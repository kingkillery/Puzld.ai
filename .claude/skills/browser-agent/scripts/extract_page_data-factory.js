// Extract common data from current page
// Usage: Execute via javascript_tool in browser context

(function() {
    const result = {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString()
    };

    // Detect page type and extract relevant data
    const url = window.location.href;

    if (url.includes('powerclerk.com')) {
        result.portal = 'powerclerk';
        result.data = extractPowerClerkData();
    } else if (url.includes('albatross.myblueraven.com')) {
        result.portal = 'albatross';
        result.data = extractAlbatrossData();
    } else if (url.includes('salesforce.com') || url.includes('lightning.force.com')) {
        result.portal = 'salesforce';
        result.data = extractSalesforceData();
    } else {
        result.portal = 'unknown';
        result.data = extractGenericData();
    }

    return JSON.stringify(result, null, 2);

    function extractPowerClerkData() {
        return {
            applicationId: document.querySelector('.application-id, [data-field="application-id"]')?.textContent?.trim(),
            status: document.querySelector('.application-status, .status-badge')?.textContent?.trim(),
            customerName: document.querySelector('.customer-name, [data-field="customer"]')?.textContent?.trim(),
            address: document.querySelector('.service-address, [data-field="address"]')?.textContent?.trim(),
            systemSize: document.querySelector('.system-size, [data-field="system-size"]')?.textContent?.trim(),
            formFields: Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea')).map(el => ({
                name: el.name || el.id,
                type: el.type || el.tagName.toLowerCase(),
                value: el.value,
                required: el.required
            }))
        };
    }

    function extractAlbatrossData() {
        return {
            projectId: document.querySelector('.project-id, [data-project-id]')?.textContent?.trim(),
            projectName: document.querySelector('.project-name, h1')?.textContent?.trim(),
            stage: document.querySelector('.project-stage, .stage-badge')?.textContent?.trim(),
            status: document.querySelector('.status, .status-type')?.textContent?.trim(),
            owner: document.querySelector('.owner, .assigned-to')?.textContent?.trim(),
            utility: document.querySelector('.utility-company, .utility')?.textContent?.trim(),
            daysInQueue: document.querySelector('.days-in-queue, .queue-days')?.textContent?.trim(),
            notes: Array.from(document.querySelectorAll('.note-item, .activity-item')).slice(0, 3).map(note => ({
                date: note.querySelector('.date, .timestamp')?.textContent?.trim(),
                content: note.querySelector('.content, .note-text')?.textContent?.trim()
            }))
        };
    }

    function extractSalesforceData() {
        return {
            recordType: document.querySelector('.slds-page-header__name-title')?.textContent?.trim(),
            recordName: document.querySelector('.slds-page-header__title')?.textContent?.trim(),
            fields: Array.from(document.querySelectorAll('.slds-form-element')).slice(0, 20).map(field => ({
                label: field.querySelector('.slds-form-element__label')?.textContent?.trim(),
                value: field.querySelector('.slds-form-element__static, input, select')?.textContent?.trim() ||
                       field.querySelector('input, select')?.value
            })).filter(f => f.label && f.value)
        };
    }

    function extractGenericData() {
        return {
            headings: Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 5).map(h => h.textContent?.trim()),
            forms: document.querySelectorAll('form').length,
            inputs: document.querySelectorAll('input, select, textarea').length,
            buttons: Array.from(document.querySelectorAll('button, [type="submit"]')).map(b => b.textContent?.trim()).filter(Boolean).slice(0, 10)
        };
    }
})();
