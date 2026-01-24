---
name: ix-workflows
description: >
  Document processing for utility applications: split PDFs, identify technical docs, organize files.
  WHEN: Processing bulk uploads, extracting account numbers, organizing files for portal submission.
  WHEN NOT: Portal automation (use browser-agent), project lookup (use ix-codemode).
version: 1.1.0
---

# IX Workflows Skill

Document processing and file organization for utility interconnection applications.

## Quick Start

### Split & Identify (Most Common)
```bash
# 1. Split large PDF into pages
python examples/utility_scripts/extract_all_pages.py "Large_Packet.pdf"

# 2. Identify which pages are which documents
python examples/utility_scripts/identify_documents.py

# 3. Check output in extracted_pages/
```

### Extract Account Info
```bash
python examples/utility_scripts/extract_pdf.py utility_bill.pdf
# → Account #, Meter #, Customer Name
```

### Organize for Upload
```bash
python examples/utility_scripts/organize_final_files.py
# → Creates final_files/ with standardized names
```

---

## When to Use

| Task | Use This? | Alternative |
|------|-----------|-------------|
| Split PDF packet into pages | Yes | - |
| Find One-Line Diagram in upload | Yes | - |
| Extract account/meter numbers | Yes | - |
| Rename files for portal upload | Yes | - |
| Submit to portal | No | browser-agent |
| Look up project status | No | ix-codemode |

---

## Common Workflows

### A. The "Split & Identify" Workflow
Use when you have a large PDF packet and need specific technical docs.

1. **Split**: `extract_all_pages.py "Packet.pdf"` → creates `extracted_pages/`
2. **Identify**: `identify_documents.py` → categorizes pages
3. **Verify**: Check output, use `check_pages_for_images.py` for visuals

### B. The "Cleanup & Upload" Workflow
Use before uploading to a utility portal.

1. **Organize**: `organize_final_files.py` → standardizes names (e.g., `PSE_One_Line_Diagram.pdf`)
2. **Review**: Check `final_files/` directory
3. **Fill Gaps**: `create_missing_documents.py` if placeholders needed

### C. Data Extraction Workflow
Use to extract key fields from documents.

1. **Bill Info**: `extract_pdf.py` → Account #, Meter #, Address
2. **Engineering**: `extract_engineering.py` → Inverter, Panels, System Size
3. **Combined**: `extract_data.py` → All fields in one pass

---

## Tool Reference

### PDF Processing
| Tool | Purpose | Usage |
|------|---------|-------|
| `extract_all_pages.py` | Split PDF into pages | `python ... <pdf>` |
| `convert_pdf_to_image.py` | PDF pages to images | `python ... <pdf>` |
| `extract_images.py` | Extract images from PDF | Edit script, run |

### Document Identification
| Tool | Purpose | Usage |
|------|---------|-------|
| `identify_documents.py` | Categorize pages | Scans `extracted_pages/` |
| `check_pages_for_images.py` | Find visual content | Scans directory |
| `analyze_extracted_pages.py` | Detailed analysis | Scans directory |

### Data Extraction
| Tool | Purpose | Usage |
|------|---------|-------|
| `extract_pdf.py` | Bill info extraction | `python ... <pdf>` |
| `extract_engineering.py` | Engineering specs | `python ...` |
| `find_inverter.py` | Inverter brand/model | `python ...` |

### File Organization
| Tool | Purpose | Usage |
|------|---------|-------|
| `organize_final_files.py` | Rename & organize | Creates `final_files/` |
| `rename_files.py` | Bulk rename | Configure & run |
| `create_missing_documents.py` | Placeholder PDFs | Creates DRAFT docs |

---

## Document Types Detected

| Type | Keywords | File Pattern |
|------|----------|--------------|
| One-Line Diagram | "one line", "electrical diagram" | `*_One_Line_*.pdf` |
| Site Plan | "site plan", "layout" | `*_Site_Plan_*.pdf` |
| 8760 Production | "8760", "production estimate" | `*_8760_*.pdf` |
| Utility Bill | "account", "meter", "kwh" | `*_Bill_*.pdf` |
| Engineering Plans | "inverter", "panel", "module" | `*_Engineering_*.pdf` |

---

## Best Practices

1. **Always verify** - Regex extraction is good but not perfect
2. **Keep originals** - Scripts create copies, don't modify sources
3. **Update mappings** - Add keywords to `identify_documents.py` if needed

---

## Files

| File | Purpose |
|------|---------|
| `skill.md` | This file |
| `resources/` | Bundled scripts |
| `examples/utility_scripts/` | Main script location |

---

## See Also

- `browser-agent` - Portal automation
- `ix-codemode` - Project lookup and data queries
- `Ambia` - Full interconnection workflow
