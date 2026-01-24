// Albatross Bulk Notes Extraction - Full Project Notes Extractor
// Execute on: /project/{PROJECT_ID}/status or /project/{PROJECT_ID}/notes
//
// Purpose: Extract ALL notes and activities with comprehensive detail for bulk export.
// Returns structured JSON suitable for Google Sheets import.
//
// Usage:
//   1. navigate("https://albatross.myblueraven.com/project/{ID}/status")
//   2. wait 2-3 seconds for page load
//   3. javascript_tool: this script
//   4. Store result in extraction cache

(function() {
    const result = {
        workflow: 'albatross_bulk_notes',
        version: '1.0',
        timestamp: new Date().toISOString(),
        projectUrl: window.location.href,
        success: false,

        // Core project data
        projectId: null,
        customerName: null,
        utility: null,
        stage: null,
        statusType: null,
        daysInQueue: null,
        owner: null,

        // Tags and flags
        tags: [],
        flags: {
            hasDoNotTouch: false,
            hasLegalHold: false,
            hasEscalation: false,
            hasPaymentInfo: false,
            hasPANRS: false,
            hasRemovalReinstall: false,
            hasBackupBattery: false
        },

        // Notes data
        notes: [],
        noteCount: 0,
        latestNoteDate: null,
        latestNoteAuthor: null,
        responsibleParty: null,

        // Combined output for Google Sheets
        notesCombined: '',

        error: null
    };

    try {
        // Verify we're on a project page
        if (!window.location.href.includes('/project/')) {
            result.error = 'Not on a project page. Navigate to /project/{id}/status first.';
            return JSON.stringify(result, null, 2);
        }

        // Extract project ID from URL
        const urlMatch = window.location.href.match(/\/project\/(\d+)/);
        result.projectId = urlMatch ? urlMatch[1] : null;

        // Get full page text for pattern matching
        const pageText = document.body.innerText;
        const pageTextUpper = pageText.toUpperCase();

        // =====================================================
        // EXTRACT PROJECT HEADER INFO
        // =====================================================

        // Customer name from header
        const headerEl = document.querySelector('h1, .project-name, .customer-name');
        if (headerEl) {
            result.customerName = headerEl.innerText.trim().split('\n')[0].replace(/\s+/g, ' ');
        }

        // Utility company
        const utilityEl = document.querySelector('.utility, .utility-company, [class*="utility"]');
        if (utilityEl) {
            result.utility = utilityEl.innerText.trim();
        }

        // Project stage
        const stageEl = document.querySelector('.project-stage, .stage-badge, [class*="stage"]');
        if (stageEl) {
            result.stage = stageEl.innerText.trim();
        }

        // Status type (HELD/ACTIVE)
        if (pageTextUpper.includes('HELD')) {
            result.statusType = 'HELD';
        } else if (pageTextUpper.includes('ACTIVE')) {
            result.statusType = 'ACTIVE';
        }

        // Days in queue
        const daysMatch = pageText.match(/(\d+)\s*(?:days?\s*in\s*queue|Days?\s*In\s*Queue)/i);
        if (daysMatch) {
            result.daysInQueue = parseInt(daysMatch[1]);
        }

        // Owner
        const ownerEl = document.querySelector('.owner, .owner-name, .assigned-to');
        if (ownerEl) {
            result.owner = ownerEl.innerText.trim();
        }

        // =====================================================
        // EXTRACT TAGS AND CHECK FLAGS
        // =====================================================

        // Visual tags (badges)
        const tagEls = document.querySelectorAll('.tag, .badge, .label, [class*="tag"]:not([class*="stage"])');
        tagEls.forEach(el => {
            const tagText = el.innerText.trim();
            if (tagText && tagText.length < 50 && !result.tags.includes(tagText)) {
                result.tags.push(tagText);
            }
        });

        // Hashtags in text
        const hashtagMatches = pageText.match(/#[a-zA-Z0-9_-]+/g);
        if (hashtagMatches) {
            hashtagMatches.forEach(tag => {
                if (!result.tags.includes(tag)) result.tags.push(tag);
            });
        }

        // Check critical flags
        result.flags.hasDoNotTouch = pageTextUpper.includes('DO NOT TOUCH') ||
                                      pageTextUpper.includes('DO NOT FOLLOW UP');
        result.flags.hasLegalHold = pageTextUpper.includes('LEGAL INVOLVEMENT') ||
                                     pageTextUpper.includes('LEGAL HOLD');
        result.flags.hasEscalation = pageTextUpper.includes('ESCALAT');
        result.flags.hasPaymentInfo = pageTextUpper.includes('PAYMENT') ||
                                       pageTextUpper.includes('CHECK RECEIVED') ||
                                       pageTextUpper.includes('REFUND');
        result.flags.hasPANRS = pageTextUpper.includes('PANRS') ||
                                 pageTextUpper.includes('POST-ACTIVATION');
        result.flags.hasRemovalReinstall = pageTextUpper.includes('REMOVAL') &&
                                            pageTextUpper.includes('REINSTALL');
        result.flags.hasBackupBattery = pageTextUpper.includes('BACKUP BATTERY') ||
                                         pageTextUpper.includes('BATTERY ONLY');

        // =====================================================
        // EXTRACT ALL NOTES
        // =====================================================

        // Notes follow pattern: content followed by "Author, Role(Team) | MM/DD/YY H:MM am/pm"
        const lines = pageText.split('\n');
        let currentNoteLines = [];
        let noteIndex = 0;
        const combinedNoteParts = [];

        // Timestamp/author line pattern
        const authorLinePattern = /^([A-Za-z\s\-']+(?:,\s*[A-Za-z\s\-']+)?(?:\([^)]+\))?)\s*\|\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2}\s*[ap]m)/i;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check if this is an author/timestamp line
            const authorMatch = line.match(authorLinePattern);

            if (authorMatch || (line.includes(' | ') && line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/))) {
                // This is an author line - end of a note
                if (currentNoteLines.length > 0) {
                    const noteContent = currentNoteLines.join(' ').trim();

                    if (noteContent.length > 10) {
                        // Parse author info
                        let author = 'Unknown';
                        let dateStr = '';
                        let timeStr = '';

                        if (authorMatch) {
                            author = authorMatch[1].trim();
                            dateStr = authorMatch[2];
                            timeStr = authorMatch[3];
                        } else {
                            // Fallback parsing
                            const parts = line.split('|');
                            author = parts[0] ? parts[0].trim() : 'Unknown';
                            const dateTimeMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2}\s*[ap]m)/i);
                            if (dateTimeMatch) {
                                dateStr = dateTimeMatch[1];
                                timeStr = dateTimeMatch[2];
                            }
                        }

                        // Detect note type from content
                        let noteType = 'General';
                        let noteTag = null;
                        const upperContent = noteContent.toUpperCase();

                        if (noteContent.startsWith('#')) {
                            const tagMatch = noteContent.match(/^#([a-zA-Z0-9_-]+)/);
                            if (tagMatch) {
                                noteTag = '#' + tagMatch[1];
                                noteType = tagMatch[1].replace(/-/g, ' ');
                            }
                        }

                        if (upperContent.includes('FOLLOW-UP') || upperContent.includes('FOLLOW UP')) noteType = 'Follow-Up';
                        if (upperContent.includes('ESCALATION') || upperContent.includes('ESCALATED')) noteType = 'Escalation';
                        if (upperContent.includes('CASE EVENT')) noteType = 'Case Event';
                        if (upperContent.includes('INBOUND PHONE') || upperContent.includes('OUTBOUND')) noteType = 'Call Log';
                        if (upperContent.includes('IX APPLICATION')) noteType = 'IX Application';
                        if (upperContent.includes('PAYMENT') || upperContent.includes('CHECK')) noteType = 'Payment';

                        // Check if pinned (first notes with critical content)
                        const isPinned = noteIndex < 2 && (
                            upperContent.includes('DO NOT') ||
                            upperContent.includes('IMPORTANT') ||
                            upperContent.includes('CRITICAL')
                        );

                        const noteObj = {
                            index: noteIndex,
                            type: noteType,
                            tag: noteTag,
                            content: noteContent.substring(0, 2000),
                            author: author,
                            date: dateStr,
                            time: timeStr,
                            timestamp: dateStr + ' ' + timeStr,
                            isPinned: isPinned
                        };

                        result.notes.push(noteObj);

                        // Build combined string for Google Sheets
                        const combinedEntry = `[${dateStr} ${timeStr}] ${author}: ${noteContent.substring(0, 500)}`;
                        combinedNoteParts.push(combinedEntry);

                        // Track latest note info
                        if (noteIndex === 0) {
                            result.latestNoteDate = dateStr + ' ' + timeStr;
                            result.latestNoteAuthor = author;
                            result.responsibleParty = author;
                        }

                        noteIndex++;
                    }
                }
                currentNoteLines = [];
            } else if (
                line.length > 2 &&
                !line.includes('Add Note') &&
                !line.includes('Timeline') &&
                !line.includes('Topic') &&
                !line.match(/^(Project|Status|Stage|Owner|Utility|Address):$/i)
            ) {
                currentNoteLines.push(line);
            }
        }

        // Build combined notes string
        result.notesCombined = combinedNoteParts.join('\n---\n');
        result.noteCount = result.notes.length;
        result.success = true;

        // Quality warning if minimal data
        if (result.noteCount === 0) {
            result.warning = 'No notes extracted. The Notes panel may not be visible or page structure changed.';
        }

    } catch (e) {
        result.error = 'Extraction error: ' + e.message;
        result.success = false;
    }

    return JSON.stringify(result, null, 2);
})();
