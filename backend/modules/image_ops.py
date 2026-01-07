import fitz  # PyMuPDF
import os
import zipfile
from typing import List

def pdf_to_images(pdf_path: str, output_dir: str) -> str:
    """
    Converts each page of a PDF to high-quality PNG (300 DPI).
    Returns path to a ZIP file containing all images.
    """
    try:
        doc = fitz.open(pdf_path)
        image_paths = []
        
        # 300 DPI = ~4.166 scaling factor from standard 72 DPI
        zoom_matrix = fitz.Matrix(300 / 72, 300 / 72)
        
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=zoom_matrix)
            # Use 3 digits for sorting: page_001.png
            image_name = f"page_{i+1:03d}.png"
            image_path = os.path.join(output_dir, image_name)
            pix.save(image_path)
            image_paths.append(image_path)
            
        # Create ZIP
        zip_path = os.path.join(output_dir, "extracted_images.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for img in image_paths:
                zipf.write(img, os.path.basename(img))
                
        return zip_path
        
    except Exception as e:
        print(f"Error converting PDF to images: {e}")
        raise e

def images_to_pdf(image_paths: List[str], output_path: str):
    """
    Converts a list of images to a single PDF.
    Preserves original image dimensions.
    """
    try:
        doc = fitz.open()
        
        for img_path in image_paths:
            # Insert each image as a new page
            img_doc = fitz.open(img_path)
            pdf_bytes = img_doc.convert_to_pdf()
            img_pdf = fitz.open("pdf", pdf_bytes)
            doc.insert_pdf(img_pdf)
            
        doc.save(output_path)
        
    except Exception as e:
        print(f"Error converting images to PDF: {e}")
        raise e
