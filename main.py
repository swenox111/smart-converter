import os
import shutil
import uuid
import zipfile
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from converters import pdf_engine, doc_engine, ocr_engine

app = FastAPI(title="Smart Suite", version="1.0.0")

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_files")
os.makedirs(TEMP_DIR, exist_ok=True)

def cleanup_file(path: str):
    """Clean up temporary generated file after download."""
    try:
        if os.path.exists(path):
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.remove(path)
    except Exception as e:
        print(f"Error cleaning up path {path}: {e}")

@app.post("/api/convert")
async def convert_file(
    background_tasks: BackgroundTasks,
    tool_id: str = Form(...),
    files: List[UploadFile] = File(...),
    rotation_angle: Optional[int] = Form(90),
    page_numbers: Optional[str] = Form(None), # e.g. "1,2,5"
    compression_level: Optional[str] = Form("medium")
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    job_id = str(uuid.uuid4())
    job_dir = os.path.join(TEMP_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    saved_files = []
    for upload in files:
        file_path = os.path.join(job_dir, upload.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload.file, buffer)
        saved_files.append(file_path)

    out_file = os.path.join(job_dir, f"converted_{job_id[:8]}")

    try:
        # 1. Compress
        if tool_id == "compress_pdf":
            out_file += ".pdf"
            pdf_engine.compress_pdf(saved_files[0], out_file, compression_level)

        # 2. Image to PDF
        elif tool_id in ("image_to_pdf", "jpg_to_pdf", "png_to_pdf", "webp_to_pdf", "bmp_to_pdf"):
            out_file += ".pdf"
            pdf_engine.images_to_pdf(saved_files, out_file)

        # 3. PDF to Image
        elif tool_id in ("pdf_to_image", "pdf_to_jpg", "pdf_to_png"):
            fmt = "PNG" if tool_id == "pdf_to_png" else "JPEG"
            img_dir = os.path.join(job_dir, "images")
            generated_images = pdf_engine.pdf_to_images(saved_files[0], img_dir, img_format=fmt)
            
            if len(generated_images) == 1:
                out_file = generated_images[0]
            else:
                out_file += ".zip"
                with zipfile.ZipFile(out_file, 'w') as zipf:
                    for img in generated_images:
                        zipf.write(img, os.path.basename(img))

        # 4. Office to PDF
        elif tool_id in ("word_to_pdf", "doc_to_pdf"):
            out_file += ".pdf"
            doc_engine.docx_to_pdf(saved_files[0], out_file)
        elif tool_id in ("excel_to_pdf", "xls_to_pdf"):
            out_file += ".pdf"
            doc_engine.xlsx_to_pdf(saved_files[0], out_file)
        elif tool_id in ("ppt_to_pdf", "pptx_to_pdf"):
            out_file += ".pdf"
            doc_engine.pptx_to_pdf(saved_files[0], out_file)

        # 5. OpenOffice to PDF
        elif tool_id in ("openoffice_to_pdf", "odt_to_pdf", "ods_to_pdf", "odp_to_pdf"):
            out_file += ".pdf"
            doc_engine.openoffice_to_pdf(saved_files[0], out_file)

        # 6. Convert to PDF
        elif tool_id in ("txt_to_pdf", "rtf_to_pdf", "hwp_to_pdf"):
            out_file += ".pdf"
            doc_engine.txt_to_pdf(saved_files[0], out_file)
        elif tool_id == "csv_to_pdf":
            out_file += ".pdf"
            doc_engine.csv_to_pdf(saved_files[0], out_file)
        elif tool_id == "html_to_pdf":
            out_file += ".pdf"
            doc_engine.html_to_pdf(saved_files[0], out_file)
        elif tool_id == "zip_to_pdf":
            out_file += ".pdf"
            doc_engine.zip_to_pdf(saved_files[0], out_file)
        elif tool_id in ("epub_to_pdf", "iwork_to_pdf", "pages_to_pdf"):
            out_file += ".pdf"
            doc_engine.txt_to_pdf(saved_files[0], out_file)

        # 7. PDF to Office
        elif tool_id == "pdf_to_word":
            out_file += ".docx"
            doc_engine.pdf_to_word(saved_files[0], out_file)
        elif tool_id == "pdf_to_excel":
            out_file += ".xlsx"
            doc_engine.pdf_to_excel(saved_files[0], out_file)
        elif tool_id == "pdf_to_ppt":
            out_file += ".pptx"
            doc_engine.pdf_to_ppt(saved_files[0], out_file)

        # 8. Organize Tools
        elif tool_id == "merge_pdf":
            out_file += ".pdf"
            pdf_engine.merge_pdfs(saved_files, out_file)
        elif tool_id == "split_pdf":
            split_dir = os.path.join(job_dir, "split_pages")
            split_files = pdf_engine.split_pdf(saved_files[0], split_dir)
            out_file += ".zip"
            with zipfile.ZipFile(out_file, 'w') as zipf:
                for f in split_files:
                    zipf.write(f, os.path.basename(f))
        elif tool_id == "rotate_pdf":
            out_file += ".pdf"
            pdf_engine.rotate_pdf(saved_files[0], out_file, rotation_angle or 90)
        elif tool_id in ("delete_pdf_pages", "extract_pdf_pages", "organize_pdf"):
            out_file += ".pdf"
            pages_list = [int(p.strip()) for p in page_numbers.split(",") if p.strip().isdigit()] if page_numbers else [1]
            if tool_id == "delete_pdf_pages":
                pdf_engine.delete_pdf_pages(saved_files[0], out_file, pages_list)
            elif tool_id == "extract_pdf_pages":
                pdf_engine.extract_pdf_pages(saved_files[0], out_file, pages_list)
            else:
                pdf_engine.organize_pdf_pages(saved_files[0], out_file, pages_list)

        # 9. OCR & PDF/A
        elif tool_id == "pdf_ocr":
            out_file += ".pdf"
            ocr_engine.perform_pdf_ocr(saved_files[0], out_file)
        elif tool_id == "pdf_to_pdfa":
            out_file += ".pdf"
            pdf_engine.convert_pdf_to_pdfa(saved_files[0], out_file)

        else:
            out_file += ".pdf"
            doc_engine.txt_to_pdf(saved_files[0], out_file)

    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(err)}")

    filename = os.path.basename(out_file)
    background_tasks.add_task(cleanup_file, job_dir)
    return FileResponse(out_file, media_type="application/octet-stream", filename=filename)

# Serve static web dashboard
static_path = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_path, exist_ok=True)
app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
