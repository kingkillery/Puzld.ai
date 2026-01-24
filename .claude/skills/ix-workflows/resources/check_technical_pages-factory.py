#!/usr/bin/env python3

import fitz  # PyMuPDF
import os

def check_pages_for_technical_content():
    """Check pages for technical documents like diagrams and plans"""
    extracted_dir = "extracted_pages"

    print("Checking pages for technical content...")
    print("=" * 60)

    # Check specific pages that are likely to contain technical documents
    # Usually technical documents are in the middle or end of contract packages
    pages_to_check = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 24, 25]

    for page_num in pages_to_check:
        filename = f"16817 Ty Ln SW Install Agreement_Page_{page_num}.pdf"
        pdf_path = os.path.join(extracted_dir, filename)

        if os.path.exists(pdf_path):
            doc = fitz.open(pdf_path)
            text = doc[0].get_text()
            doc.close()

            # Look for technical content indicators
            text_lower = text.lower()
            has_technical_content = False
            content_type = ""

            if any(keyword in text_lower for keyword in ['diagram', 'drawing', 'schematic', 'plan', 'layout']):
                has_technical_content = True
                if 'diagram' in text_lower:
                    content_type = "DIAGRAM"
                elif 'plan' in text_lower:
                    content_type = "PLAN"
                elif 'schematic' in text_lower:
                    content_type = "SCHEMATIC"
                elif 'layout' in text_lower:
                    content_type = "LAYOUT"

            if any(keyword in text_lower for keyword in ['kw', 'kwh', 'watt', 'panel', 'module', 'inverter', 'solar']):
                if content_type:
                    content_type += " + SOLAR_TECHNICAL"
                else:
                    content_type = "SOLAR_TECHNICAL"

            if has_technical_content:
                print(f"Page {page_num}: {content_type}")
                # Show some actual text content
                clean_text = text.replace('\n', ' ').strip()[:200]
                print(f"  Content: {clean_text}...")
                print("-" * 40)
            else:
                # Show if it looks like legal/contract content
                if any(keyword in text_lower for keyword in ['contract', 'agreement', 'warranty', 'cancellation', 'buyer', 'seller']):
                    print(f"Page {page_num}: Legal/Contract content")
                else:
                    print(f"Page {page_num}: Other content")
                    clean_text = text.replace('\n', ' ').strip()[:100]
                    print(f"  Preview: {clean_text}...")
                print("-" * 40)

if __name__ == "__main__":
    check_pages_for_technical_content()