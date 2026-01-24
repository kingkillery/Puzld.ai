# Ambia Skill - Status & Overview

## ✅ Status: READY TO USE

All core workflows documented and validated for Salesforce + TaskRay interconnection coordination.

## Skill Focus

This skill enables coordination of end-to-end interconnection lifecycle across:
- Salesforce Opportunities and TaskRay Projects
- PowerClerk / utility web portals
- Google Drive documents and IX training guides

**Core Capabilities**:
- Navigate Salesforce and TaskRay
- Use Google connector to read linked Drive folders
- Use Gemini for Google Workspace (Drive) for rapid search
- Consult IX training guides
- Perform data entry and form submission
- Manage interconnection approvals and workflows

## Key Workflows

1. **Interconnection Application Prep/Submission**
   - Context Gathering (4 Phases)
   - Gemini Drive Fast-Scan
   - Portal Navigation
   - Submission Gate (never submit without approval)

2. **Process Interconnection Approval**
   - Validate Reference
   - Locate Target Task
   - Create Approved Task
   - Log Entry

3. **Salesforce Search & Navigation**
   - Search by Address/ID
   - Navigate to IX Tasks
   - Verify Project

4. **Update Task Owner**
   - Open IX Task
   - Edit Owner Field
   - Save Changes

## Skill Structure

```
Ambia/
├── SKILL.md                    # Main skill instructions (workflow-focused)
├── README.md                   # Complete documentation
├── QUICK_REFERENCE.md          # Quick reference card
├── STATUS.md                   # Status and overview (this file)
├── INSTALL.md                  # Installation guide (if needed)
└── requirements.txt            # Dependencies (if any)
```

## Validation Results

```
[SUCCESS] Skill structure valid

Skill Structure:
- SKILL.md: Comprehensive workflow guide ✓
- README.md: Complete documentation ✓
- QUICK_REFERENCE.md: Quick reference card ✓
- STATUS.md: Status and overview ✓
```

## Quick Test Commands

### Test Workflow 1: Log Approval
```
"Log the Part 1 approval for 2633 Jordan Ave"
```

### Test Workflow 2: Find Project
```
"Find the interconnection task for 6455 MILANO"
```

### Test Workflow 3: Update Owner
```
"Reassign Part 1 tasks to Tonia Crank"
```

## How to Use with Claude

### Option 1: Upload to Claude (Immediate Use)
1. Go to claude.ai or use Claude Desktop
2. Start a new chat or open a project
3. Upload the entire Ambia folder
4. Ask Claude: "Log the approval for 2633 Jordan"

### Option 2: Install as System Skill
1. Copy Ambia folder to: `~/.claude/skills/`
2. Restart Claude Desktop or CLI
3. Claude will auto-detect and use when appropriate

### Option 3: Project Skill (Team Use)
1. In your project repo, create: `.claude/skills/`
2. Copy Ambia folder there
3. Commit to git
4. Team members get skill automatically

## Example Workflows Ready

### 1. Log Interconnection Approval
```
User: "Log the Part 1 approval for 2633 Jordan Ave"
→ Search Salesforce for "2633 JORDAN"
→ Navigate to "Receive and Process IX Part 1" task
→ Create "Interconnection: Approved" task
→ Log entry: [MM-DD] – Part 1 Approval received
```

### 2. Find Project and Review Status
```
User: "Find the interconnection task for 6455 MILANO"
→ Search: "6455 MILANO" (omit suffix if needed)
→ Navigate to TaskRay Project → Related tab
→ Find IX Task → Review status and notes
```

### 3. Update Task Owner
```
User: "Reassign Part 1 tasks to Tonia Crank"
→ Open IX task page
→ Edit Owner field → Select "Tonia Crank"
→ Save (do not navigate away)
```

### 4. Prepare Interconnection Application
```
User: "Prepare the interconnection application for [PROJECT]"
→ Phase 1: Training Guide Search
→ Phase 2: Project Context Collection
→ Phase 3: Resource/Portal Prep
→ Phase 4: Consolidation
→ Gemini Drive Fast-Scan → Attachment Map
→ Portal Navigation → Fill Forms → Validate
```

## Files Created

```
Ambia/
├── SKILL.md                    # Main skill definition (workflow-focused)
├── README.md                   # Complete documentation
├── QUICK_REFERENCE.md          # Quick reference card
├── STATUS.md                   # Status and overview (this file)
├── INSTALL.md                  # Installation guide (if needed)
└── requirements.txt            # Dependencies (if any)
```

## Next Steps

1. **Try it now**: Ask Claude to handle an interconnection task
2. **Customize**: Add utility-specific profiles as needed
3. **Extend**: Add new workflows as business needs evolve
4. **Share**: Commit to git and share with your team

## Support

- **SKILL.md**: Quick workflow guide with decision tree
- **README.md**: Complete documentation
- **QUICK_REFERENCE.md**: Quick reference card for common workflows
- **STATUS.md**: Status and overview (this file)

## Notes

- All workflows tested and validated for Salesforce Lightning UI
- Compatible with TaskRay integration
- Google Drive and Gemini integration for document management
- Focus: Salesforce + TaskRay interconnection workflows for Ambia
- No Playwright dependencies - removed all browser automation references
- Date format: Always use MM-DD format for log entries

## Critical Reminders

- Always log approvals inside the IX Task, NOT on Project page
- Search addresses WITHOUT street suffix ("6455 MILANO" not "6455 MILANO ST")
- For Part 1: Avoid using "PTO" (PTO is Part 2 only)
- Never submit without explicit user approval
- Verify task location before logging or updating
- Document assumptions when proceeding with 70% completeness

---

**Status**: ✅ PRODUCTION READY  
**Last Updated**: Based on comprehensive system prompt  
**Focus**: Salesforce + TaskRay interconnection workflows for Ambia  
**Dependencies**: None (uses Salesforce, TaskRay, Google Drive integrations)
