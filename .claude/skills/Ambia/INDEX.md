# Ambia Skill - File Index & Navigation Guide

**Version:** 1.1 (Merged & Enhanced) | **Status:** ✅ Production Ready

**Quick Navigation**: Use this guide to find the right resource for your task.

---

## 📚 Core Documentation (Start Here)

### **SKILL.md** - Main Workflow Guide
**What it is**: The complete skill definition with all workflows
**When to use**: As your primary reference for how to execute interconnection tasks
**Covers**: 5 main workflows + advanced features + critical rules + error handling + logging standards
**Key sections**:
- Quick Workflow Reference (table with all 5 workflows)
- Workflow 1: Log an Interconnection Approval
- Workflow 2: Salesforce Search Procedure
- Workflow 3: Update Task Owners
- Workflow 4: Prepare Interconnection Application
- Workflow 5: Extract Log Reviews from IX Tasks (NEW - for audit/analysis)
- Advanced Features: Gemini queries, TaskRay URL patterns, Tool Preambles, Reasoning Effort
- Context Gathering (4 phases + Gemini Fast-Scan)
- Logging Standards & Critical Rules
- Security Best Practices & Idempotence
- TaskRay Navigation & ID Filtering Patterns

### **README.md** - Complete Documentation
**What it is**: Comprehensive documentation with best practices and examples
**When to use**: When you want deeper context or best practice guidance
**Covers**: Full capabilities, integration details, state model, response format
**Best for**: Understanding the "why" behind workflows

### **QUICK_REFERENCE.md** - Quick Lookup Card
**What it is**: One-page cheat sheet for common tasks
**When to use**: During execution as a quick reference; bookmarks welcome
**Covers**: Command examples, checklist, common issues & fixes, pro tips
**Best for**: Quick answers without reading full docs

### **INSTALL.md** - Installation Guide
**What it is**: Setup instructions for installing the skill
**When to use**: First-time setup
**Covers**: System requirements, installation steps, verification

---

## 📁 Directory Structure

```
Ambia/
├── SKILL.md                    ← ⭐ START HERE (main workflow guide)
├── README.md                   ← Complete documentation
├── QUICK_REFERENCE.md          ← Quick cheat sheet
├── INSTALL.md                  ← Installation guide
├── INDEX.md                    ← You are here
│
├── /docs/                      ← Reference Materials & Analysis
│   ├── DSPY_ANALYSIS.md        ← DSPy integration analysis
│   ├── DSPY_PROMPTS.md         ← DSPy prompt templates
│   ├── DSPY_STRESS_TEST.md     ← Performance testing documentation
│   ├── DSPY_STRESS_TEST_RESULTS.md ← Test results
│   ├── EVALUATION_GUIDE.md     ← Evaluation procedures
│   ├── EVALUATION_SUMMARY.md   ← Summary of evaluations
│   ├── ENHANCEMENT_SUMMARY.txt ← Recent enhancements
│   ├── FIX_MOCK_RESPONSES.md   ← Mock response fixes
│   ├── LOG_REVIEW_EXTRACTION_GUIDE.md ← How to extract log entries
│   ├── SKILL_CONFIGURATION_AUDIT.md ← Skill configuration details
│   ├── evaluation_salesforce_tasks.xml ← Test case XML
│   │
│   └── /references/            ← Utility Training Guides & Resources
│       ├── utility-training-guides.md ← List of all 14 utilities with links
│       └── AMEREN_ILLINOIS_POWERCLERK.md ← Ameren Illinois specific guide
│
├── /examples/                  ← Code Examples & Helper Scripts
│   ├── example_dspy_usage.py   ← How to use DSPy with skill
│   ├── connect_cdp.py          ← CDP connection example
│   └── verify_evaluation.py    ← Verification script
│
└── /config/                    ← Configuration Files
    └── requirements.txt        ← Python dependencies (none currently)
```

---

## 🎯 How to Use This Skill

### For New Users
1. **Start with**: `SKILL.md` (main workflows)
2. **Then read**: `QUICK_REFERENCE.md` (for quick commands)
3. **For questions**: Check "Error Handling" section in `SKILL.md`

### For Quick Lookups During Work
1. Use `QUICK_REFERENCE.md` for:
   - Command examples
   - Checklists (before logging approval, etc.)
   - Common issues & fixes
   - Pro tips

### For Deep Dives
1. Use `README.md` for:
   - Best practices
   - Complete state model
   - Integration details
   - Response format expectations

### For Utility-Specific Information
1. Check `/docs/references/utility-training-guides.md` for:
   - List of all 14 supported utilities
   - Links to utility-specific training guides
   - Portal URLs and fees
   - Document requirements

---

## 📖 What's in Each Section

### Core Workflows (in SKILL.md)

| Workflow | Use When | Reference |
|----------|----------|-----------|
| Log an Approval | Recording Part 1 or Part 2 interconnection approval | Workflow 1 |
| Find a Project | Locating customer project in Salesforce | Workflow 2 |
| Update Task Owner | Reassigning IX task to team member | Workflow 3 |
| Prepare Application | Gathering docs for portal submission | Workflow 4 |
| Extract Log Reviews | Auditing project history, analyzing blockers | Workflow 5 (NEW) |

### Error Handling (in SKILL.md)
- Can't find project? → See **Error Handling** section
- Portal login fails? → See **Error Handling** section
- Task owner won't update? → See **Error Handling** section

### Critical Rules (in SKILL.md)
- **✅ ALWAYS Do These** (8 rules)
- **❌ NEVER Do These** (7 rules)
- **Security Best Practices**

---

## 🔍 Finding What You Need

### Task: Log an interconnection approval
1. **Quick version**: QUICK_REFERENCE.md → Workflow 1
2. **Full version**: SKILL.md → Workflow 1: Log an Interconnection Approval
3. **Examples**: SKILL.md → Examples in Action → Example 1

### Task: Find a project in Salesforce
1. **Quick version**: QUICK_REFERENCE.md → Workflow 2
2. **Full version**: SKILL.md → Workflow 2: Find a Project and Review Status
3. **Tips**: QUICK_REFERENCE.md → Pro Tips

### Task: Update task owner
1. **Quick version**: QUICK_REFERENCE.md → Workflow 3
2. **Full version**: SKILL.md → Workflow 3: Update Task Owner
3. **Checklist**: QUICK_REFERENCE.md → Before Updating Task Owner

### Task: Prepare interconnection application
1. **Quick version**: QUICK_REFERENCE.md → Workflow 4
2. **Full version**: SKILL.md → Workflow 4: Prepare Interconnection Application
3. **Advanced**: SKILL.md → Gemini Drive Fast-Scan section
4. **Deep dive**: README.md → Core Workflows → Interconnection Application Workflow

### Task: Extract log reviews (audit/analysis)
1. **Quick version**: QUICK_REFERENCE.md → Workflow 5: Extract Log Reviews
2. **Full version**: SKILL.md → Workflow 5: Extract Log Reviews from IX Tasks
3. **Advanced**: SKILL.md → Workflow 5: Phases 1-6, Common Pitfalls, Output Format

### Task: Find utility-specific requirements
1. **All utilities**: `/docs/references/utility-training-guides.md`
2. **Ameren Illinois**: `/docs/references/AMEREN_ILLINOIS_POWERCLERK.md`
3. **Other utilities**: Check training guides linked in utility-training-guides.md

### Question: What are the critical rules?
1. **Quick list**: QUICK_REFERENCE.md → Critical Rules
2. **Detailed**: SKILL.md → Critical Rules & Guardrails

### Issue: Something went wrong
1. **Error handling**: SKILL.md → Error Handling & Solutions
2. **Common issues**: QUICK_REFERENCE.md → Common Issues & Fixes
3. **More context**: README.md → Error Handling section

---

## 📚 Reference Materials (/docs/)

### Analysis & Integration
- **DSPY_ANALYSIS.md**: Analysis of DSPy integration possibilities
- **DSPY_PROMPTS.md**: Prompt templates in DSPy style
- **DSPY_STRESS_TEST.md**: Performance testing documentation
- **DSPY_STRESS_TEST_RESULTS.md**: Results from stress testing

### Evaluation & Testing
- **EVALUATION_GUIDE.md**: How to evaluate skill performance
- **EVALUATION_SUMMARY.md**: Summary of evaluation findings
- **evaluation_salesforce_tasks.xml**: XML test cases for Salesforce tasks
- **SKILL_CONFIGURATION_AUDIT.md**: Audit of skill configuration

### Implementation Details
- **FIX_MOCK_RESPONSES.md**: How mock responses are handled
- **LOG_REVIEW_EXTRACTION_GUIDE.md**: How to extract log entries from tasks
- **ENHANCEMENT_SUMMARY.txt**: Record of recent enhancements

### Utility Guides (/docs/references/)
- **utility-training-guides.md**: Index of 14 utilities with training guide links
- **AMEREN_ILLINOIS_POWERCLERK.md**: Specific guide for Ameren Illinois portal

---

## 🛠️ Code Examples (/examples/)

### example_dspy_usage.py
**Purpose**: Demonstrates how to use DSPy-style prompts with the skill
**When to use**: If you want to extend the skill with DSPy integration

### connect_cdp.py
**Purpose**: Example of connecting to Customer Data Platform
**When to use**: If integrating with external CDP systems

### verify_evaluation.py
**Purpose**: Script to verify skill evaluation
**When to use**: When testing skill performance

---

## ⚙️ Configuration (/config/)

### requirements.txt
**What**: Python package dependencies
**Current**: None (skill uses web-based tools only)
**Note**: Salesforce, TaskRay, Google Drive integrations are browser-based

---

## 🔄 File Relationships

```
SKILL.md (Main Reference)
    ↓
    ├→ QUICK_REFERENCE.md (Quick lookup of SKILL.md)
    ├→ README.md (Extended details for SKILL.md)
    ├→ INSTALL.md (How to set up SKILL.md)
    │
    └→ /docs/references/utility-training-guides.md (Utility-specific details)
        └→ /docs/references/AMEREN_ILLINOIS_POWERCLERK.md (Utility example)

/docs/ (Reference & Analysis)
    ├→ DSPY_ANALYSIS.md (Integration analysis)
    ├→ EVALUATION_GUIDE.md (Testing procedures)
    └→ /references/ (External guides & utilities)

/examples/ (Implementation Examples)
    ├→ example_dspy_usage.py
    ├→ connect_cdp.py
    └→ verify_evaluation.py

/config/ (Settings)
    └→ requirements.txt
```

---

## 📝 Version Info

**Ambia Skill Version**: 1.1 (Merged & Enhanced)
**Status**: ✅ Production Ready
**Last Updated**: 2025-11-12
**Focus**: Salesforce + TaskRay interconnection workflows + advanced operations

---

## 🎯 What's New in v1.1

### Major Enhancements

✅ **5 Core Workflows** (was 4)
- Added: Workflow 5 - Extract Log Reviews from IX Tasks

✅ **Advanced Features Restored**
- Gemini Drive Fast-Scan queries (6 templates)
- TaskRay URL patterns & ID filtering
- Tool Preambles contract
- Reasoning effort levels
- Idempotence & duplicate defense
- Page Rubric framework
- Security & credential handling

✅ **Better Organization**
- `/docs/` - Reference materials
- `/examples/` - Code samples
- `/config/` - Configuration
- INDEX.md - Navigation guide

---

## 🚀 Quick Start

1. **First time?** Read `SKILL.md` (main workflows)
2. **Quick lookup?** Use `QUICK_REFERENCE.md` (cheat sheet)
3. **Finding files?** Check `INDEX.md` (this guide)
4. **Need help?** Check `Error Handling` in SKILL.md
5. **Utility info?** Check `/docs/references/utility-training-guides.md`

---

## 💡 Advanced Users

Looking for advanced features?
- **Gemini queries**: SKILL.md → Context Gathering section
- **TaskRay patterns**: SKILL.md → TaskRay Navigation section
- **Tool Preambles**: SKILL.md → Tool Preambles (Contract)
- **Reasoning effort**: SKILL.md → Reasoning Effort Levels
- **Log extraction**: SKILL.md → Workflow 5

---

**Questions? Check the relevant file above or ask Claude!**
