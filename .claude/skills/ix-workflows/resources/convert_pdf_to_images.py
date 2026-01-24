#!/usr/bin/env python3

import fitz  # PyMuPDF
import os

def convert_pdf_pages_to_images():
    """Convert promising PDF pages to images for Gemini analysis"""

    print("CONVERTING PDF PAGES TO IMAGES FOR GEMINI ANALYSIS")
    print("=" * 55)

    # Best candidates for technical diagrams (based on our analysis)
    best_candidates = [
        {'pdf': 'PSE_Technical_Diagram_Page_16.pdf', 'name': 'Page_16'},
        {'pdf': 'PSE_Technical_Diagram_Page_19.pdf', 'name': 'Page_19'},
        {'pdf': 'PSE_Technical_Diagram_Page_20.pdf', 'name': 'Page_20'}
    ]

    created_images = []

    for candidate in best_candidates:
        if os.path.exists(candidate['pdf']):
            try:
                # Open the PDF
                doc = fitz.open(candidate['pdf'])

                # Convert each page to PNG image
                for page_num in range(len(doc)):
                    page = doc[page_num]

                    # Create image filename
                    image_name = f"gemini_analysis_{candidate['name']}_Page_{page_num + 1}.png"

                    # Get page pixmap with good resolution
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
                    pix.save(image_name)

                    created_images.append(image_name)
                    print(f"Created: {image_name}")

                doc.close()

            except Exception as e:
                print(f"Error converting {candidate['pdf']}: {e}")

    print(f"\n{'='*55}")
    print(f"IMAGES READY FOR GEMINI ANALYSIS")
    print("=" * 55)

    if created_images:
        print(f"Total images created: {len(created_images)}")
        print("\nUse these Gemini commands:")
        print("-" * 30)

        for image in created_images:
            print(f"gemini -p 'Is this an electrical one-line diagram?' '{image}'")
            print(f"gemini -p 'Does this show solar system connections?' '{image}'")
            print(f"gemini -p 'Is this a site plan or layout?' '{image}'")
            print()

        print("\nAnalysis priorities:")
        print("-" * 18)
        print("1. One-Line Diagram (most important)")
        print("2. Site Plan/Layout")
        print("3. Technical Specifications")
    else:
        print("No images created - check PDF files")

    return created_images

def create_gemini_analysis_commands():
    """Create specific Gemini analysis commands"""

    commands = []

    # Commands for one-line diagram analysis
    one_line_prompts = [
        "Is this an electrical one-line diagram showing solar system connections?",
        "Does this image show circuit breakers, disconnect switches, or electrical equipment?",
        "Can you identify the solar panels, inverter, and electrical components in this diagram?",
        "Is this suitable for a PSE interconnection application as a one-line diagram?"
    ]

    # Commands for site plan analysis
    site_plan_prompts = [
        "Is this a site plan showing the property layout and solar array location?",
        "Does this show the roof layout, panel positions, or installation area?",
        "Can you identify the interconnection point or meter location in this drawing?",
        "Is this suitable as a site plan for PSE application?"
    ]

    print("\n" + "="*55)
    print("DETAILED GEMINI ANALYSIS COMMANDS")
    print("="*55)

    print("\nONE-LINE DIAGRAM ANALYSIS:")
    print("-" * 30)
    for i, prompt in enumerate(one_line_prompts, 1):
        print(f"{i}. gemini -p '{prompt}' [image_file]")

    print("\nSITE PLAN ANALYSIS:")
    print("-" * 20)
    for i, prompt in enumerate(site_plan_prompts, 1):
        print(f"{i}. gemini -p '{prompt}' [image_file]")

    return commands

if __name__ == "__main__":
    images = convert_pdf_pages_to_images()
    create_gemini_analysis_commands()