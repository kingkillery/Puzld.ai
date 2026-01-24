
import pypdf
import re
import os

def extract_text_from_pdf(file_path):
    try:
        reader = pypdf.PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error reading {file_path}: {e}"

def analyze_engineering(text):
    print("\n--- ENGINEERING PLAN ANALYSIS ---")

    # System Size
    kw_match = re.search(r'(\d+\.?\d*)\s*kW\s*System', text, re.IGNORECASE)
    if kw_match:
        print(f"System Size: {kw_match.group(1)} kW")

    # Inverter - Specific Search
    inv_match = re.search(r'(SolarEdge|Enphase|Fronius|SMA|Tigo|APSystems|Hoymiles)\s+([A-Za-z0-9-]+)', text, re.IGNORECASE)
    if inv_match:
        print(f"Inverter: {inv_match.group(1)} {inv_match.group(2)}")
    else:
        # Generic Inverter line
        inv_line = re.search(r'Inverter\s*[:.]?\s*([^\n]+)', text, re.IGNORECASE)
        if inv_line:
            print(f"Inverter Line: {inv_line.group(1).strip()}")

    # Panel Count and Wattage
    panel_match = re.search(r'(\d+)\s*x\s*([A-Za-z0-9\s-]+)\s*(\d{3})W', text, re.IGNORECASE)
    if panel_match:
        print(f"Panels: {panel_match.group(1)} x {panel_match.group(2)} ({panel_match.group(3)}W)")

    # Address
    addr_match = re.search(r'(?:Address|Residence)\s*[:.]?\s*(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Ave|Dr|Rd|Ct|Ln|Way|Blvd)[^,\n]*)', text, re.IGNORECASE)
    if addr_match:
        print(f"Address: {addr_match.group(1).strip()}")

    # Check for keywords indicating documents
    if "One-Line" in text or "Single Line" in text or "Three-Line" in text:
        print("Document Check: One-Line Diagram likely present")

    if "Specifications" in text or "Cut Sheet" in text or "Datasheet" in text:
        print("Document Check: Cut Sheets likely present")

def main():
    base_path = r"c:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\IX-Agent-Full\IX-Agentv5\uploads"
    eng_path = os.path.join(base_path, "Rachel Ballou-Church Engineering 11-06-25.pdf")

    print(f"Processing Engineering: {eng_path}")
    eng_text = extract_text_from_pdf(eng_path)
    analyze_engineering(eng_text)

if __name__ == "__main__":
    main()
