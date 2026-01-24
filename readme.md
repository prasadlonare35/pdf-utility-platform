# Offline PDF Utility Platform

A **secure, offline desktop application** for processing sensitive PDF documents. Built for environments where data privacy is paramount and cloud services are restricted.

![Platform](https://img.shields.io/badge/Platform-Windows-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

## 🚀 Overview

This application provides essential PDF tools in a unified, user-friendly desktop interface. It runs completely locally on your machine—**zero data is ever sent to the cloud**.

**Target Audience:** Law firms, financial institutions, engineering firms, and corporate environments requiring strict data confidentiality.

### Key Features
*   **Merge**: Combine multiple PDFs into one.
*   **Split**: Extract specific pages or split by range.
*   **Delete Pages**: Remove unwanted pages instantly.
*   **OCR**: Make scanned PDFs searchable and copyable (via Tesseract).
*   **Convert**: 
    *   PDF → Word (`.docx`)
    *   PDF → PowerPoint (`.pptx`)
    *   IMAGES → PDF
    *   PDF → IMAGES

## 🛠 Tech Stack

*   **Frontend**: Electron, React, Vite (Modern, responsive UI)
*   **Backend**: Python, FastAPI (High-performance local server)
*   **Packaging**: PyInstaller (Backend), Electron Builder (Frontend)
*   **Core Engines**:
    *   `pikepdf`: Lossless manipulation
    *   `PyMuPDF` (`fitz`): Rendering & Text extraction
    *   `ocrmypdf`: OCR Layer
    *   `pdf2docx` & `python-pptx`: document conversion

## 📋 Prerequisites

Before installing, ensure you have:

1.  **Windows 10/11**
2.  **Python 3.10+** ([Download](https://www.python.org/downloads/))
3.  **Node.js 18+ (LTS)** ([Download](https://nodejs.org/))
4.  **Tesseract OCR** (Required for OCR feature)
    *   [Download Installer](https://github.com/UB-Mannheim/tesseract/wiki)
    *   **Important**: Add Tesseract to your System PATH during installation.
5.  **Ghostscript** (Required for OCR compression)
    *   [Download Installer](https://ghostscript.com/releases/gsdnld.html)

## 📦 Installation (Build from Source)

Follow these steps to build the application from scratch.

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/pdf-utility-platform.git
cd pdf-utility-platform
```

### 2. Backend Setup
Set up the Python environment and dependencies.
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```
*Optional: To build the standalone backend executable manually:*
```bash
pyinstaller main.spec
```

### 3. Frontend Setup
Install Node dependencies and build the UI.
```bash
cd ..\desktop_app
npm install
npm run build
```

### 4. Create Final Installer
Package everything into a Windows Installer (`.exe`).
```bash
npm run dist
```
The final installer will be located in `desktop_app/dist/`.

## 🏃 Running the App

### Development Mode
Run this command to start both Backend (FastAPI) and Frontend (Electron) with hot-reloading:
```bash
# From project root
scripts\start_dev.bat
```

### Installed App
Once installed via the `.exe`, the app manages its own backend process automatically in the background.

## ❓ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| **OCR Failed / "ocr_my_pdf not found"** | Tesseract or Ghostscript missing | Install them and restart your PC. Ensure they are in PATH. |
| **Blank Screen on Launch** | Backend failed to start | Check `app.log` in `%APPDATA%\pdf-utility-platform\`. |
| **"Conversion dependency missing"** | Python libs missing | Re-run `pip install -r requirements.txt` in backend. |
| **Large Installer Size (~300MB)** | Bundles simplified Python env | This is normal/expected for a portable offline app. |

## 📂 Project Structure

```graphql
pdf-utility-platform/
├── backend/                # Python FastAPI Server
│   ├── modules/            # Core Logic (pdf_ops, ocr, converters)
│   ├── routers/            # API Endpoints
│   ├── main.py             # Entry Point
│   └── requirements.txt    # Python Dependencies
├── desktop_app/            # Electron + React Frontend
│   ├── src/                # React UI Components
│   ├── electron/           # Main Process (Node.js)
│   └── package.json        # Node Dependencies
├── scripts/                # Utility Bat scripts
└── README.md               # Documentation
```

## 👤 Author
**Prasad**  
*Built for learning secure desktop application architecture.*
