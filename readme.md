# Offline PDF Utility Desktop Application

## Overview

This project is an **offline desktop PDF utility application** built for **internal company use** to process **confidential PDF documents** without relying on third-party or cloud-based services.

It is designed as a **cost-effective replacement** for tools like Adobe Acrobat and iLovePDF, while ensuring:
- Complete data privacy
- Offline execution
- Lossless handling of engineering and diagram-heavy PDFs (P&ID, process diagrams)

---

## Key Principles

- Fully **offline**
- **No cloud uploads**
- Uses **only free and open-source software**
- Designed for **Windows**
- Safe for **confidential company documents**

---

## Features

### Implemented Modules

- Merge PDFs (lossless)
- Split PDFs (by page range or extract all pages)
- Delete selected pages from a PDF
- Make PDFs copyable and searchable (OCR)
- Desktop application with clean and simple UI

---

## Architecture

      Desktop Application (Electron + React)
               ↓
      Local Backend API (FastAPI)
               ↓
      PDF Processing Engine
               ↓
      Local File System


All processing happens **locally on the user's machine**.  
Temporary files are cleaned automatically after each operation.

---

## Technology Stack

### Frontend (Desktop UI)
- Electron
- React (Vite)

### Backend
- Python
- FastAPI

### PDF Processing (Open Source)
- pikepdf – merge, split, delete pages
- PyMuPDF (fitz) – text detection
- ocrmypdf – OCR processing
- Tesseract OCR – OCR engine (system dependency)
- Ghostscript – PDF rendering (system dependency)

---

## Project Structure

      project-root/
      │
      ├── backend/
      │ ├── main.py
      │ ├── api_router.py
      │ ├── modules/
      │ │ ├── pdf_ops.py
      │ │ └── ocr_ops.py
      │ └── requirements.txt
      │
      ├── desktop_app/
      │ ├── src/
      │ │ ├── pages/
      │ │ ├── components/
      │ │ └── App.jsx
      │ ├── main.js
      │ └── preload.js
      │
      ├── scripts/
      │ ├── install_deps.bat
      │ └── start_dev.bat
      │
      └── README.md


---

## System Requirements (Windows)

### Required Software

1. **Windows OS**
2. **Python 3.10 or higher**
3. **Node.js (LTS version)**
4. **Tesseract OCR**
   - Download from: https://github.com/UB-Mannheim/tesseract/wiki
   - Add Tesseract to system `PATH`
5. **Ghostscript**
   - Install standard Windows version
   - Ensure Ghostscript is added to `PATH`

> If Tesseract or Ghostscript is not installed, the OCR feature will return a clear error message.

---

## How to Run (Development Mode)

### Step 1: Install Dependencies
    scripts\install_deps.bat

### Step 2: Start the Application
    scripts\start_dev.bat

## This will:

- Start the FastAPI backend locally
- Launch the Electron desktop application automatically

---

## How to Use

### Merge PDF
- Open Merge PDF
- Select multiple PDF files
- Reorder files if needed
- Click Merge
- Merged PDF downloads automatically

### Split PDF
- Open Split PDF
- Upload a PDF
- Choose split mode (page range or extract all pages)
- Download the resulting ZIP file

### Delete Pages
- Open Delete Pages
- Upload a PDF
- Enter page numbers to remove (e.g., 1,3,5)
- Download the updated PDF

### Make PDF Copyable (OCR)
- Open OCR & Search
- Upload a PDF
- App checks if text already exists
- If scanned, run OCR (may take time)
- Download searchable PDF

### Known Limitations
-   OCR accuracy depends on scan quality
- OCR may take longer for large PDFs

### Tesseract and Ghostscript must be installed manually

### PDF to Word conversion is intentionally not included

---

## License
This project uses only free and open-source libraries and is intended for internal company use.

### Notes
- No user authentication
- No database
- No internet connection required

### Designed to be extended with additional PDF modules if needed# PDF-Utility-Platform
