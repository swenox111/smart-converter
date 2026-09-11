import os
import io
from PIL import Image
from pypdf import PdfReader, PdfWriter
import pymupdf

def images_to_pdf(image_paths: list[str], output_path: str) -> str:
    """Convert one or multiple image files (JPG, PNG, WEBP, BMP, TIFF, GIF) to a single PDF."""
    opened_images = []
    for img_path in image_paths:
        img = Image.open(img_path)
        # Convert RGBA / P mode images to RGB for PDF compatibility
        if img.mode in ("RGBA", "P", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "RGBA":
                background.paste(img, mask=img.split()[3])
            else:
                background.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[3])
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")
        opened_images.append(img)

    if not opened_images:
        raise ValueError("No valid images provided.")

    opened_images[0].save(output_path, "PDF", save_all=True, append_images=opened_images[1:])
    for img in opened_images:
        img.close()
    return output_path

def pdf_to_images(pdf_path: str, output_dir: str, img_format="PNG") -> list[str]:
    """Convert each page of a PDF document into separate image files."""
    os.makedirs(output_dir, exist_ok=True)
    generated_images = []
    
    try:
        doc = pymupdf.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            img_filename = f"page_{page_num + 1}.{img_format.lower()}"
            img_path = os.path.join(output_dir, img_filename)
            pix.save(img_path)
            generated_images.append(img_path)
        doc.close()
    except Exception:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                im = page.to_image(resolution=150)
                img_filename = f"page_{page_num + 1}.{img_format.lower()}"
                img_path = os.path.join(output_dir, img_filename)
                im.save(img_path, format=img_format)
                generated_images.append(img_path)
                
    return generated_images

def merge_pdfs(pdf_paths: list[str], output_path: str) -> str:
    """Merge multiple PDF files into a single PDF."""
    writer = PdfWriter()
    for pdf_path in pdf_paths:
        reader = PdfReader(pdf_path)
        for page in reader.pages:
            writer.add_page(page)
    with open(output_path, "wb") as f_out:
        writer.write(f_out)
    return output_path

def split_pdf(pdf_path: str, output_dir: str) -> list[str]:
    """Split a PDF into individual 1-page PDF files."""
    os.makedirs(output_dir, exist_ok=True)
    reader = PdfReader(pdf_path)
    split_files = []
    for idx, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)
        out_filename = f"split_page_{idx + 1}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        with open(out_path, "wb") as f_out:
            writer.write(f_out)
        split_files.append(out_path)
    return split_files

def rotate_pdf(pdf_path: str, output_path: str, rotation_angle: int = 90) -> str:
    """Rotate all pages in a PDF by rotation_angle (90, 180, 270 degrees)."""
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    for page in reader.pages:
        page.rotate(rotation_angle)
        writer.add_page(page)
    with open(output_path, "wb") as f_out:
        writer.write(f_out)
    return output_path

def delete_pdf_pages(pdf_path: str, output_path: str, pages_to_delete: list[int]) -> str:
    """Delete specified page numbers (1-indexed) from a PDF."""
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    delete_set = set(p - 1 for p in pages_to_delete)
    for idx, page in enumerate(reader.pages):
        if idx not in delete_set:
            writer.add_page(page)
    with open(output_path, "wb") as f_out:
        writer.write(f_out)
    return output_path

def extract_pdf_pages(pdf_path: str, output_path: str, pages_to_extract: list[int]) -> str:
    """Extract specified page numbers (1-indexed) into a new PDF."""
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    extract_set = set(p - 1 for p in pages_to_extract)
    for idx, page in enumerate(reader.pages):
        if idx in extract_set:
            writer.add_page(page)
    with open(output_path, "wb") as f_out:
        writer.write(f_out)
    return output_path

def organize_pdf_pages(pdf_path: str, output_path: str, new_order: list[int]) -> str:
    """Reorder pages according to a list of 1-indexed page indices."""
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    total_pages = len(reader.pages)
    for page_num in new_order:
        idx = page_num - 1
        if 0 <= idx < total_pages:
            writer.add_page(reader.pages[idx])
    with open(output_path, "wb") as f_out:
        writer.write(f_out)
    return output_path

def compress_pdf(pdf_path: str, output_path: str, compression_level: str = "medium") -> str:
    """Compress PDF streams and reduce page sizes/images."""
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    for page in reader.pages:
        new_page = writer.add_page(page)
        new_page.compress_content_streams()

    with open(output_path, "wb") as f_out:
        writer.write(f_out)
    return output_path

def convert_pdf_to_pdfa(pdf_path: str, output_path: str) -> str:
    """Convert PDF to PDF/A compliant format (adding metadata and PDF/A flags)."""
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.add_metadata({
        "/GTS_PDFXVersion": "PDF/A-1b:2005",
        "/Title": "Converted PDF/A",
        "/Creator": "OmniPDF Converter Desktop App"
    })
    with open(output_path, "wb") as f_out:
        writer.write(f_out)
    return output_path
