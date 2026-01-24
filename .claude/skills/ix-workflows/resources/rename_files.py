#!/usr/bin/env python3

import os
import shutil

def rename_files_for_pse():
    """Rename files for PSE application upload"""

    print("RENAMING FILES FOR PSE APPLICATION")
    print("=" * 50)

    # File rename mapping
    rename_mapping = {
        # Supporting documents
        "Utility_Bill_Combined_2803083.pdf": "PSE_Utility_Bill_Verification.pdf",
        "Proof_of_Insurance_Combined_2803083.pdf": "PSE_Proof_of_Insurance.pdf"
    }

    # Check and rename supporting documents
    renamed_count = 0

    for old_name, new_name in rename_mapping.items():
        if os.path.exists(old_name):
            if os.path.exists(new_name):
                os.remove(new_name)  # Remove existing if it exists
            os.rename(old_name, new_name)
            print(f"Renamed: {old_name} -> {new_name}")
            renamed_count += 1
        else:
            print(f"File not found: {old_name}")

    # Handle extracted pages
    extracted_dir = "extracted_pages"
    if os.path.exists(extracted_dir):
        print(f"\nProcessing extracted pages...")

        # Key pages that might have useful content based on our analysis
        useful_pages = {
            "16817 Ty Ln SW Install Agreement_Page_11.pdf": "PSE_Scope_of_Work.pdf",
            "16817 Ty Ln SW Install Agreement_Page_12.pdf": "PSE_System_Information.pdf",
            "16817 Ty Ln SW Install Agreement_Page_16.pdf": "PSE_Contract_Terms.pdf",
            "16817 Ty Ln SW Install Agreement_Page_20.pdf": "PSE_Customer_Agreement.pdf"
        }

        for old_name, new_name in useful_pages.items():
            old_path = os.path.join(extracted_dir, old_name)
            if os.path.exists(old_path):
                if os.path.exists(new_name):
                    os.remove(new_name)
                shutil.copy2(old_path, new_name)
                print(f"Copied: {old_name} -> {new_name}")
                renamed_count += 1

    print(f"\n{'='*50}")
    print(f"Total files processed: {renamed_count}")

    # Show what files we now have
    print(f"\nCurrent files ready for upload:")
    print("-" * 30)

    for file in os.listdir('.'):
        if file.startswith('PSE_') and file.endswith('.pdf'):
            print(f"  {file}")

    print(f"\nExtracted pages available in {extracted_dir}/:")
    print("-" * 30)

    extracted_files = [f for f in os.listdir(extracted_dir) if f.endswith('.pdf')]
    for file in sorted(extracted_files):
        print(f"  {file}")

    return renamed_count

if __name__ == "__main__":
    rename_files_for_pse()