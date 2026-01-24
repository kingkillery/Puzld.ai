// Batch Form Fill Workflow
// Bundles: find all fields → fill values → trigger validation → report results
// Execute via javascript_tool with field data passed as parameter
//
// Usage (in javascript_tool call):
//   const fields = {
//     'name': 'John Doe',
//     'email': 'john@example.com',
//     'phone': '555-1234',
//     'address': '123 Main St'
//   };
//   // Then include this script with fields defined above
//
// Alternative: Call with window.__formData set before execution

(function() {
    const result = {
        workflow: 'form_fill',
        success: false,
        fieldsAttempted: 0,
        fieldsFilled: 0,
        fieldsSkipped: [],
        fieldsFailed: [],
        validationErrors: [],
        error: null
    };

    // Get field data from various sources
    // Priority: function argument > window.__formData > empty
    const getFieldData = () => {
        if (typeof fields !== 'undefined') return fields;
        if (window.__formData) return window.__formData;
        return null;
    };

    const fieldData = getFieldData();

    if (!fieldData || Object.keys(fieldData).length === 0) {
        result.error = 'No field data provided. Set fields object or window.__formData before calling.';
        return JSON.stringify(result, null, 2);
    }

    try {
        const fieldEntries = Object.entries(fieldData);
        result.fieldsAttempted = fieldEntries.length;

        for (const [fieldKey, value] of fieldEntries) {
            if (value === null || value === undefined) {
                result.fieldsSkipped.push({ field: fieldKey, reason: 'null/undefined value' });
                continue;
            }

            // Find the field using multiple strategies
            let element = null;

            // Strategy 1: By ID
            element = document.getElementById(fieldKey);

            // Strategy 2: By name attribute
            if (!element) {
                element = document.querySelector(`[name="${fieldKey}"]`);
            }

            // Strategy 3: By data attribute
            if (!element) {
                element = document.querySelector(`[data-field="${fieldKey}"]`);
            }

            // Strategy 4: By label text (find label, then associated input)
            if (!element) {
                const labels = document.querySelectorAll('label');
                for (const label of labels) {
                    if (label.textContent?.toLowerCase().includes(fieldKey.toLowerCase())) {
                        const forId = label.getAttribute('for');
                        if (forId) {
                            element = document.getElementById(forId);
                        } else {
                            element = label.querySelector('input, select, textarea');
                        }
                        if (element) break;
                    }
                }
            }

            // Strategy 5: By placeholder text
            if (!element) {
                element = document.querySelector(`[placeholder*="${fieldKey}" i]`);
            }

            if (!element) {
                result.fieldsFailed.push({ field: fieldKey, reason: 'element not found' });
                continue;
            }

            // Fill based on element type
            const tagName = element.tagName.toLowerCase();
            const inputType = element.type?.toLowerCase();

            try {
                if (tagName === 'select') {
                    // Dropdown - find option by value or text
                    const options = element.querySelectorAll('option');
                    let matched = false;
                    for (const opt of options) {
                        if (opt.value === value || opt.textContent?.trim() === value) {
                            element.value = opt.value;
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        // Try partial match
                        for (const opt of options) {
                            if (opt.textContent?.toLowerCase().includes(value.toLowerCase())) {
                                element.value = opt.value;
                                matched = true;
                                break;
                            }
                        }
                    }
                    if (!matched) {
                        result.fieldsFailed.push({ field: fieldKey, reason: `option "${value}" not found` });
                        continue;
                    }
                } else if (inputType === 'checkbox') {
                    element.checked = Boolean(value);
                } else if (inputType === 'radio') {
                    // Find radio with matching value
                    const radios = document.querySelectorAll(`[name="${element.name}"]`);
                    for (const radio of radios) {
                        if (radio.value === value) {
                            radio.checked = true;
                            break;
                        }
                    }
                } else {
                    // Text input, textarea, etc.
                    element.focus();
                    element.value = value;
                }

                // Trigger events for React/Angular/Vue
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new Event('blur', { bubbles: true }));

                result.fieldsFilled++;

            } catch (fillError) {
                result.fieldsFailed.push({ field: fieldKey, reason: fillError.message });
            }
        }

        // Check for validation errors after filling
        const errorElements = document.querySelectorAll(
            '.error, .invalid, [class*="error"], [class*="invalid"], ' +
            '.field-error, .validation-error, [aria-invalid="true"]'
        );

        result.validationErrors = Array.from(errorElements)
            .map(el => el.textContent?.trim())
            .filter(Boolean)
            .slice(0, 10);

        // Determine success
        result.success = result.fieldsFilled > 0 && result.fieldsFailed.length === 0;

        // Summary
        result.summary = `Filled ${result.fieldsFilled}/${result.fieldsAttempted} fields. ` +
            `${result.fieldsFailed.length} failed, ${result.fieldsSkipped.length} skipped.`;

    } catch (e) {
        result.error = `Form fill error: ${e.message}`;
        result.success = false;
    }

    return JSON.stringify(result, null, 2);
})();
