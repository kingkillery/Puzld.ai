#!/usr/bin/env python3

import fitz  # PyMuPDF
import os
import shutil

def analyze_and_recommend_renames():
    """Analyze pages and recommend appropriate renames for PSE upload"""
    extracted_dir = "extracted_pages"

    # Pages that showed technical content in our previous analysis
    technical_pages = [11, 12, 16, 19, 20]

    print("ANALYZING PAGES FOR PSE DOCUMENT REQUIREMENTS")
    print("=" * 60)
    print()

    recommendations = {}

    for page_num in technical_pages:
        filename = f"16817 Ty Ln SW Install Agreement_Page_{page_num}.pdf"
        pdf_path = os.path.join(extracted_dir, filename)

        if os.path.exists(pdf_path):
            doc = fitz.open(pdf_path)
            text = doc[0].get_text()
            doc.close()

            text_lower = text.lower()

            print(f"PAGE {page_num}:")
            print("-" * 40)

            # Analyze content for document type
            if 'scope of work' in text_lower and 'solar energy system' in text_lower:
                recommendations[f'PSE_Scope_of_Work_Page_{page_num}.pdf'] = pdf_path
                print("  → RECOMMEND: Scope of Work document")
                print(f"    Rename to: PSE_Scope_of_Work_Page_{page_num}.pdf")

            elif 'system' in text_lower and ('plan' in text_lower or 'layout' in text_lower):
                recommendations[f'PSE_System_Layout_Page_{page_num}.pdf'] = pdf_path
                print("  → RECOMMEND: System Layout/Plan document")
                print(f"    Rename to: PSE_System_Layout_Page_{page_num}.pdf")

            elif 'solar' in text_lower and ('technical' in text_lower or 'specification' in text_lower):
                recommendations[f'PSE_Technical_Specs_Page_{page_num}.pdf'] = pdf_path
                print("  → RECOMMEND: Technical Specifications")
                print(f"    Rename to: PSE_Technical_Specs_Page_{page_num}.pdf")

            else:
                # Show preview for manual determination
                clean_text = text.replace('\n', ' ').strip()[:150]
                print(f"  → CONTENT: {clean_text}...")
                print(f"    Manual review needed")

            print()

    # Also check available supporting documents
    print("SUPPORTING DOCUMENTS:")
    print("-" * 40)

    if os.path.exists("Utility_Bill_Combined_2803083.pdf"):
        print("  ✓ Utility_Bill_Combined_2803083.pdf")
        recommendations['PSE_Utility_Bill_Verification.pdf'] = "Utility_Bill_Combined_2803083.pdf"
        print("    → RENAME TO: PSE_Utility_Bill_Verification.pdf")

    if os.path.exists("Proof_of_Insurance_Combined_2803083.pdf"):
        print("  ✓ Proof_of_Insurance_Combined_2803083.pdf")
        recommendations['PSE_Proof_of_Insurance.pdf'] = "Proof_of_Insurance_Combined_2803083.pdf"
        print("    → RENAME TO: PSE_Proof_of_Insurance.pdf")

    print()
    print("MISSING REQUIRED DOCUMENTS:")
    print("-" * 40)
    print("  ❌ One-Line Diagram (electrical schematic)")
    print("  ❌ Site Plan/Schematics (point of interconnection)")
    print("  ❌ 8760 Projected Power Production")

    print()
    print("CREATION PLAN:")
    print("-" * 40)
    print("  🔧 Will create basic placeholder documents for missing items")
    print("  📝 These will be marked as 'DRAFT - FINAL ENGINEER STAMP REQUIRED'")

    return recommendations

if __name__ == "__main__":
    recommendations = analyze_and_recommend_renames()

    print(f"\n{'='*60}")
    print(f"RENAME SUMMARY:")
    print(f"{'='*60}")

    for new_name, old_path in recommendations.items():
        print(f"{os.path.basename(old_path)} → {new_name}")

    print(f"\nTotal files to rename: {len(recommendations)}")