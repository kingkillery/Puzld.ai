
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

def find_inverter(text):
    print("--- INVERTER SEARCH ---")
    # Common brands
    brands = ["SolarEdge", "Enphase", "Fronius", "SMA", "Tigo", "APSystems", "Hoymiles", "Tesla", "Delta", "GoodWe"]

    for brand in brands:
        matches = re.finditer(f"{brand}.{{0,50}}", text, re.IGNORECASE)
        found = False
        for match in matches:
            print(f"Potential Match ({brand}): {match.group(0)}")
            found = True
        if found:
            return

    # Look for "Inv" or "Inverter"
    matches = re.finditer(r"(?:Inv|Inverter).{0,100}", text, re.IGNORECASE)
    for match in matches:
        print(f"Context Match: {match.group(0)}")

def main():
    base_path = r"c:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\IX-Agent-Full\IX-Agentv5\uploads"
    eng_path = os.path.join(base_path, "Rachel Ballou-Church Engineering 11-06-25.pdf")

    print(f"Scanning: {eng_path}")
    eng_text = extract_text_from_pdf(eng_path)
    find_inverter(eng_text)

if __name__ == "__main__":
    main()
