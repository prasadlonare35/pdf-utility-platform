import subprocess
import tempfile
import shutil
import fitz  # PyMuPDF
from pathlib import Path


def has_text(pdf_path: str) -> bool:
    """
    Checks if a PDF contains real extractable text.
    """
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            extracted = page.get_text().strip()
            if extracted:
                return True
        return False
    except Exception:
        return False


def run_ocr(input_pdf: str, output_pdf: str):
    """
    Perform high-quality OCR with preprocessing.
    Steps:
    1. Convert each page to high DPI (300 DPI) PNG.
    2. Rebuild a clean PDF from images.
    3. Run OCR with force-ocr and strong cleaning options.
    """

    # Step 0: Verify Tesseract & Ghostscript exist
    tesseract = shutil.which("tesseract")
    ghostscript = shutil.which("gswin64c") or shutil.which("gs")

    if not tesseract or not ghostscript:
        raise RuntimeError("Tesseract or Ghostscript not found in PATH. Install them first.")

    # Step 1: Create temp working directory
    temp_dir = Path(tempfile.mkdtemp())
    image_paths = []

    # Step 2: Render PDF pages as high-DPI PNG images
    pdf_doc = fitz.open(input_pdf)
    for i, page in enumerate(pdf_doc):
        pix = page.get_pixmap(dpi=300)  # Critical for accurate OCR
        img_path = temp_dir / f"page_{i + 1}.png"
        pix.save(img_path)
        image_paths.append(str(img_path))

    # Step 3: Rebuild a clean PDF from the high-quality images
    clean_pdf_path = temp_dir / "clean.pdf"
    output_doc = fitz.open()

    for img_file in image_paths:
        img_doc = fitz.open()
        rect = fitz.open(img_file)[0].rect

        # Create new blank page
        img_doc.insert_page(-1, width=rect.width, height=rect.height)
        page = img_doc[0]
        page.insert_image(rect, filename=img_file)

        output_doc.insert_pdf(img_doc)

    output_doc.save(clean_pdf_path)
    output_doc.close()

    # Step 4: Run OCR using command-line (more stable than Python API)
    # Strong settings similar to iLovePDF’s OCR pipeline
    ocr_cmd = [
        "ocrmypdf",
        "--force-ocr",
        "--output-type", "pdf",
        "--rotate-pages",
        "--deskew",
        "--pdfa-image-compression", "lossless",
        "--image-dpi", "300",
        str(clean_pdf_path),
        output_pdf
    ]


    try:
        subprocess.run(ocr_cmd, check=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"OCR failed: {str(e)}")

    # Step 5: Clean up temporary directory
    shutil.rmtree(temp_dir, ignore_errors=True)
