import os
import pdfplumber
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

def perform_pdf_ocr(pdf_path: str, output_path: str, lang: str = "eng") -> str:
    """Perform Optical Character Recognition on PDF pages and export text PDF/Doc."""
    extracted_text = []

    # Attempt pytesseract if installed
    try:
        import pytesseract
        from PIL import Image
        import fitz

        doc = fitz.open(pdf_path)
        for page in doc:
            pix = page.get_pixmap(dpi=150)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text = pytesseract.image_to_string(img, lang=lang)
            extracted_text.append(text)
        doc.close()
    except Exception:
        # Fallback to pdfplumber text extraction
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                extracted_text.append(text)

    # Build searchable output PDF
    doc_template = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    for idx, page_text in enumerate(extracted_text):
        story.append(Paragraph(f"<b>OCR Page {idx + 1}</b>", styles['Heading2']))
        story.append(Spacer(1, 8))
        for line in page_text.split('\n'):
            if line.strip():
                safe_line = line.strip().replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(safe_line, styles['Normal']))
                story.append(Spacer(1, 4))
        story.append(Spacer(1, 14))

    doc_template.build(story)
    return output_path
