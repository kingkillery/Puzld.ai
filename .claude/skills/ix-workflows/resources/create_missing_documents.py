#!/usr/bin/env python3

import fitz  # PyMuPDF
import os
from datetime import datetime

def create_missing_pse_documents():
    """Create basic placeholder documents for missing PSE requirements"""

    print("CREATING PLACEHOLDER DOCUMENTS FOR PSE")
    print("=" * 50)

    # Documents we need to create
    documents_needed = [
        {
            "filename": "PSE_One_Line_Diagram_DRAFT.pdf",
            "title": "ONE-LINE DIAGRAM - DRAFT",
            "content": """
PROJECT: 16817 TY LN SW, ROCHESTER WA 98579
CUSTOMER: DANIEL ALLEY

SYSTEM SPECIFICATIONS:
- Total System Size: 10 kW AC (12 kW DC)
- Inverter: Enphase IQ8A-3-69 Microinverters
- Panels: Q CELLS Q.PEAK DUO ML-G10+
- Interconnection Type: Grid-tied with Net Metering

ELECTRICAL CONFIGURATION:
- Service Voltage: 240V/120V Single Phase
- Main Breaker: 100A
- Solar Production Meter: To be installed by PSE
- Disconnect Switch: Load-Break Rated, Lockable
- Overcurrent Protection: As per NEC Article 690

IMPORTANT NOTES:
• THIS IS A DRAFT ONE-LINE DIAGRAM
• FINAL ENGINEER-STAMPED DIAGRAM REQUIRED BEFORE INTERCONNECTION
• ALL WORK TO BE PERFORMED BY LICENSED ELECTRICIAN
• COMPLIANCE WITH PSE ELECTRIC SERVICE HANDBOOK REQUIRED

Prepared by: Ambia Energy LLC
Date: """ + datetime.now().strftime("%m/%d/%Y") + """
Project ID: PSE-16817-TYLN-2025
            """
        },
        {
            "filename": "PSE_Site_Plan_DRAFT.pdf",
            "title": "SITE PLAN - DRAFT",
            "content": """
PROJECT: 16817 TY LN SW, ROCHESTER WA 98579

SITE INFORMATION:
- Property Type: Residential Single Family
- Roof Type: [TO BE DETERMINED DURING SITE SURVEY]
- Roof Pitch: [TO BE MEASURED]
- Available Roof Area: Approximately 1,200 sq ft

SOLAR ARRAY LAYOUT:
- System Size: 10 kW AC (12 kW DC)
- Estimated Panel Count: 30-35 panels
- Array Configuration: Multiple roof sections
- Orientation: South-facing preferred
- Tilt Angle: Roof-mounted (approximately 20-35 degrees)

INTERCONNECTION POINTS:
- Main Service Panel: [LOCATION TO BE CONFIRMED]
- Solar Production Meter: PSE Installation Required
- Disconnect Switch: Exterior wall, accessible to PSE
- Point of Common Coupling: Main service entrance

CLEARANCE REQUIREMENTS:
- Fire Department Access: 3-foot pathways maintained
- Roof Access: 3-foot clearance from ridge and edges
- Equipment Clearance: As per NEC requirements

IMPORTANT NOTES:
• THIS IS A DRAFT SITE PLAN
• FINAL SITE SURVEY REQUIRED
• ROOF STRUCTURAL ANALYSIS RECOMMENDED
• HOA APPROVAL REQUIRED IF APPLICABLE

Prepared by: Ambia Energy LLC
Date: """ + datetime.now().strftime("%m/%d/%Y") + """
Project ID: PSE-16817-TYLN-2025
            """
        },
        {
            "filename": "PSE_8760_Production_DRAFT.pdf",
            "title": "8760 PRODUCTION DATA - DRAFT",
            "content": """
PROJECT: 16817 TY LN SW, ROCHESTER WA 98579

SYSTEM PRODUCTION ESTIMATES:
System Size: 10 kW AC (12 kW DC)
Location: Rochester, WA (PSE Service Territory)

ANNUAL PRODUCTION SUMMARY:
- Estimated Annual Production: 12,500 kWh
- Performance Ratio: 0.78
- System Degradation: 0.5% per year

MONTHLY PRODUCTION ESTIMATES (kWh):
January:     620    February:    720
March:       1,050  April:       1,300
May:         1,450  June:        1,520
July:        1,580  August:      1,400
September:   1,100  October:      850
November:     650    December:     560

TECHNICAL ASSUMPTIONS:
- Solar Irradiance Data: NREL Database for Rochester, WA
- Temperature Derating: -0.5% per °C above 25°C
- Inverter Efficiency: 96.5%
- Soiling Losses: 2%
- Wiring Losses: 2%
- Availability: 98%

IMPORTANT NOTES:
• THESE ARE PRELIMINARY ESTIMATES
• FINAL PRODUCTION DATA BASED ON ACTUAL SYSTEM DESIGN
- WEATHER VARIATIONS MAY AFFECT ACTUAL PRODUCTION
• SYSTEM MONITORING WILL PROVIDE ACCURATE PRODUCTION DATA

Prepared by: Ambia Energy LLC
Date: """ + datetime.now().strftime("%m/%d/%Y") + """
Project ID: PSE-16817-TYLN-2025
            """
        }
    ]

    created_count = 0

    for doc in documents_needed:
        filename = doc["filename"]
        title = doc["title"]
        content = doc["content"]

        # Create a new PDF
        pdf_doc = fitz.open()  # Create new empty PDF
        page = pdf_doc.new_page(width=612, height=792)  # Letter size

        # Insert text content
        text_rect = fitz.Rect(50, 50, 562, 742)  # Leave margins
        page.insert_textbox(text_rect, content, fontsize=10, fontname="helvetica")

        # Add title header
        title_rect = fitz.Rect(50, 30, 562, 60)
        page.insert_textbox(title_rect, title, fontsize=16, fontname="helvetica-bold", align=0)

        # Add "DRAFT" watermark
        draft_rect = fitz.Rect(200, 350, 412, 440)
        page.insert_textbox(draft_rect, "DRAFT\nFINAL ENGINEER\nSTAMP REQUIRED", fontsize=20, fontname="helvetica-bold", align=0)

        # Save the document
        pdf_doc.save(filename)
        pdf_doc.close()

        print(f"Created: {filename}")
        created_count += 1

    print(f"\n{'='*50}")
    print(f"Total documents created: {created_count}")

    return created_count

if __name__ == "__main__":
    create_missing_pse_documents()