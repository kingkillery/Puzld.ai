
import pypdf
import os

def extract_images_from_pdf(pdf_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    reader = pypdf.PdfReader(pdf_path)
    count = 0

    print(f"Extracting images from {pdf_path}...")

    for page_num, page in enumerate(reader.pages):
        for image_file_object in page.images:
            try:
                with open(os.path.join(output_dir, f"page{page_num}_{image_file_object.name}"), "wb") as fp:
                    fp.write(image_file_object.data)
                    print(f"Saved: page{page_num}_{image_file_object.name}")
                    count += 1
            except Exception as e:
                print(f"Error saving image: {e}")

    if count == 0:
        print("No images found in the PDF.")
    else:
        print(f"Extracted {count} images.")

if __name__ == "__main__":
    base_path = r"c:\Users\prest\Desktop\Desktop_Projects\May-Dec-2025\IX-Agent-Full\IX-Agentv5\uploads"
    bill_path = os.path.join(base_path, "Utility_Bill_Combined_2754839.pdf")
    output_folder = os.path.join(base_path, "extracted_bill_images")

    extract_images_from_pdf(bill_path, output_folder)
