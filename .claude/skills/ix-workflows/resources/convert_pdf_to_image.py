#!/usr/bin/env python3
import fitz  # PyMuPDF
import os

def convert_pdf_to_image(pdf_path, output_folder=".", image_name="utility_bill_page"):
    """Convert PDF pages to images"""
    try:
        # Open the PDF file
        pdf_document = fitz.open(pdf_path)

        # Convert each page to an image
        for page_num in range(len(pdf_document)):
            # Get the page
            page = pdf_document.load_page(page_num)

            # Convert to image (pixmap)
            pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))  # 2x zoom for better quality

            # Save as PNG
            image_path = os.path.join(output_folder, f"{image_name}_{page_num + 1}.png")
            pix.save(image_path)
            print(f"Saved: {image_path}")

        pdf_document.close()
        return True

    except Exception as e:
        print(f"Error converting PDF: {e}")
        return False

if __name__ == "__main__":
    success = convert_pdf_to_image("Utility_Bill_Combined_2803083.pdf")
    if success:
        print("PDF successfully converted to images")