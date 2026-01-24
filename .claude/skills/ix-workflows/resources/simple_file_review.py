#!/usr/bin/env python3

import fitz  # PyMuPDF
import os
import shutil

def review_files_for_pse():
    """Review files and create PSE-compatible naming scheme"""

    print("PSE NET METERING APPLICATION - FILE REVIEW")
    print("=" * 50)
    print()

    # Files we can work with
    available_files = {}

    # Check supporting documents
    if os.path.exists("Utility_Bill_Combined_2803083.pdf"):
        available_files["PSE_Utility_Bill.pdf"] = "Utility_Bill_Combined_2803083.pdf"
        print("✓ Found Utility Bill - can be used for address verification")

    if os.path.exists("Proof_of_Insurance_Combined_2803083.pdf"):
        available_files["PSE_Insurance_Certificate.pdf"] = "Proof_of_Insurance_Combined_2803083.pdf"
        print("✓ Found Insurance Certificate")

    # Check extracted pages for technical content
    extracted_dir = "extracted_pages"
    if os.path.exists(extracted_dir):
        print("\nChecking extracted pages for technical content...")

        # Key pages to check (based on previous analysis)
        key_pages = [11, 12, 16, 19, 20]

        for page_num in key_pages:
            filename = f"16817 Ty Ln SW Install Agreement_Page_{page_num}.pdf"
            pdf_path = os.path.join(extracted_dir, filename)

            if os.path.exists(pdf_path):
                doc = fitz.open(pdf_path)
                text = doc[0].get_text().lower()
                doc.close()

                # Analyze content
                if 'scope of work' in text and 'solar' in text:
                    available_files[f"PSE_Scope_of_Work_Page_{page_num}.pdf"] = pdf_path
                    print(f"✓ Page {page_num}: Scope of Work document")
                elif 'system' in text and ('plan' in text or 'layout' in text):
                    available_files[f"PSE_System_Plan_Page_{page_num}.pdf"] = pdf_path
                    print(f"✓ Page {page_num}: System Plan/Layout")
                elif any(keyword in text for keyword in ['technical', 'specification', 'diagram']):
                    available_files[f"PSE_Technical_Info_Page_{page_num}.pdf"] = pdf_path
                    print(f"✓ Page {page_num}: Technical Information")

    print(f"\n{'='*50}")
    print("FILE RENAME PLAN:")
    print("=" * 50)

    for new_name, old_path in available_files.items():
        old_name = os.path.basename(old_path)
        print(f"{old_name}")
        print(f"  --> {new_name}")
        print()

    return available_files

def create_missing_documents():
    """Create basic placeholder documents for missing requirements"""
    print("MISSING DOCUMENTS NEEDED:")
    print("-" * 30)
    print("1. One-Line Diagram")
    print("2. Site Plan/Schematics")
    print("3. 8760 Production Data")
    print()
    print("These would need to be created by the engineering team.")

if __name__ == "__main__":
    files_to_rename = review_files_for_pse()
    create_missing_documents()

    print(f"\n{'='*50}")
    print("NEXT STEPS:")
    print("=" * 50)
    print("1. Rename the identified files")
    print("2. Create missing technical documents")
    print("3. Upload all documents to PSE application")
    print(f"\nFiles ready to rename: {len(files_to_rename)}")