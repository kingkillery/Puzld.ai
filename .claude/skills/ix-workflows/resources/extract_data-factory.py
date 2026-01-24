
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

def analyze_bill(text):
    print("--- BILL ANALYSIS ---")
    # Account Number pattern (looking for common formats or "Account Number" label)
    # Peninsula Light account numbers often look like XXXXXXX or XXXXX-XX
    account_match = re.search(r'Account\s*#?\s*[:.]?\s*(\d+[-\s]?\d+)', text, re.IGNORECASE)
    if account_match:
        print(f"Account Number: {account_match.group(1)}")
    else:
        # Fallback: look for just digits that might be an account number near "Account"
        account_match = re.search(r'Account\s*(?:Number)?\s*(\d{4,})', text, re.IGNORECASE)
        if account_match:
             print(f"Account Number: {account_match.group(1)}")
        else:
             print("Account Number: Not found")

    # Service Address
    # Looking for "Service Address" or address-like patterns
    address_match = re.search(r'Service\s*Address\s*[:.]?\s*(.*?)(?:\n|$)', text, re.IGNORECASE)
    if address_match:
        print(f"Service Address: {address_match.group(1).strip()}")
    else:
        print("Service Address: Not found explicitly (check full text)")

    # Print first 500 chars to help debug if regex fails
    print("\n--- Bill Text Preview (First 500 chars) ---")
    print(text[:500])

def analyze_engineering(text):
    print("\n--- ENGINEERING PLAN ANALYSIS ---")

    # System Size
    kw_match = re.search(r'(?:System Size|Total Size|Generator Size)\s*[:.]?\s*(\d+\.?\d*)\s*(?:kW|kW DC)', text, re.IGNORECASE)
    if kw_match:
        print(f"System Size: {kw_match.group(1)} kW")
    else:
        # Look for "kW" closely following a number
        kw_match = re.search(r'(\d+\.?\d*)\s*(?:kW)\s*(?:STC|DC)', text, re.IGNORECASE)
        if kw_match:
            print(f"System Size: {kw_match.group(1)} kW")
        else:
            print("System Size: Not found")

    # Panels
    panels_match = re.search(r'(\d+)\s*x\s*(?:Modules|Panels)', text, re.IGNORECASE)
    if panels_match:
        print(f"Number of Panels: {panels_match.group(1)}")
    else:
        # Try finding "Modules" and looking back
        panels_match = re.search(r'Modules\s*[:.]?\s*(\d+)', text, re.IGNORECASE)
        if panels_match:
             print(f"Number of Panels: {panels_match.group(1)}")
        else:
             print("Number of Panels: Not found")

    # Panel Wattage
    watt_match = re.search(r'(\d{3})\s*W(?:att)?', text, re.IGNORECASE)
    if watt_match:
        print(f"Panel Wattage: {watt_match.group(1)} W")
    else:
        print("Panel Wattage: Not found")

    # Inverter
    inv_match = re.search(r'Inverter\s*[:.]?\s*(.*?)(?:\n|$|Qty)', text, re.IGNORECASE)
    if inv_match:
        print(f"Inverter: {inv_match.group(1).strip()}")
    else:
        # Look for common inverter names
        inv_match = re.search(r'(SolarEdge|Enphase|Fronius|SMA)\s+([A-Za-z0-9-]+)', text, re.IGNORECASE)
        if inv_match:
             print(f"Inverter: {inv_match.group(1)} {inv_match.group(2)}")
        else:
             print("Inverter: Not found")

    # Address
    site_addr = re.search(r'(?:Job|Site|Project)\s*Address\s*[:.]?\s*(.*?)(?:\n|$)', text, re.IGNORECASE)
    if site_addr:
        print(f"Installation Address: {site_addr.group(1).strip()}")
    else:
        print("Installation Address: Not found explicitly")

    print("\n--- Engineering Text Preview (First 1000 chars) ---")
    print(text[:1000])

def main():
    base_path = r"c:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\IX-Agent-Full\IX-Agentv5\uploads"

    bill_path = os.path.join(base_path, "Utility_Bill_Combined_2754839.pdf")
    eng_path = os.path.join(base_path, "Rachel Ballou-Church Engineering 11-06-25.pdf")

    print(f"Processing Bill: {bill_path}")
    bill_text = extract_text_from_pdf(bill_path)
    analyze_bill(bill_text)

    print(f"\nProcessing Engineering: {eng_path}")
    eng_text = extract_text_from_pdf(eng_path)
    analyze_engineering(eng_text)

if __name__ == "__main__":
    main()
