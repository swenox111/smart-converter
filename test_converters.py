import os
from PIL import Image
from converters import pdf_engine, doc_engine

def run_tests():
    test_dir = "test_output"
    os.makedirs(test_dir, exist_ok=True)
    print("--- Starting Converter Tests ---")

    # 1. Image to PDF Test
    img_path = os.path.join(test_dir, "sample.png")
    img = Image.new("RGB", (200, 200), color="red")
    img.save(img_path)
    img_pdf = os.path.join(test_dir, "img_out.pdf")
    pdf_engine.images_to_pdf([img_path], img_pdf)
    assert os.path.exists(img_pdf), "Image to PDF failed!"
    print("[OK] Image to PDF")

    # 2. Text to PDF Test
    txt_path = os.path.join(test_dir, "sample.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("Hello OmniPDF Converter!\nThis is a sample document.")
    txt_pdf = os.path.join(test_dir, "txt_out.pdf")
    doc_engine.txt_to_pdf(txt_path, txt_pdf)
    assert os.path.exists(txt_pdf), "Text to PDF failed!"
    print("[OK] Text to PDF")

    # 3. Merge PDF Test
    merged_pdf = os.path.join(test_dir, "merged.pdf")
    pdf_engine.merge_pdfs([img_pdf, txt_pdf], merged_pdf)
    assert os.path.exists(merged_pdf), "Merge PDF failed!"
    print("[OK] Merge PDF")

    # 4. Split PDF Test
    split_dir = os.path.join(test_dir, "split")
    split_files = pdf_engine.split_pdf(merged_pdf, split_dir)
    assert len(split_files) == 2, "Split PDF failed!"
    print("[OK] Split PDF")

    # 5. Rotate PDF Test
    rotated_pdf = os.path.join(test_dir, "rotated.pdf")
    pdf_engine.rotate_pdf(merged_pdf, rotated_pdf, 90)
    assert os.path.exists(rotated_pdf), "Rotate PDF failed!"
    print("[OK] Rotate PDF")

    # 6. Compress PDF Test
    compressed_pdf = os.path.join(test_dir, "compressed.pdf")
    pdf_engine.compress_pdf(merged_pdf, compressed_pdf)
    assert os.path.exists(compressed_pdf), "Compress PDF failed!"
    print("[OK] Compress PDF")

    print("\nALL CONVERTER TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
