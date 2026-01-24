from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import tempfile
import uuid
from modules.converter_ops import convert_pdf_to_docx, convert_pdf_to_pptx

router = APIRouter(
    prefix="/api/convert",
    tags=["convert"]
)

@router.post("/pdf-to-word")
async def pdf_to_word_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    temp_dir = tempfile.mkdtemp(prefix="pdf_util_p2w_")
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Not a PDF")
            
        input_path = os.path.join(temp_dir, f"input_{uuid.uuid4()}.pdf")
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_path = os.path.join(temp_dir, "converted.docx")
        
        convert_pdf_to_docx(input_path, output_path)
        
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        
        return FileResponse(
            path=output_path,
            filename=f"{os.path.splitext(file.filename)[0]}.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pdf-to-ppt")
async def pdf_to_ppt_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    temp_dir = tempfile.mkdtemp(prefix="pdf_util_p2ppt_")
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Not a PDF")
            
        input_path = os.path.join(temp_dir, f"input_{uuid.uuid4()}.pdf")
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_path = os.path.join(temp_dir, "converted.pptx")
        
        convert_pdf_to_pptx(input_path, output_path)
        
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        
        return FileResponse(
            path=output_path,
            filename=f"{os.path.splitext(file.filename)[0]}.pptx",
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

