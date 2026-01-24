#!/usr/bin/env python3

import fitz  # PyMuPDF
import os
import re

def analyze_page_content(pdf_path):
    """Analyze page content to identify document types"""
    doc = fitz.open(pdf_path)
    page_num = 1
    identified_docs = {}

    for page in doc:
        text = page.get_text().lower()

        # Look for key document indicators
        if 'one line' in text or 'one-line' in text or 'single line' in text:
            identified_docs[page_num] = "ONE_LINE_DIAGRAM"
        elif 'schematic' in text or 'site plan' in text or 'layout' in text:
            identified_docs[page_num] = "SITE_PLAN"
        elif 'production' in text and ('8760' in text or 'kw' in text or 'kwh' in text):
            identified_docs[page_num] = "PRODUCTION_DATA"
        elif 'interconnection' in text and ('diagram' in text or 'drawing' in text):
            identified_docs[page_num] = "INTERCONNECTION_DIAGRAM"
        elif 'electrical' in text and ('plan' in text or 'drawing' in text):
            identified_docs[page_num] = "ELECTRICAL_PLAN"

        # Check for common solar design elements
        if 'solar' in text and ('array' in text or 'panel' in text or 'module' in text):
            if page_num not in identified_docs:
                identified_docs[page_num] = "SOLAR_LAYOUT"

        page_num += 1

    doc.close()
    return identified_docs

def identify_required_documents():
    """Identify which pages contain the documents we need"""
    extracted_dir = "extracted_pages"
    document_mapping = {}

    print("Analyzing extracted pages for required documents...")
    print("=" * 60)

    for filename in sorted(os.listdir(extracted_dir)):
        if filename.endswith('.pdf'):
            pdf_path = os.path.join(extracted_dir, filename)
            page_num = int(filename.split('_Page_')[1].split('.pdf')[0])

            doc = fitz.open(pdf_path)
            text = doc[0].get_text().lower()
            doc.close()

            # Print first 100 characters of each page for manual identification
            clean_text = ''.join(char if ord(char) < 128 else '?' for char in text)
            preview = clean_text[:100].replace('\n', ' ').strip()

            print(f"Page {page_num}: {filename}")
            print(f"Preview: {preview}")
            print("-" * 40)

    print("\n" + "=" * 60)
    print("DOCUMENT IDENTIFICATION:")
    print("=" * 60)

    # Second pass to identify specific documents
    for filename in sorted(os.listdir(extracted_dir)):
        if filename.endswith('.pdf'):
            pdf_path = os.path.join(extracted_dir, filename)
            page_num = int(filename.split('_Page_')[1].split('.pdf')[0])

            doc = fitz.open(pdf_path)
            text = doc[0].get_text().lower()
            doc.close()

            # Look for specific document types
            if any(keyword in text for keyword in ['one line', 'one-line', 'single line diagram', 'electrical diagram']):
                document_mapping['one_line_diagram'] = page_num
                print(f"✓ Page {page_num}: One-Line Diagram identified")
            elif any(keyword in text for keyword in ['site plan', 'site layout', 'roof plan', 'layout plan']):
                document_mapping['site_plan'] = page_num
                print(f"✓ Page {page_num}: Site Plan identified")
            elif any(keyword in text for keyword in ['production', '8760', 'annual production', 'energy production']):
                document_mapping['production'] = page_num
                print(f"✓ Page {page_num}: Production Data identified")
            elif any(keyword in text for keyword in ['interconnection', 'point of common coupling', 'poc']):
                document_mapping['interconnection'] = page_num
                print(f"✓ Page {page_num}: Interconnection Details identified")

    return document_mapping

if __name__ == "__main__":
    mapping = identify_required_documents()

    print(f"\n" + "=" * 60)
    print("SUMMARY:")
    print("=" * 60)
    print(f"Documents identified: {len(mapping)}")
    for doc_type, page_num in mapping.items():
        print(f"  {doc_type}: Page {page_num}")

    if len(mapping) < 3:
        print(f"\n⚠️  NOTE: Not all required documents were automatically identified.")
        print(f"You may need to manually review the pages to find:")
        print(f"  - One-Line Diagram")
        print(f"  - Site Plan/Schematics")
        print(f"  - Production Data (8760)")