
"""Server-side OCR service for AuthNode."""

import os
import re
import shutil
from io import BytesIO

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


# Optional Windows fallback. Set TESSERACT_CMD in .env if needed.
configured_cmd = os.getenv("TESSERACT_CMD", "").strip()
if configured_cmd:
    pytesseract.pytesseract.tesseract_cmd = configured_cmd
elif os.name == "nt" and not shutil.which("tesseract"):
    common_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(common_path):
        pytesseract.pytesseract.tesseract_cmd = common_path


def preprocess_image(image_bytes: bytes) -> Image.Image:
    """Improve contrast and resolution before OCR."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")

    # Prevent unexpectedly huge uploads from consuming excessive memory.
    image.thumbnail((2400, 2400))

    image = ImageOps.grayscale(image)
    image = ImageOps.autocontrast(image)
    image = ImageEnhance.Contrast(image).enhance(1.7)
    image = ImageEnhance.Sharpness(image).enhance(1.5)

    # Upscale small screenshots for better character recognition.
    if image.width < 1600:
        scale = min(2, 1600 / max(image.width, 1))
        image = image.resize(
            (int(image.width * scale), int(image.height * scale)),
            Image.Resampling.LANCZOS,
        )

    image = image.filter(ImageFilter.SHARPEN)
    return image


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def extract_fields(text: str) -> dict:
    """Extract common AuthNode certificate fields from OCR text."""
    clean = text.replace("\r", "")
    upper = clean.upper()

    # Support both hyphenated IDs and 12-character hexadecimal IDs.
    id_patterns = [
        r"(?:CERTIFICATE|CREDENTIAL|VERIFICATION)\s*(?:ID|NO|NUMBER|CODE)?\s*[:#\-]?\s*([A-Z0-9][A-Z0-9_-]{5,39})",
        r"\b([A-F0-9]{12})\b",
        r"\b([A-Z0-9]{2,10}(?:-[A-Z0-9]{2,12}){1,5})\b",
    ]

    certificate_id = ""
    for pattern in id_patterns:
        match = re.search(pattern, upper, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip(" .,:;")
            if not re.fullmatch(
                r"(INTERN|STUDENT|EMPLOYEE|VERIFICATION|CERTIFICATE|NAME)",
                candidate,
                re.IGNORECASE,
            ):
                certificate_id = candidate
                break

    email_match = re.search(
        r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}",
        clean,
        re.IGNORECASE,
    )
    student_email = email_match.group(0).lower() if email_match else ""

    name_patterns = [
        r"(?:student|intern|candidate|recipient|participant)\s+name\s*[:\-]?\s*([A-Z][A-Z'. -]{2,75})",
        r"(?:awarded|presented|granted|issued)\s+to\s*[:\-]?\s*([A-Z][A-Z'. -]{2,75})",
        r"this\s+is\s+to\s+certify\s+that\s+([A-Z][A-Z'. -]{2,75})",
        r"\bname\s*[:\-]\s*([A-Z][A-Z'. -]{2,75})",
    ]

    student_name = ""
    for pattern in name_patterns:
        match = re.search(pattern, clean, re.IGNORECASE)
        if match:
            candidate = normalize_text(match.group(1))
            candidate = re.split(
                r"\b(for|has|successfully|completed|in recognition|on behalf)\b",
                candidate,
                flags=re.IGNORECASE,
            )[0].strip(" ,.:;-")

            words = candidate.split()
            if 2 <= len(words) <= 6 and all(
                re.fullmatch(r"[A-Za-z][A-Za-z'.-]*", word)
                for word in words
            ):
                student_name = candidate
                break

    course_match = re.search(
        r"(?:course|program|training|internship|certification)"
        r"\s*(?:name|title)?\s*[:\-]\s*([^\n]{3,100})",
        clean,
        re.IGNORECASE,
    )
    course = normalize_text(course_match.group(1)) if course_match else ""

    institution_match = re.search(
        r"(?:institution|issuer|issued\s+by|organization|university|college)"
        r"\s*[:\-]\s*([^\n]{3,120})",
        clean,
        re.IGNORECASE,
    )
    institution = (
        normalize_text(institution_match.group(1))
        if institution_match
        else ""
    )

    return {
        "studentName": student_name,
        "studentEmail": student_email,
        "certificateId": certificate_id,
        "course": course,
        "institution": institution,
    }


def run_ocr(image_bytes: bytes) -> dict:
    image = preprocess_image(image_bytes)

    # PSM 11 works well for screenshots and irregular text layouts.
    config = "--oem 3 --psm 11"

    text = pytesseract.image_to_string(
        image,
        lang="eng",
        config=config,
    )

    word_data = pytesseract.image_to_data(
        image,
        lang="eng",
        config=config,
        output_type=pytesseract.Output.DICT,
    )

    confidences = []
    for value in word_data.get("conf", []):
        try:
            confidence = float(value)
            if confidence >= 0:
                confidences.append(confidence)
        except (TypeError, ValueError):
            continue

    average_confidence = (
        round(sum(confidences) / len(confidences), 2)
        if confidences
        else 0
    )

    return {
        "text": text,
        "fields": extract_fields(text),
        "confidence": average_confidence,
        "wordCount": len(confidences),
    }
