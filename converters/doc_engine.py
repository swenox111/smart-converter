import os
import csv
import zipfile
import subprocess
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import docx
import openpyxl
from pptx import Presentation
from pptx.util import Inches, Pt
from pdf2docx import Converter as PDF2DocxConverter
import pdfplumber

def try_libreoffice_convert(input_path: str, output_dir: str) -> bool:
    """Helper to attempt system LibreOffice conversion if installed."""
    libreoffice_paths = [
        "soffice",
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"
    ]
    for lo_cmd in libreoffice_paths:
        try:
            res = subprocess.run(
                [lo_cmd, "--headless", "--convert-to", "pdf", "--outdir", output_dir, input_path],
                capture_output=True, timeout=30
            )
            if res.returncode == 0:
                return True
        except Exception:
            continue
    return False

def txt_to_pdf(txt_path: str, output_path: str) -> str:
    """Convert a TXT, RTF, or HWP text file into a PDF document."""
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    normal_style = styles['Normal']
    normal_style.fontSize = 10
    normal_style.leading = 14

    story = []
    with open(txt_path, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()

    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            story.append(Spacer(1, 10))
        else:
            # Escape HTML characters for ReportLab Paragraph
            safe_text = cleaned.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(safe_text, normal_style))

    doc.build(story)
    return output_path

def csv_to_pdf(csv_path: str, output_path: str) -> str:
    """Convert CSV file into a PDF table format."""
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    normal_style = styles['Normal']

    data = []
    with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        for row in reader:
            data.append([Paragraph(cell.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'), normal_style) for cell in row])

    if data:
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4A90E2")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))
        story.append(t)

    doc.build(story)
    return output_path

def html_to_pdf(html_path: str, output_path: str) -> str:
    """Convert HTML file to PDF."""
    with open(html_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # Simple HTML text parser to PDF
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Basic strip tags for fallback rendering
    import re
    clean_text = re.sub('<[^<]+?>', '', content)
    for paragraph in clean_text.split('\n'):
        if paragraph.strip():
            story.append(Paragraph(paragraph.strip().replace('&', '&amp;').replace('<', '&lt;'), styles['Normal']))
            story.append(Spacer(1, 6))

    doc.build(story)
    return output_path

def docx_to_pdf(docx_path: str, output_path: str) -> str:
    """Convert Word (.docx) file to PDF."""
    output_dir = os.path.dirname(output_path)
    if try_libreoffice_convert(docx_path, output_dir):
        base = os.path.splitext(os.path.basename(docx_path))[0]
        lo_output = os.path.join(output_dir, f"{base}.pdf")
        if os.path.exists(lo_output) and lo_output != output_path:
            os.replace(lo_output, output_path)
        return output_path

    # Fallback docx parsing via reportlab
    doc_obj = docx.Document(docx_path)
    pdf_doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    for p in doc_obj.paragraphs:
        if p.text.strip():
            story.append(Paragraph(p.text.replace('&', '&amp;').replace('<', '&lt;'), styles['Normal']))
            story.append(Spacer(1, 6))

    if not story:
        story.append(Paragraph("Document preview", styles['Normal']))

    pdf_doc.build(story)
    return output_path

def xlsx_to_pdf(xlsx_path: str, output_path: str) -> str:
    """Convert Excel (.xlsx) file to PDF."""
    output_dir = os.path.dirname(output_path)
    if try_libreoffice_convert(xlsx_path, output_dir):
        base = os.path.splitext(os.path.basename(xlsx_path))[0]
        lo_output = os.path.join(output_dir, f"{base}.pdf")
        if os.path.exists(lo_output) and lo_output != output_path:
            os.replace(lo_output, output_path)
        return output_path

    # Fallback openpyxl parsing
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    pdf_doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    for sheet in wb.worksheets:
        story.append(Paragraph(f"<b>Sheet: {sheet.title}</b>", styles['Heading2']))
        story.append(Spacer(1, 8))
        table_data = []
        for row in sheet.iter_rows(values_only=True):
            if any(cell is not None for cell in row):
                table_data.append([Paragraph(str(cell if cell is not None else '').replace('&', '&amp;'), styles['Normal']) for cell in row])
        if table_data:
            t = Table(table_data)
            t.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
            ]))
            story.append(t)
            story.append(Spacer(1, 12))

    pdf_doc.build(story)
    return output_path

def pptx_to_pdf(pptx_path: str, output_path: str) -> str:
    """Convert PowerPoint (.pptx) file to PDF."""
    output_dir = os.path.dirname(output_path)
    if try_libreoffice_convert(pptx_path, output_dir):
        base = os.path.splitext(os.path.basename(pptx_path))[0]
        lo_output = os.path.join(output_dir, f"{base}.pdf")
        if os.path.exists(lo_output) and lo_output != output_path:
            os.replace(lo_output, output_path)
        return output_path

    # Fallback pptx parsing
    prs = Presentation(pptx_path)
    pdf_doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    for i, slide in enumerate(prs.slides):
        story.append(Paragraph(f"<b>Slide {i + 1}</b>", styles['Heading1']))
        story.append(Spacer(1, 8))
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text.strip():
                story.append(Paragraph(shape.text.replace('&', '&amp;').replace('<', '&lt;'), styles['Normal']))
                story.append(Spacer(1, 4))
        story.append(Spacer(1, 14))

    pdf_doc.build(story)
    return output_path

def openoffice_to_pdf(file_path: str, output_path: str) -> str:
    """Convert OpenOffice ODT, ODS, ODP files to PDF."""
    output_dir = os.path.dirname(output_path)
    if try_libreoffice_convert(file_path, output_dir):
        base = os.path.splitext(os.path.basename(file_path))[0]
        lo_output = os.path.join(output_dir, f"{base}.pdf")
        if os.path.exists(lo_output) and lo_output != output_path:
            os.replace(lo_output, output_path)
        return output_path
    
    # Fallback text extraction for ODT/ODS/ODP
    return txt_to_pdf(file_path, output_path)

def zip_to_pdf(zip_path: str, output_path: str) -> str:
    """Extract contents of a ZIP file and compile images/documents into a single unified PDF."""
    import tempfile
    from converters.pdf_engine import images_to_pdf, merge_pdfs
    
    temp_dir = tempfile.mkdtemp()
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)
        
    extracted_pdfs = []
    image_extensions = ('.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff')
    images_found = []

    for root, _, files in os.walk(temp_dir):
        for f in files:
            full_path = os.path.join(root, f)
            ext = os.path.splitext(f)[1].lower()
            if ext in image_extensions:
                images_found.append(full_path)
            elif ext == '.txt':
                pdf_out = full_path + '.pdf'
                txt_to_pdf(full_path, pdf_out)
                extracted_pdfs.append(pdf_out)
            elif ext == '.docx':
                pdf_out = full_path + '.pdf'
                docx_to_pdf(full_path, pdf_out)
                extracted_pdfs.append(pdf_out)
            elif ext == '.pdf':
                extracted_pdfs.append(full_path)

    if images_found:
        img_pdf = os.path.join(temp_dir, "images_combined.pdf")
        images_to_pdf(images_found, img_pdf)
        extracted_pdfs.append(img_pdf)

    if extracted_pdfs:
        merge_pdfs(extracted_pdfs, output_path)
    else:
        # Empty zip fallback
        txt_to_pdf(zip_path, output_path)
    return output_path

def pdf_to_word(pdf_path: str, output_path: str) -> str:
    """Convert PDF to Word (.docx) document."""
    cv = PDF2DocxConverter(pdf_path)
    cv.convert(output_path, start=0, end=None)
    cv.close()
    return output_path

def pdf_to_excel(pdf_path: str, output_path: str) -> str:
    """Convert PDF tables to Excel (.xlsx)."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Extracted PDF Data"
    
    row_idx = 1
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    for col_idx, val in enumerate(row, 1):
                        ws.cell(row=row_idx, column=col_idx, value=val)
                    row_idx += 1
                row_idx += 1

    wb.save(output_path)
    return output_path

def pdf_to_ppt(pdf_path: str, output_path: str) -> str:
    """Convert PDF to PowerPoint (.pptx) slides."""
    from converters.pdf_engine import pdf_to_images
    import tempfile
    
    temp_dir = tempfile.mkdtemp()
    img_paths = pdf_to_images(pdf_path, temp_dir, img_format="PNG")

    prs = Presentation()
    # Blank slide layout index 6
    blank_layout = prs.slide_layouts[6]

    for img_path in img_paths:
        slide = prs.slides.add_slide(blank_layout)
        slide.shapes.add_picture(img_path, Inches(0), Inches(0), width=Inches(10), height=Inches(7.5))

    prs.save(output_path)
    return output_path

def pdf_to_txt(pdf_path: str, output_path: str) -> str:
    """Extract all text from PDF to a TXT file."""
    text_content = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ""
            text_content.append(f"--- Page {i + 1} ---\n" + page_text)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(text_content))
    return output_path
