import os
import tempfile
import shutil


# =========================
# TEXT DETECTION
# =========================

def has_text(pdf_path: str) -> bool:
    """
    Check if a PDF already contains extractable text.
    Uses PyMuPDF (fitz).
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return False

    try:
        doc = fitz.open(pdf_path)
        for page in doc[:5]:  # check first few pages only
            text = page.get_text()
            if text and text.strip():
                return True
        return False
    except Exception:
        return False


# =========================
# OCR PROCESSING
# =========================

def run_ocr(input_pdf: str, output_pdf: str):
    """
    Run OCR on a PDF and GUARANTEE searchable output.
    """

    try:
        import ocrmypdf
    except ImportError:
        raise RuntimeError("OCRmyPDF is not installed")

    # Determine OCR mode
    pdf_has_text = has_text(input_pdf)

    # OCR flags (ONLY ONE MODE IS USED)
    if pdf_has_text:
        # Mixed PDF → redo OCR safely
        ocr_kwargs = {
            "redo_ocr": True,
            "force_ocr": False,
            "skip_text": False,
        }
    else:
        # Scanned PDF → force OCR
        ocr_kwargs = {
            "force_ocr": True,
            "skip_text": False,
        }

    try:
        ocrmypdf.ocr(
            input_pdf,
            output_pdf,
            **ocr_kwargs,
            rotate_pages=True,
            deskew=True,
            output_type="pdf",
            optimize=0,          # VERY IMPORTANT (no pngquant)
            progress_bar=False
        )

    except Exception as e:
        error_msg = str(e).lower()

        if "tesseract" in error_msg:
            raise RuntimeError("Tesseract OCR is missing or not configured")

        if "ghostscript" in error_msg:
            raise RuntimeError("Ghostscript is missing or not configured")

        raise RuntimeError(f"OCR failed: {e}")
