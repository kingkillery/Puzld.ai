# IX Pipeline Research Findings

**Date**: 2026-01-18
**Method**: Web research + Tongyi DeepResearch model exploration

---

## 1. Salesforce TaskRay Lightning Components

### Component Architecture
- TaskRay uses **Lightning Web Components (LWC)** with Shadow DOM encapsulation
- Components are contextual - pick up relevant data based on the page they're mounted on
- Requires lookup relationship between TaskRay Project and the record

### Key Components
| Component | Purpose | Mounting |
|-----------|---------|----------|
| Task List | Display tasks | Record page, grouped by dates/priority |
| Task Detail Modal | Edit task fields | Overlay on click |
| Project Gantt | Timeline view | Project page |
| Activity Timeline | History tracking | Task/Project pages |

### Custom Fields
- Custom fields can be added to: `TASKRAY__Project__c`, `TASKRAY__Task_Group__c`, `TASKRAY__Task__c`
- Fields appear in standard Salesforce interface AND TaskRay Details modals
- Page layouts must be updated to define field organization

### DOM Selection Challenges
- **Shadow DOM**: LWC encapsulates components, preventing direct CSS selectors
- **Dynamic IDs**: Salesforce generates unique IDs per session
- **Recommended approach**: Use `lightning-` prefixed selectors or data attributes

### TaskRay Selector Patterns
```javascript
// Task list items
document.querySelectorAll('lightning-datatable tbody tr')
document.querySelectorAll('[data-row-key-value]')

// Task fields (in detail modal)
document.querySelector('lightning-input[data-field="Status"]')
document.querySelector('lightning-combobox[data-field="Owner"]')

// Activity timeline
document.querySelectorAll('lightning-timeline-item')
document.querySelectorAll('.slds-timeline__item')
```

### Sources
- [TaskRay Lightning Components Catalog](https://support.taskray.com/hc/en-us/articles/115000830767-TaskRay-Lightning-Components-Catalog)
- [Add Custom Fields to Projects and Tasks](https://support.taskray.com/hc/en-us/articles/115000828868-Add-Custom-Fields-to-Projects-and-Tasks)
- [Lightning Web Components Developer Center](https://developer.salesforce.com/developer-centers/lightning-web-components)

---

## 2. PowerClerk Portal Automation

### Platform Overview
- **Operator**: Clean Power Research
- **Scale**: 80+ organizations, 2M+ interconnection projects
- **Coverage**: US, Canada, Australia

### API Capabilities (V2 - Recommended)
| Feature | Description |
|---------|-------------|
| OAuth 2.0 | Client credentials + bearer tokens |
| Payload formats | JSON or XML |
| Project access | Direct access via project number |
| Status updates | Programmatic status changes |
| Integration | SAP, Oracle, Salesforce, DERMS |

### Workflow Automation Features
- No-code configuration for DER programs
- Cluster study workflow automation
- FERC Order No. 2023 compliance support
- Integration with power engineering tools (CYME, DEW/ISM, DNV)

### Case Study: FortisAlberta (2025)
- **Before**: 80-day turnaround, 1 hour per application
- **After**: 7-14 day turnaround, 10 minutes per application
- **Improvement**: 80% reduction in processing time

### Portal URLs (Common Patterns)
```
https://{utility_code}.powerclerk.com/
https://interconnect.{utility}.com/  (native portals)
```

### API Integration Points
```javascript
// PowerClerk API V2 endpoints
POST /api/v2/projects              // Create project
GET  /api/v2/projects/{number}     // Get project details
PUT  /api/v2/projects/{number}     // Update project
GET  /api/v2/projects/{number}/status  // Check status
POST /api/v2/projects/{number}/documents  // Upload documents
```

### Sources
- [PowerClerk Developer Portal](https://developers.cleanpower.com/)
- [PowerClerk API Documentation](https://support.cleanpower.com/powerclerk/api/)
- [Application & Process Automation](https://developers.cleanpower.com/interconnection-applications/)

---

## 3. Top US Utility Interconnection Portals

### Largest Utilities by Market Cap (2025)

| Rank | Utility | Customers | Service Area | Portal Type |
|------|---------|-----------|--------------|-------------|
| 1 | NextEra Energy (FPL) | 12M | Florida | PowerClerk |
| 2 | Duke Energy | 8.2M | NC, SC, FL, IN, OH, KY | Native |
| 3 | Southern Company | 9M | GA, AL, MS | Native |
| 4 | Dominion Energy | 7M | VA, NC, SC | Native |
| 5 | Exelon | 10M | IL, PA, MD, NJ, DE, DC | PowerClerk |
| 6 | AEP | 5.6M | 11 states | Native |
| 7 | Xcel Energy | 3.7M | CO, MN, TX, WI, MI, ND, SD, NM | PowerClerk |
| 8 | PG&E | 16M | Northern California | Native |
| 9 | Edison Int'l (SCE) | 15M | Southern California | Native |
| 10 | Sempra (SDG&E) | 3.6M | San Diego | Native |

### Grid Interconnections
- **Eastern Interconnection**: Largest, covers east of Rockies
- **Western Interconnection**: West coast states
- **Texas Interconnection (ERCOT)**: Texas only

### Investment Trends (2025-2028)
- Exelon: $38B capital investment for grid modernization
- Focus areas: transmission expansion, battery storage, high-density facility support

### Sources
- [Largest Utilities by Market Cap 2026](https://www.fool.com/research/largest-utilities-companies/)
- [Top 10 Largest Electric Utility Companies](https://www.costanalysts.com/top-electric-utility-companies/)
- [2025 Top Utilities](https://businessfacilities.com/2025-top-utilities)

---

## 4. IX Application Rejection Analysis

### Top Rejection Categories

| # | Category | Cause | Resolution |
|---|----------|-------|------------|
| 1 | **Incomplete Documentation** | Missing spec sheets, signatures, fees | Complete checklist review before submission |
| 2 | **Technical Non-Compliance** | NEC 690/705 violations, IEEE 1547 issues | Engineering review + code compliance check |
| 3 | **System Sizing Mismatch** | Oversized system, transformer capacity exceeded | Load analysis + utility capacity check |
| 4 | **One-Line Diagram Errors** | Breaker sizes, conductor lengths wrong | Site-specific calculations, not boilerplate |
| 5 | **Poor Document Quality** | Low-res images, cluttered layouts, missing labels | High-quality scans, clear formatting |
| 6 | **Filename Convention Violations** | Metadata mismatch, wrong naming | Follow utility's exact naming requirements |
| 7 | **AHJ/Utility Misalignment** | Local permit approved but utility rejects | Know BOTH AHJ and utility requirements |
| 8 | **Setback/Fire Access Issues** | NEC fire access pathway violations | Site survey + pathway calculation |
| 9 | **Missing Engineering Stamps** | PE stamp required but missing | Engage licensed PE for review |
| 10 | **Inverter Compliance** | IEEE 1547-2018 rollout requirements | Verify inverter firmware + settings |

### 2025 Queue Challenges
- Multi-year wait times in some states
- 120+ day average for commercial systems in high-demand areas
- Staffing constraints at utilities
- Ballooning project volumes

### Resolution Best Practices

#### Pre-Application
1. Check transformer capacity before design
2. Verify utility capacity for backfeed
3. Review both AHJ and utility requirements
4. Get site photos of panelboards and service entrances

#### Application Preparation
1. Include spec sheets for ALL major components
2. Site-specific short-circuit studies
3. Match one-line diagrams exactly to application
4. Follow filename conventions precisely

#### Process Management
1. Submit utility application EARLY (don't wait for permit)
2. Build relationships with utility reps
3. Proactive communication - ask questions
4. Use AI-based feasibility tools where available

### Timeline Expectations (2025)

| Project Type | Queue Time | Total to PTO |
|--------------|------------|--------------|
| Residential (simple) | 2-4 weeks | 4-8 weeks |
| Residential (complex) | 4-8 weeks | 8-16 weeks |
| Commercial | 8-16 weeks | 16-32 weeks |
| Utility-scale | 1-3 years | 2-5 years |

### Sources
- [12 Interconnection Bottlenecks Slowing US Solar in 2025](https://www.greenlancer.com/post/interconnection-bottlenecks)
- [7 Interconnection Mistakes That Trigger Utility Rejections](https://www.anernstore.com/blogs/diy-solar-guides/interconnection-mistakes-utility-rejections)
- [Solar Permit Rejection: 10 Mistakes Killing Your AHJ Approval](https://energyscaperenewables.com/post/solar-permit-rejection-10-mistakes-killing-your-ahj-approval/)
- [2025 Utility Interconnection Explained for Commercial Solar](https://www.wattmonk.com/utility-interconnection/)

---

## 5. Actionable Guidance for IX Coordinators

### Pre-Submission Checklist

```markdown
## Application Completeness
- [ ] All required forms filled and signed
- [ ] Application fee payment confirmed
- [ ] Site address matches utility records
- [ ] Account number verified

## Technical Documentation
- [ ] One-line diagram (site-specific, not boilerplate)
- [ ] Spec sheets for ALL equipment
- [ ] Short-circuit study (site-specific)
- [ ] Load calculations verified
- [ ] PE stamp (if required)

## System Design
- [ ] System size within utility limits
- [ ] Transformer capacity confirmed
- [ ] Inverter IEEE 1547-2018 compliant
- [ ] Setbacks and fire access calculated

## File Preparation
- [ ] High-resolution scans (300+ DPI)
- [ ] Filenames match utility conventions
- [ ] Documents organized per utility requirements
- [ ] Metadata fields populated
```

### Rejection Response Protocol

1. **Document the rejection reason** - Get specific details
2. **Identify root cause** - Technical, documentation, or process
3. **Prepare correction** - Address ALL items, not just flagged ones
4. **Resubmit promptly** - Most utilities have 30-day correction windows
5. **Follow up proactively** - Don't wait for updates

### Escalation Triggers
- Rejection for same reason twice
- Wait time exceeds 2x normal timeline
- Conflicting guidance from utility
- Technical dispute requiring engineering review

---

## Version

- **Last Updated**: 2026-01-18
- **Research Method**: Web search + Tongyi DeepResearch
- **Confidence Level**: High (multiple corroborating sources)
