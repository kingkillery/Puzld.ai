#!/usr/bin/env python3

import fitz  # PyMuPDF
import os

def check_pages_for_images():
    """Check if any pages contain images that might be technical diagrams"""

    extracted_dir = "extracted_pages"

    print("CHECKING FOR IMAGES/DIAGRAMS IN EXTRACTED PAGES")
    print("=" * 55)

    # Focus on pages most likely to contain technical diagrams
    priority_pages = [9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]

    pages_with_images = []

    for page_num in priority_pages:
        filename = f"16817 Ty Ln SW Install Agreement_Page_{page_num}.pdf"
        pdf_path = os.path.join(extracted_dir, filename)

        if os.path.exists(pdf_path):
            try:
                doc = fitz.open(pdf_path)
                page = doc[0]

                # Check for images on the page
                image_list = page.get_images()
                text_content = page.get_text().lower()

                print(f"\nPAGE {page_num}:")
                print(f"  Images found: {len(image_list)}")

                if len(image_list) > 0:
                    pages_with_images.append({
                        'page_num': page_num,
                        'filename': filename,
                        'image_count': len(image_list),
                        'path': pdf_path
                    })
                    print(f"  ✓ Contains {len(image_list)} image(s) - POTENTIAL DIAGRAM")

                # Look for technical keywords even if no images
                technical_keywords = [
                    'diagram', 'schematic', 'plan', 'layout', 'design',
                    'specification', 'watt', 'kw', 'panel', 'inverter',
                    'electrical', 'circuit', 'system'
                ]

                found_keywords = [kw for kw in technical_keywords if kw in text_content]
                if found_keywords:
                    print(f"  Technical keywords: {found_keywords}")

                # Check page size (might indicate different document type)
                rect = page.rect
                if rect.height != 792 or rect.width != 612:  # Not standard letter size
                    print(f"  Non-standard page size: {rect.width}x{rect.height}")

                doc.close()

            except Exception as e:
                print(f"  Error reading page {page_num}: {e}")

    return pages_with_images

def recommend_files():
    """Recommend specific files for PSE upload based on analysis"""

    print(f"\n{'='*55}")
    print("FILE RECOMMENDATIONS FOR PSE UPLOAD")
    print("=" * 55)

    # Available supporting documents
    supporting_docs = {
        'Utility_Bill': 'PSE_Utility_Bill.pdf',
        'Insurance': 'PSE_Insurance_Certificate.pdf'
    }

    print("SUPPORTING DOCUMENTS (Ready to Upload):")
    print("-" * 45)
    for doc_type, filename in supporting_docs.items():
        if os.path.exists(filename):
            print(f"  ✓ {filename}")
        else:
            print(f"  ❌ {filename} (not found)")

    # Check extracted pages with images
    image_pages = check_pages_for_images()

    print(f"\nPOTENTIAL TECHNICAL DOCUMENTS:")
    print("-" * 45)

    if image_pages:
        print("Pages with images (potential diagrams):")
        for page_info in image_pages:
            print(f"  Page {page_info['page_num']}: {page_info['filename']}")
            print(f"    → Recommended rename: PSE_Technical_Document_Page_{page_info['page_num']}.pdf")
    else:
        print("❌ No pages with images found")
        print("   Technical documents may be in a separate file")

    print(f"\n{'='*55}")
    print("UPLOAD STRATEGY:")
    print("=" * 55)

    if image_pages:
        print("1. Upload supporting documents (utility bill, insurance)")
        print("2. Upload pages with images as technical documents")
        print("3. Note in application that some documents are still pending")
    else:
        print("1. Upload available supporting documents")
        print("2. Note in application that technical documents will be provided separately")

if __name__ == "__main__":
    recommend_files()