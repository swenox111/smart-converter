import os
from PIL import Image, ImageDraw, ImageFont

def generate_smart_converter_logo():
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    os.makedirs(static_dir, exist_ok=True)

    # 1. Create High-Res 512x512 Icon
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background (App Icon style)
    margin = 16
    radius = 110
    
    # Outer Glow
    glow_color = (13, 110, 253, 255)
    bg_color_top = (10, 15, 29, 255)
    bg_color_bot = (13, 110, 253, 255)

    # Draw App Icon Shield / Document shape
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(10, 17, 36, 255),
        outline=(13, 110, 253, 255),
        width=12
    )

    # Inner Electric Blue Radial Glow Circle
    draw.ellipse([100, 100, size - 100, size - 100], fill=(13, 110, 253, 255))

    # Draw Document / Smart Conversion Emblem inside
    # White Document Shape
    doc_left, doc_top, doc_right, doc_bot = 160, 140, 352, 372
    draw.rounded_rectangle([doc_left, doc_top, doc_right, doc_bot], radius=24, fill=(255, 255, 255, 255))
    
    # Folded Corner
    draw.polygon([(300, 140), (352, 192), (300, 192)], fill=(210, 230, 255, 255))

    # Conversion Arrow inside Document (Electric Blue / Dark Navy)
    # Circle cutout
    draw.ellipse([216, 216, 296, 296], fill=(10, 17, 36, 255))
    
    # PDF Spark Star / Arrow in center
    draw.text((256, 256), "⚡", fill=(255, 255, 255, 255), anchor="mm", font_size=52)

    # Save 512x512 logo.png
    logo_path = os.path.join(static_dir, "logo.png")
    img.save(logo_path, "PNG")
    print(f"Generated {logo_path}")

    # 2. Create Apple Touch Icon (180x180)
    apple_icon = img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_path = os.path.join(static_dir, "apple-touch-icon.png")
    apple_icon.save(apple_path, "PNG")
    print(f"Generated {apple_path}")

    # 3. Create Favicon PNG (32x32 & 64x64)
    fav_icon = img.resize((64, 64), Image.Resampling.LANCZOS)
    fav_path = os.path.join(static_dir, "favicon.png")
    fav_icon.save(fav_path, "PNG")
    print(f"Generated {fav_path}")

    # 4. Create Favicon ICO
    fav_ico_path = os.path.join(static_dir, "favicon.ico")
    img.resize((32, 32), Image.Resampling.LANCZOS).save(fav_ico_path, format="ICO")
    print(f"Generated {fav_ico_path}")

if __name__ == "__main__":
    generate_smart_converter_logo()
