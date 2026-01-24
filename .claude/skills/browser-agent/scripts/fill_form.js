// Batch fill form fields
// Usage: Pass fieldData as JSON object {fieldSelector: value, ...}
// Execute via javascript_tool with fieldData parameter

(function(fieldData) {
    if (!fieldData || typeof fieldData !== 'object') {
        return JSON.stringify({error: 'fieldData object required'});
    }

    const results = [];

    for (const [selector, value] of Object.entries(fieldData)) {
        try {
            const element = document.querySelector(selector);
            if (!element) {
                results.push({field: selector, status: 'not_found'});
                continue;
            }

            // Handle different input types
            const tagName = element.tagName.toLowerCase();
            const inputType = element.type?.toLowerCase();

            if (tagName === 'select') {
                // Dropdown
                element.value = value;
                element.dispatchEvent(new Event('change', {bubbles: true}));
                results.push({field: selector, status: 'set', type: 'select'});
            }
            else if (inputType === 'checkbox' || inputType === 'radio') {
                // Checkbox/Radio
                element.checked = Boolean(value);
                element.dispatchEvent(new Event('change', {bubbles: true}));
                results.push({field: selector, status: 'set', type: inputType});
            }
            else if (tagName === 'input' || tagName === 'textarea') {
                // Text input
                element.focus();
                element.value = value;
                element.dispatchEvent(new Event('input', {bubbles: true}));
                element.dispatchEvent(new Event('change', {bubbles: true}));
                element.blur();
                results.push({field: selector, status: 'set', type: tagName});
            }
            else {
                results.push({field: selector, status: 'unsupported_type', type: tagName});
            }
        } catch (e) {
            results.push({field: selector, status: 'error', message: e.message});
        }
    }

    return JSON.stringify({
        filled: results.filter(r => r.status === 'set').length,
        total: Object.keys(fieldData).length,
        results: results
    }, null, 2);
})
// Example usage:
// ({
//     '#customerName': 'John Doe',
//     '#email': 'john@example.com',
//     '#systemSize': '10.5',
//     '#utility': 'Ameren Illinois'
// })
