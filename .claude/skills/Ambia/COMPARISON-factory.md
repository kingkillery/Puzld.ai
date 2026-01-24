# Ambia Skill Comparison: Old (Zipped) vs New (Organized)

**Analysis Date**: 2025-11-12
**Old Version**: From Ambia.zip (698 lines of SKILL.md)
**New Version**: Just reorganized (364 lines of SKILL.md)

---

## Summary

The **old version (zipped) is significantly more comprehensive** with 698 lines of SKILL.md covering advanced technical patterns, operational procedures, and Gemini-specific search queries. The **new organized version simplifies workflows** and adds better file navigation but loses substantial technical depth.

### Key Difference

| Aspect | Old Version | New Version |
|--------|------------|------------|
| **SKILL.md lines** | 698 | 364 |
| **Technical depth** | ⭐⭐⭐⭐⭐ Advanced | ⭐⭐⭐ Intermediate |
| **Organization** | Flat (1 folder) | Hierarchical (4 folders) |
| **Navigation** | No index | INDEX.md guide |
| **Beginner friendly** | Complex | Simpler |
| **Advanced features** | Yes | Partially |

---

## What the Old Version Had (That's Missing Now)

### 1. **YAML Metadata Header**
```yaml
---
name: ambia
description: Interconnection Project Coordinator for Ambia...
---
```
**Purpose**: Skill configuration metadata
**Status**: ⚠️ MISSING - should be restored

### 2. **Work Modes Section**
Explicit definition of two operating modes:
- **Act**: Fill portal pages, update Salesforce fields, attach docs
- **ContextGathering**: Retrieve and summarize key info; do not alter records

**Value**: Clear operational boundaries
**Status**: ⚠️ MISSING

### 3. **Gemini Drive Fast-Scan with Specific Queries**
The old version had actual Gemini search query templates:
```
Q1: `project:{OpportunityName OR street + ZIP} type:pdf OR type:png OR type:jpg`
Q2: `name:(utility OR bill)` (png|pdf)
Q3: `name:(insurance OR HOI OR COI)` (pdf)
Q4: `name:(one-line OR single line OR SLD OR diagram)` (pdf)
Q5: `name:(placard OR placards)` (pdf|png)
Q6: `site survey OR site-survey OR survey` (folder|pdf)
```

**Value**: Agents know exactly what to search for
**Status**: ⚠️ MISSING

### 4. **Portal Guard Technical Details**
Old version had specific domain patterns:
- For Ameren Illinois: `https://amerenillinoisinterconnect.powerclerk.com/*`
- Authentication failure procedures
- MFA and reset flow

**Value**: Security safeguards with clear auth procedures
**Status**: ⚠️ PARTIALLY MISSING (domain rules present, auth flow missing)

### 5. **Tool Preambles Contract**
Explicit contract for tool usage:
- **Purpose**: One line explanation
- **Inputs**: Exact IDs/paths/URLs
- **Expected output**: What to expect
- **Success check**: Verifiable condition

**Value**: Enforces consistent, traceable tool usage
**Status**: ⚠️ MISSING

### 6. **Reasoning Effort Levels**
Three explicit levels with triggers:
- **Minimal**: Read-only, single-field updates, log notes
- **Medium** (default): Multi-field updates, single portal page
- **High**: Missing docs, conflicts, multi-page filing

**Value**: Guides performance/cost trade-offs
**Status**: ⚠️ MISSING

### 7. **Verbosity Settings**
- **Low**: By default
- **Medium**: Short context summaries and Plan
- **High**: Only inside per-page Field/Attachment Maps

**Value**: Prevents verbose responses
**Status**: ⚠️ MISSING

### 8. **Page Rubric for Portal Navigation**
Structured framework for every portal page:
```
- Field Map: portal_field → value → source
- Attachment Map: requirement → file → Drive link → status
- Gaps: missing → retrieval plan → Assumption line
- Validation: rule satisfied? yes/no with evidence
```

**Value**: Systematic, repeatable portal navigation
**Status**: ⚠️ PARTIALLY MISSING

### 9. **Idempotence and Duplicate Defense**
Explicit rules for avoiding duplicates:
- Read-before-write pattern
- Check for prior Application IDs
- Log no-op if unchanged

**Value**: Prevents accidental duplicates
**Status**: ⚠️ MISSING

### 10. **TaskRay Navigation Patterns**
Critical technical details:
- `/related/TASKRAY__Tasks__r/view` URL pattern
- Task ID prefix filtering (`a03US` vs `00T`/`00TD`)
- Related tab navigation steps

**Value**: Precise navigation without failures
**Status**: ⚠️ MISSING

### 11. **Decision Tree**
Comprehensive decision tree covering 6+ workflow branches with exact decision points

**Value**: Helps agents choose correct workflow
**Status**: ⚠️ MISSING (simplified version added)

### 12. **Workflow 4: Extract Log Reviews from IX Tasks**
Detailed 6-phase workflow for audit/analysis:
- Navigate to TaskRay Project
- Access TaskRay Tasks Related List
- Identify ALL IX tasks
- Extract log reviews from each task
- Consolidate and summarize
- Quality checks

**Value**: Enables complex audit workflows
**Status**: ⚠️ MISSING

### 13. **Responses API Reuse**
Reference to reuse previous response reasoning:
- Avoids re-summarizing unchanged guides
- Improves efficiency with `previous_response_id`

**Value**: Reduces context overhead
**Status**: ⚠️ MISSING

### 14. **Ameren Illinois Detailed Profile**
Specific utility profile with:
- Portal URL
- Application types
- Core IDs (Customer #, Meter #)
- Required uploads list
- Common blockers
- Fees and payment methods
- Submission artifacts
- Post-submit procedures

**Value**: Utility-ready execution
**Status**: ⚠️ PARTIALLY MISSING (referenced in /docs/references/)

### 15. **Execution Rules Enforcement**
Explicit rules:
- Always return Action Plan + Log Review Entry
- Submitted = Open; Approved/Follow Up = Completed
- Enforce Submission Gate

**Value**: Consistent execution patterns
**Status**: ⚠️ MISSING

### 16. **Troubleshooting Section**
Detailed troubleshooting for TaskRay navigation failures with fallback procedures

**Value**: Helps agents recover from failures
**Status**: ⚠️ MISSING

---

## What the New Version Added

### 1. **INDEX.md - File Navigation Guide**
- Complete file index with descriptions
- Quick lookup by task type
- File relationship map

**Value**: Easy orientation for new users
**Status**: ✅ NEW

### 2. **Organized Directory Structure**
```
/docs/       - Reference materials
/examples/   - Code examples
/config/     - Configuration files
```

**Value**: Professional organization, scalability
**Status**: ✅ NEW

### 3. **Simplified Workflows**
- Easier to understand for beginners
- Removed technical jargon
- Added checklist format

**Value**: Lower barrier to entry
**Status**: ✅ NEW (but less comprehensive)

### 4. **Navigation Enhancements**
- Updated README with directory map
- Quick navigation hints at top of docs
- Clearer section organization

**Value**: Better UX for finding things
**Status**: ✅ NEW

---

## Detailed Feature Comparison

### Gemini Integration
| Feature | Old | New |
|---------|-----|-----|
| Specific search queries | ✅ Yes (6 templates) | ❌ No |
| Document quality assessment | ✅ Yes (detailed) | ⚠️ Brief |
| Attachment map format | ✅ Yes (exact) | ✅ Yes (simplified) |
| Completeness validation template | ✅ Yes | ❌ No |

### TaskRay Navigation
| Feature | Old | New |
|---------|-----|-----|
| /related/TASKRAY__Tasks__r/view pattern | ✅ Yes | ❌ No |
| Task ID prefix filtering (a03US) | ✅ Yes | ❌ No |
| Related list troubleshooting | ✅ Yes (detailed) | ❌ No |
| Standard Salesforce vs TaskRay task distinction | ✅ Yes | ❌ No |

### Portal Navigation
| Feature | Old | New |
|---------|-----|-----|
| Page Rubric framework | ✅ Yes (detailed) | ⚠️ Mentioned |
| Field Map format | ✅ Yes (exact) | ❌ No |
| Validation Gate checklist | ✅ Yes | ✅ Yes |
| Portal Guard security | ✅ Yes (detailed) | ✅ Basic |

### Advanced Features
| Feature | Old | New |
|---------|-----|-----|
| Reasoning effort levels | ✅ Yes | ❌ No |
| Verbosity settings | ✅ Yes | ❌ No |
| Idempotence rules | ✅ Yes | ❌ No |
| Duplicate defense | ✅ Yes | ❌ No |
| Tool preambles contract | ✅ Yes | ❌ No |
| Responses API reuse | ✅ Yes | ❌ No |

### Workflows Covered
| Workflow | Old | New |
|----------|-----|-----|
| Log Interconnection Approval | ✅ 5 phases | ✅ 5 steps |
| Salesforce Search | ✅ Detailed (6 phases) | ✅ Simplified (5 steps) |
| Update Task Owner | ✅ Yes | ✅ Yes |
| Prepare Application | ✅ 4 phases + Gemini | ✅ 4 phases (simplified) |
| Extract Log Reviews | ✅ Yes (6 phases, detailed) | ❌ No |

### Operational Details
| Feature | Old | New |
|---------|-----|-----|
| Decision tree | ✅ Yes (comprehensive) | ⚠️ Simplified |
| Work modes (Act/ContextGathering) | ✅ Yes | ❌ No |
| Execution path selector | ✅ Yes | ❌ No |
| Context gathering budget | ✅ Yes (explicit) | ❌ No |
| Early-stop criteria | ✅ Yes | ❌ No |
| Reasoning instructions | ✅ Yes (3 levels) | ❌ No |

---

## Recommendation: Merge Both Versions

The **best approach** is to merge the comprehensive old SKILL.md back into the new organized structure:

### Steps to Restore Full Capability

1. **Restore YAML Metadata** to SKILL.md header
2. **Add back Gemini Drive Fast-Scan section** with query templates
3. **Restore TaskRay Technical Details**:
   - /related/TASKRAY__Tasks__r/view pattern
   - Task ID prefix filtering (a03US vs 00T)
   - Related list troubleshooting
4. **Add Tool Preambles contract** section
5. **Add Reasoning Effort levels** and Verbosity settings
6. **Add Workflow 4: Extract Log Reviews** (detailed)
7. **Add Idempotence and Duplicate Defense** rules
8. **Restore full Ameren Illinois profile** from /docs/references/
9. **Restore Decision Tree** (comprehensive version)
10. **Add Troubleshooting section** from old version

### What to Keep from New Organization

- ✅ Directory structure (/docs, /examples, /config)
- ✅ INDEX.md navigation guide
- ✅ Updated README with structure
- ✅ Simplified workflow overviews (as secondary docs)

---

## Impact Assessment

### Loss of Technical Depth
**Impact**: High
The new version loses ~334 lines of critical technical guidance on:
- TaskRay URL patterns and ID filtering
- Gemini search query templates
- Advanced operational procedures
- Troubleshooting procedures

### Gain in Navigation
**Impact**: Moderate
The new organization provides:
- Better file discovery
- Professional structure
- Clearer role separation

### Net Result
**Assessment**: New organization is better for structure, but technical content should be restored to SKILL.md for production use.

---

## Action Items

### High Priority
- [ ] Restore old SKILL.md content (698 lines) to new organized directory
- [ ] Keep both old and new perspectives (simplified + detailed)
- [ ] Restore TaskRay technical patterns
- [ ] Restore Gemini search queries

### Medium Priority
- [ ] Restore Workflow 4 (Log Review Extraction)
- [ ] Add Reasoning Effort levels
- [ ] Add Idempotence rules
- [ ] Restore full Ameren Illinois profile

### Low Priority
- [ ] Document the merge process
- [ ] Create version notes
- [ ] Update examples with new patterns

---

## Files to Update

| File | Priority | Action |
|------|----------|--------|
| SKILL.md | 🔴 High | Merge old + new content |
| QUICK_REFERENCE.md | 🟡 Medium | Add TaskRay URL patterns |
| INDEX.md | 🟢 Low | Add references to advanced sections |
| /docs/references/ | 🔴 High | Restore Ameren Illinois full profile |
| README.md | 🟢 Low | Add note about skill capabilities |

---

## Conclusion

The **old version (zipped) is the authoritative, production-ready version** with comprehensive technical guidance. The **new organization is an improvement for discoverability**, but the technical content must be restored for proper operation.

**Recommendation**: Merge the old SKILL.md (comprehensive) into the new organized structure to get the best of both worlds:
- ✅ Full technical depth (old)
- ✅ Better file organization (new)
- ✅ Professional structure (new)
- ✅ Complete capability coverage (old)

**Time Estimate**: 30-45 minutes to merge and verify.
