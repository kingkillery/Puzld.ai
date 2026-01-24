#!/usr/bin/env python3

import os

def create_final_file_set():
    """Create the final set of files for PSE upload, removing duplicates"""

    print("ORGANIZING FINAL FILES FOR PSE UPLOAD")
    print("=" * 45)

    # Current files (including duplicates)
    current_files = [
        'PSE_Utility_Bill_Verification.pdf',
        'PSE_Proof_of_Insurance.pdf',
        'PSE_8760_Production.pdf',
        'PSE_Technical_Diagram_Page_16.pdf',
        'PSE_Visual_Document_Page_6.pdf',
        'PSE_Visual_Document_Page_8.pdf',
        'PSE_Visual_Document_Page_10.pdf',
        'PSE_8760_Production.pdf',  # Duplicate
        'PSE_8760_Production.pdf',  # Duplicate
        'PSE_Technical_Diagram_Page_19.pdf',
        'PSE_Technical_Diagram_Page_20.pdf',
        'PSE_Visual_Document_Page_7.pdf'
    ]

    # Create final file set with unique names
    final_files = {
        'PSE_Utility_Bill_Verification.pdf': 'Address verification for 16817 TY LN SW',
        'PSE_Proof_of_Insurance.pdf': 'Required insurance documentation',
        'PSE_8760_Production_Data.pdf': 'Annual energy production estimates',
        'PSE_One_Line_Diagram.pdf': 'Electrical one-line diagram (Page 16)',
        'PSE_Site_Plan.pdf': 'Site layout and installation plan (Page 19)',
        'PSE_Additional_Technical_Info.pdf': 'Additional technical specifications (Page 20)',
        'PSE_Scope_of_Work.pdf': 'Project scope and system specifications'
    }

    print("Final file set for PSE upload:")
    print("-" * 30)

    # Keep the supporting documents as-is
    if os.path.exists('PSE_Utility_Bill_Verification.pdf'):
        print("✓ PSE_Utility_Bill_Verification.pdf")

    if os.path.exists('PSE_Proof_of_Insurance.pdf'):
        print("✓ PSE_Proof_of_Insurance.pdf")

    # Handle technical files - we'll use the best ones from our analysis
    print("\nTechnical files (best candidates):")
    print("-" * 35)

    # Best technical files based on our scoring
    best_candidates = [
        {'file': 'PSE_Technical_Diagram_Page_16.pdf', 'desc': 'Technical diagram with 7 images'},
        {'file': 'PSE_Technical_Diagram_Page_19.pdf', 'desc': 'Technical diagram with 12 images'},
        {'file': 'PSE_Technical_Diagram_Page_20.pdf', 'desc': 'Technical diagram with 3 images'}
    ]

    # Also keep production data files
    production_candidates = [
        {'file': 'PSE_8760_Production.pdf', 'desc': 'Production data'}
    ]

    print("Technical diagrams (for one-line diagram):")
    for i, candidate in enumerate(best_candidates[:2], 1):  # Keep top 2
        if os.path.exists(candidate['file']):
            new_name = f"PSE_One_Line_Diagram_Candidate_{i}.pdf"
            print(f"  {candidate['file']} -> {new_name}")
            print(f"    {candidate['desc']}")

    print("\nProduction data:")
    for candidate in production_candidates:
        if os.path.exists(candidate['file']):
            print(f"  {candidate['file']}")
            print(f"    {candidate['desc']}")

    print(f"\n{'='*45}")
    print("RECOMMENDATION FOR GEMINI ANALYSIS")
    print("=" * 45)

    print("Pages to analyze with Gemini:")
    print("-" * 30)
    print("1. PSE_Technical_Diagram_Page_16.pdf (7 images)")
    print("2. PSE_Technical_Diagram_Page_19.pdf (12 images)")
    print("3. PSE_Technical_Diagram_Page_20.pdf (3 images)")

    print(f"\nGemini analysis prompts:")
    print("-" * 22)
    print("gemini -p 'Is this a one-line electrical diagram?'")
    print("gemini -p 'Does this show solar system electrical connections?'")
    print("gemini -p 'Is this a site plan or layout drawing?'")
    print("gemini -p 'Does this show energy production data?'")

    return best_candidates

def remove_duplicate_files():
    """Clean up duplicate files"""

    duplicate_patterns = [
        'PSE_8760_Production.pdf'  # Multiple copies
    ]

    print(f"\n{'='*45}")
    print("CLEANING DUPLICATE FILES")
    print("=" * 45)

    # Remove duplicate 8760 Production files, keep one
    count = 0
    for filename in os.listdir('.'):
        if filename == 'PSE_8760_Production.pdf':
            count += 1
            if count > 1:  # Keep first one, remove others
                try:
                    os.remove(filename)
                    print(f"Removed duplicate: {filename}")
                except Exception as e:
                    print(f"Could not remove {filename}: {e}")

if __name__ == "__main__":
    candidates = create_final_file_set()
    remove_duplicate_files()

    print(f"\n{'='*45}")
    print("READY FOR GEMINI ANALYSIS")
    print("=" * 45)
    print("Technical files identified and ready for image analysis")
    print("Use Gemini to determine which pages contain the required documents")