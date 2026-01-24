#!/usr/bin/env python3

import fitz  # PyMuPDF
import os
import sys

def analyze_pdf(pdf_path):
    """Analyze PDF to get page count and extract text from first few pages"""
    try:
        doc = fitz.open(pdf_path)
        print(f"PDF: {pdf_path}")
        print(f"Total pages: {len(doc)}")
        print("-" * 50)

        # Extract text from first few pages to identify content
        for i in range(min(5, len(doc))):
            page = doc[i]
            text = page.get_text()
            print(f"Page {i+1}:")
            # Clean text for display
            clean_text = ''.join(char if ord(char) < 128 else '?' for char in text)
            print(f"Text preview: {clean_text[:200]}...")
            print("-" * 30)

        doc.close()
        return len(doc)
    except Exception as e:
        print(f"Error analyzing PDF: {e}")
        return 0

def extract_pages(pdf_path, output_dir):
    """Extract individual pages from PDF"""
    try:
        doc = fitz.open(pdf_path)
        pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]

        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        extracted_files = []

        for page_num in range(len(doc)):
            page = doc[page_num]

            # Create new PDF with just this page
            new_doc = fitz.open()
            new_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)

            # Save the individual page
            output_filename = f"{pdf_name}_Page_{page_num + 1}.pdf"
            output_path = os.path.join(output_dir, output_filename)
            new_doc.save(output_path)
            new_doc.close()

            extracted_files.append(output_path)
            print(f"Extracted page {page_num + 1} -> {output_filename}")

        doc.close()
        print(f"\nSuccessfully extracted {len(extracted_files)} pages to {output_dir}")
        return extracted_files

    except Exception as e:
        print(f"Error extracting pages: {e}")
        return []

if __name__ == "__main__":
    pdf_path = "16817 Ty Ln SW Install Agreement.pdf"

    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found")
        sys.exit(1)

    # First analyze the PDF
    page_count = analyze_pdf(pdf_path)

    if page_count > 0:
        # Extract all pages
        output_dir = "extracted_pages"
        extract_pages(pdf_path, output_dir)