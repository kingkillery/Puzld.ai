#!/usr/bin/env python3

import fitz  # PyMuPDF
import os

def extract_all_pages(pdf_path):
    """Extract all individual pages from PDF"""
    try:
        doc = fitz.open(pdf_path)
        pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
        output_dir = "extracted_pages"

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
        print(f"\nSuccessfully extracted {len(extracted_files)} pages to {output_dir}/")
        return extracted_files

    except Exception as e:
        print(f"Error extracting pages: {e}")
        return []

if __name__ == "__main__":
    pdf_path = "16817 Ty Ln SW Install Agreement.pdf"
    extract_all_pages(pdf_path)