"""
Number Plate Recognition route.
POST /plate/scan-plate  – accepts a JPEG/PNG camera frame and returns the
                          detected licence-plate text using EasyOCR.

EasyOCR uses pre-trained deep-learning models (CRAFT + CRNN).
Models are downloaded automatically on the first call (~200 MB, cached).
"""
import io
import logging
import re

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from PIL import Image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plate", tags=["Plate Recognition"])

# ---------------------------------------------------------------------------
# Lazy-loaded singleton reader – avoids reloading the model on every request
# ---------------------------------------------------------------------------
_reader = None


def _get_reader():
    global _reader
    if _reader is None:
        try:
            import easyocr  # noqa: PLC0415

            logger.info("Loading EasyOCR model (first-time download may take a moment)…")
            _reader = easyocr.Reader(["en"], gpu=False)
            logger.info("EasyOCR model loaded successfully.")
        except Exception as exc:
            logger.error("Failed to load EasyOCR: %s", exc)
            raise RuntimeError(f"OCR engine unavailable: {exc}") from exc
    return _reader


# ---------------------------------------------------------------------------
# Indian number-plate regex  (e.g. MH 12 AB 1234  or  KA01MX1234)
# ---------------------------------------------------------------------------
_PLATE_RE = re.compile(
    r"\b([A-Z]{2}[\s\-]?\d{2}[\s\-]?[A-Z]{1,3}[\s\-]?\d{4})\b",
    re.IGNORECASE,
)


def _clean(text: str) -> str:
    """Normalise whitespace and convert to uppercase."""
    return " ".join(text.upper().split())


def _preprocess(img_bgr: np.ndarray) -> np.ndarray:
    """
    Minimal preprocessing for OCR.
    Just resize if needed and convert to grayscale.
    """
    h, w = img_bgr.shape[:2]

    # Resize only if very large
    if w > 1280:
        scale = 1280 / w
        img_bgr = cv2.resize(img_bgr, (1280, int(h * scale)), interpolation=cv2.INTER_LINEAR)

    # Convert to grayscale
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Return as BGR for EasyOCR
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------
@router.post(
    "/scan-plate",
    summary="Detect licence plate from a camera image",
    response_description="Detected plate text + confidence + all OCR results",
)
async def scan_plate(
    image: UploadFile = File(..., description="Camera frame (JPEG/PNG/WEBP)"),
):
    """
    Accepts a camera frame and returns the detected Indian number plate.

    The response contains:
    - **plate** – best-matched plate string (empty if none found)
    - **confidence** – OCR confidence 0–1 for the best match
    - **all_text** – every text segment detected (for debugging)
    """
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image type. Use JPEG, PNG, or WEBP.",
        )

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image file.")

    # Decode image
    try:
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot decode image: {exc}",
        ) from exc

    # Pre-process
    img_processed = _preprocess(img_bgr)

    # Run OCR
    try:
        reader = _get_reader()
        # detail=1 returns (bbox, text, confidence) for each detection
        results = reader.readtext(img_processed, detail=1)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("OCR error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"OCR failed: {exc}") from exc

    # results: list of (bbox, text, confidence)
    all_text = [_clean(text) for _, text, conf in results if conf > 0.2]

    # Try to match Indian plate pattern
    for _, text, conf in results:
        if conf < 0.3:  # Skip very low confidence
            continue
        cleaned = _clean(text)
        m = _PLATE_RE.search(cleaned)
        if m:
            plate = _clean(m.group(1))
            logger.info("Plate detected: %s (conf=%.2f)", plate, conf)
            return {"plate": plate, "confidence": round(float(conf), 3), "all_text": all_text}

    # Fallback – return highest-confidence result
    if results:
        _, best_text, best_conf = max(results, key=lambda r: r[2])
        logger.info("No pattern match, returning best result: %s (conf=%.2f)", best_text, best_conf)
        return {
            "plate": _clean(best_text),
            "confidence": round(float(best_conf), 3),
            "all_text": all_text,
        }

    return {"plate": "", "confidence": 0.0, "all_text": []}
