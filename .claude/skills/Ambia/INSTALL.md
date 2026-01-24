# Ambia Skill - Installation Guide

## Quick Install

This skill requires no additional dependencies. It uses:
- Salesforce Lightning UI (via browser)
- TaskRay integration (via Salesforce)
- Google Drive connector (via Google Workspace)
- Gemini for Google Workspace (via Google Workspace)

## Verify Installation

### Test Salesforce Access
1. Log into Salesforce
2. Navigate to an Opportunity
3. Access TaskRay Project
4. Verify you can see IX tasks

### Test Google Drive Access
1. Verify Google Drive connector is configured
2. Test access to linked project folders
3. Verify Gemini for Google Workspace is available

## Platform-Specific Notes

### Windows
- All workflows tested on Windows 10/11
- Use Command Prompt or PowerShell
- Salesforce Lightning UI works in all modern browsers

### macOS
- Salesforce Lightning UI works in all modern browsers
- Google Drive connector works with Google Workspace

### Linux
- Salesforce Lightning UI works in all modern browsers
- Google Drive connector works with Google Workspace

## Testing the Skill

### Quick Test: Log an Approval
```
1. Log into Salesforce
2. Search for a test project (e.g., "2633 JORDAN")
3. Navigate to "Receive and Process IX Part 1" task
4. Create new task: "Interconnection: Approved"
5. Verify task is created and logged correctly
```

### Quick Test: Find a Project
```
1. Log into Salesforce
2. Search for a project address (e.g., "6455 MILANO")
3. Navigate to TaskRay Project → Related tab
4. Verify IX tasks are visible
5. Check task status and notes
```

### Quick Test: Update Task Owner
```
1. Log into Salesforce
2. Navigate to an IX task
3. Edit Owner field
4. Select new owner (e.g., "Tonia Crank")
5. Save and verify update
```

## Troubleshooting

### "Can't find project in Salesforce"
- Try searching without street suffix (e.g., "6455 MILANO" not "6455 MILANO ST")
- Check project code format: 4 digits + 3-4 letters (e.g., "3763MORR")
- Verify you're searching in the correct Salesforce instance

### "Can't access Google Drive"
- Verify Google Drive connector is configured
- Check that project folders are linked in Salesforce Opportunity
- Verify you have access to the linked folders

### "Can't find IX task"
- Check the "Related" tab on TaskRay Project page
- Verify task name contains "IX" (e.g., "Prepare IX Part 1")
- Check task status: Open, Holding, Completed, Inactive, Not Required

### "Task owner update fails"
- Verify you're on the IX Task page, not Project page
- Check owner name matches exactly (e.g., "Tonia Crank" not "tonia crank")
- Ensure you have edit permissions on the task

## Next Steps

1. **Test workflows**: Try logging an approval or finding a project
2. **Customize**: Add utility-specific profiles as needed
3. **Extend**: Add new workflows as business needs evolve

## Support

- **SKILL.md**: Main workflow guide
- **README.md**: Complete documentation
- **QUICK_REFERENCE.md**: Quick reference card

---

**Status**: ✅ Ready to Use  
**Dependencies**: None (uses Salesforce, TaskRay, Google Drive integrations)  
**Last Updated**: 2025
