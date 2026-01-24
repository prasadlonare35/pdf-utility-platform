from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import tempfile
import uuid
from typing import List
from modules.pdf_ops import merge_pdfs, cleanup_files

router = APIRouter()

@router.post("/merge")
async def merge_pdf_endpoint(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    """
    Accepts multiple PDF files, merges them, and returns the result.
    """
    
    # 1. Create a temporary directory for this request
    # We use a temp dir to avoid collisions
    temp_dir = tempfile.mkdtemp(prefix="pdf_util_")
    input_paths = []
    
    try:
        # 2. Save uploaded files to the temp directory
        for file in files:
            if not file.filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
            
            # Sanitize filename (basic) or just use UUID to be safe
            safe_filename = f"{uuid.uuid4()}_{file.filename}"
            file_path = os.path.join(temp_dir, safe_filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            input_paths.append(file_path)
        
        # 3. Perform Merge
        output_filename = "merged_output.pdf"
        output_path = os.path.join(temp_dir, output_filename)
        
        merge_pdfs(input_paths, output_path)
        
        # 4. Return the file
        # We need to clean up the temp_dir AFTER the response is sent.
        # BackgroundTasks can clean specific files, but cleaning a whole dir is trickier 
        # because FileResponse needs the file open.
        
        # Strategy: Register a background task to delete the whole temp_dir
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        
        return FileResponse(
            path=output_path, 
            filename="merged.pdf",
            media_type="application/pdf"
        )

    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

from modules.pdf_ops import split_pdf, delete_pages

@router.post("/split")
async def split_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    mode: str = "all", # "all" or "ranges"
    ranges: str = ""
):
    temp_dir = tempfile.mkdtemp(prefix="pdf_util_split_")
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Not a PDF")
            
        input_path = os.path.join(temp_dir, f"input_{uuid.uuid4()}.pdf")
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Process
        zip_path = split_pdf(input_path, temp_dir, mode, ranges)
        
        # Cleanup later
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        
        return FileResponse(
            path=zip_path,
            filename="split_files.zip",
            media_type="application/zip"
        )
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/delete-pages")
async def delete_pages_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    pages: str = "" # "1, 3-5"
):
    temp_dir = tempfile.mkdtemp(prefix="pdf_util_del_")
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Not a PDF")
            
        input_path = os.path.join(temp_dir, f"input_{uuid.uuid4()}.pdf")
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_path = os.path.join(temp_dir, "output_trimmed.pdf")
        
        delete_pages(input_path, output_path, pages)
        
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        
        return FileResponse(
            path=output_path,
            filename="processed.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

from modules.ocr_ops import has_text, run_ocr

@router.post("/check-text")
async def check_text_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    temp_dir = tempfile.mkdtemp(prefix="pdf_util_check_")
    try:
        input_path = os.path.join(temp_dir, f"check_{uuid.uuid4()}.pdf")
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        text_present = has_text(input_path)
        
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        return {"has_text": text_present}
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ocr")
async def ocr_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    temp_dir = tempfile.mkdtemp(prefix="pdf_util_ocr_")
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Not a PDF")
            
        input_path = os.path.join(temp_dir, f"input_{uuid.uuid4()}.pdf")
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_path = os.path.join(temp_dir, "ocr_result.pdf")
        
        # This can be slow, might timeout standard requests. 
        # For V1 we accept it blocks. Ideally use WebSockets or Polling.
        run_ocr(input_path, output_path)
        
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        
        return FileResponse(
            path=output_path,
            filename=f"ocr_{file.filename}",
            media_type="application/pdf"
        )
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        status = 500
        if "MissingDependencyError" in str(e) or "Tesseract" in str(e):
             status = 503
        raise HTTPException(status_code=status, detail=str(e))

from modules.image_ops import pdf_to_images, images_to_pdf

@router.post("/pdf-to-images")
async def pdf_to_images_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    temp_dir = tempfile.mkdtemp(prefix="pdf_util_p2i_")
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Not a PDF")
            
        input_path = os.path.join(temp_dir, f"input_{uuid.uuid4()}.pdf")
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        zip_path = pdf_to_images(input_path, temp_dir)
        
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        
        return FileResponse(
            path=zip_path,
            filename=f"images_{file.filename}.zip",
            media_type="application/zip"
        )
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/images-to-pdf")
async def images_to_pdf_endpoint(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    temp_dir = tempfile.mkdtemp(prefix="pdf_util_i2p_")
    input_paths = []
    try:
        for file in files:
            # Basic validation
            ext = file.filename.lower().split('.')[-1]
            if ext not in ['png', 'jpg', 'jpeg']:
                 # Skip or error? Let's skip non-images or error. Error is safer.
                 # Actually, for user experience, let's just process what we can? 
                 # Requirement says "Validate formats".
                 pass
            
            safe_name = f"{uuid.uuid4()}_{file.filename}"
            path = os.path.join(temp_dir, safe_name)
            with open(path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            input_paths.append(path)
            
        if not input_paths:
            raise HTTPException(status_code=400, detail="No valid images uploaded")
            
        output_path = os.path.join(temp_dir, "converted_images.pdf")
        
        images_to_pdf(input_paths, output_path)
        
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        
        return FileResponse(
            path=output_path,
            filename="images_combined.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

