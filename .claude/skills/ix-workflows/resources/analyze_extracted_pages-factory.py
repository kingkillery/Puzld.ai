#!/usr/bin/env python3

import fitz  # PyMuPDF
import os

def find_technical_documents():
    """Search through extracted pages to find actual technical documents"""

    extracted_dir = "extracted_pages"

    print("SEARCHING FOR TECHNICAL DOCUMENTS IN EXTRACTED PAGES")
    print("=" * 60)

    # Define what we're looking for
    technical_indicators = {
        'one_line': [
            'one line', 'one-line', 'single line diagram', 'electrical diagram',
            'schematic', 'circuit diagram', 'line diagram'
        ],
        'site_plan': [
            'site plan', 'layout plan', 'roof plan', 'site layout',
            'elevation', 'plan view', 'location plan'
        ],
        'production': [
            'production', '8760', 'annual production', 'energy production',
            'kwh production', 'generation', 'solar production'
        ],
        'technical': [
            'specification', 'technical spec', 'system spec',
            'electrical spec', 'design spec'
        ]
    }

    found_documents = {}

    # Get all extracted page files
    page_files = [f for f in os.listdir(extracted_dir) if f.endswith('.pdf')]
    page_files.sort()

    for filename in page_files:
        page_num = int(filename.split('_Page_')[1].split('.pdf')[0])
        pdf_path = os.path.join(extracted_dir, filename)

        try:
            doc = fitz.open(pdf_path)
            text = doc[0].get_text()
            doc.close()

            text_lower = text.lower()

            print(f"\nPAGE {page_num}: {filename}")
            print("-" * 40)

            # Check for each type of technical document
            for doc_type, keywords in technical_indicators.items():
                if any(keyword in text_lower for keyword in keywords):
                    found_documents[doc_type] = {
                        'page_num': page_num,
                        'filename': filename,
                        'path': pdf_path,
                        'keywords_found': [kw for kw in keywords if kw in text_lower]
                    }
                    print(f"✓ FOUND {doc_type.upper()}: {found_documents[doc_type]['keywords_found']}")

            # Show a brief preview of the content
            lines = text.split('\n')[:10]  # First 10 lines
            preview_lines = [line.strip() for line in lines if line.strip()]
            if preview_lines:
                print("Preview:")
                for line in preview_lines[:3]:  # Show first 3 non-empty lines
                    if len(line) > 50:
                        print(f"  {line[:50]}...")
                    else:
                        print(f"  {line}")
            else:
                print("  [No text content visible]")

        except Exception as e:
            print(f"Error reading page {page_num}: {e}")

    return found_documents

def show_document_summary(found_documents):
    """Display summary of found documents"""

    print(f"\n{'='*60}")
    print("DOCUMENT SUMMARY")
    print("=" * 60)

    if found_documents:
        print("TECHNICAL DOCUMENTS FOUND:")
        print("-" * 30)
        for doc_type, info in found_documents.items():
            print(f"{doc_type.upper()}:")
            print(f"  Page {info['page_num']}: {info['filename']}")
            print(f"  Keywords: {', '.join(info['keywords_found'])}")
            print()

        print("SUGGESTED PSE UPLOAD FILES:")
        print("-" * 30)

        # Create PSE-compatible file names
        pse_names = {
            'one_line': 'PSE_One_Line_Diagram.pdf',
            'site_plan': 'PSE_Site_Plan.pdf',
            'production': 'PSE_8760_Production.pdf',
            'technical': 'PSE_Technical_Specifications.pdf'
        }

        for doc_type, info in found_documents.items():
            pse_name = pse_names.get(doc_type, f"PSE_{doc_type}.pdf")
            print(f"{info['filename']} -> {pse_name}")

    else:
        print("❌ NO TECHNICAL DOCUMENTS FOUND")
        print("The extracted pages contain primarily legal/contract documents.")
        print("Technical documents (one-line diagram, site plan, production) may be missing.")

    return len(found_documents)

if __name__ == "__main__":
    found_docs = find_technical_documents()
    doc_count = show_document_summary(found_docs)

    print(f"\n{'='*60}")
    print(f"NEXT STEPS:")
    print(f"{'='*60}")

    if doc_count > 0:
        print(f"1. Copy identified technical documents to main directory")
        print(f"2. Rename files with PSE prefixes")
        print(f"3. Upload to PSE application")
    else:
        print(f"1. Technical documents not found in extracted pages")
        print(f"2. May need to locate separate technical file")
        print(f"3. Or proceed with available supporting documents only")

    print(f"Total technical documents identified: {doc_count}")