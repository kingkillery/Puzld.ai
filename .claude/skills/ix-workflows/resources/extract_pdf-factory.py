#!/usr/bin/env python3
import PyPDF2
import re

def extract_utility_info(pdf_path):
    """Extract utility account number and meter number from PDF"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text()

            print("Extracted text from PDF:")
            print("=" * 50)
            print(text)
            print("=" * 50)

            # Look for utility account number patterns
            account_patterns = [
                r'Account\s*(?:Number|#)?[:\s]*([A-Z0-9-]+)',
                r'Utility\s*Account\s*(?:Number|#)?[:\s]*([A-Z0-9-]+)',
                r'Customer\s*Account[:\s]*([A-Z0-9-]+)',
                r'Account\s*ID[:\s]*([A-Z0-9-]+)'
            ]

            # Look for meter number patterns
            meter_patterns = [
                r'Meter\s*(?:Number|#)?[:\s]*([A-Z0-9-]+)',
                r'Meter\s*ID[:\s]*([A-Z0-9-]+)',
                r'Service\s*Meter[:\s]*([A-Z0-9-]+)'
            ]

            # Look for customer name
            name_patterns = [
                r'Customer\s*Name[:\s]*([A-Z\s]+)',
                r'Name[:\s]*([A-Z\s]+)'
            ]

            # Look for service address
            address_patterns = [
                r'Service\s*Address[:\s]*([0-9]+\s+[A-Z\s]+\d+)',
                r'Address[:\s]*([0-9]+\s+[A-Z\s]+\d+)'
            ]

            found_info = {}

            for pattern in account_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    found_info['account_number'] = match.group(1).strip()
                    break

            for pattern in meter_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    found_info['meter_number'] = match.group(1).strip()
                    break

            for pattern in name_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    found_info['customer_name'] = match.group(1).strip()
                    break

            for pattern in address_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    found_info['service_address'] = match.group(1).strip()
                    break

            return found_info

    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return {}

if __name__ == "__main__":
    result = extract_utility_info("Utility_Bill_Combined_2803083.pdf")
    print("\nExtracted Information:")
    for key, value in result.items():
        print(f"{key}: {value}")