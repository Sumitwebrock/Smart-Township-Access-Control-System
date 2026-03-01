"""
AI-Powered Number Plate Recognition using EasyOCR.
POST /plate/scan-plate – accepts camera frame, returns detected license plate.
"""
import asyncio
import io
import logging
import re
from typing import Optional

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from PIL import Image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plate", tags=["Plate Recognition"])

# ---------------------------------------------------------------------------
# Global OCR reader (lazy-loaded, shared across requests)
# ---------------------------------------------------------------------------
_reader = None
_reader_lock = asyncio.Lock()


async def _get_ocr_reader():
    """Get or create the EasyOCR reader (thread-safe)."""
    global _reader
    if _reader is None:
        async with _reader_lock:
            if _reader is None:
                try:
                    logger.info("Initializing EasyOCR model (first run only)")
                    import easyocr  # noqa: PLC0415

                    _reader = easyocr.Reader(["en"], gpu=False, verbose=False)
                    logger.info("EasyOCR model is ready")
                except Exception as exc:
                    logger.error("Failed to load EasyOCR: %s", exc)
                    raise RuntimeError(f"OCR engine unavailable: {exc}") from exc
    return _reader


async def prewarm_ocr_model() -> None:
    """Best-effort model prewarm on startup to reduce first request latency."""
    try:
        await asyncio.wait_for(_get_ocr_reader(), timeout=60)
        logger.info("OCR prewarm completed")
    except Exception as exc:
        logger.warning("OCR prewarm skipped/failed: %s", exc)


# ---------------------------------------------------------------------------
# Indian license plate pattern
# ---------------------------------------------------------------------------
PLATE_PATTERN = re.compile(
    r"([A-Z]{2}[\s\-]?\d{2}[\s\-]?[A-Z]{1,3}[\s\-]?\d{4})",
    re.IGNORECASE,
)


def _normalize_text(text: str) -> str:
    """Clean and normalize text."""
    return " ".join(text.upper().split())


def _preprocess_image(img_bgr: np.ndarray) -> np.ndarray:
    """Prepare image for OCR."""
    h, w = img_bgr.shape[:2]
    
    # Resize if too large (optimize for speed)
    if w > 1280:
        scale = 1280 / w
        img_bgr = cv2.resize(img_bgr, (1280, int(h * scale)), interpolation=cv2.INTER_LINEAR)
    
    return img_bgr


def _build_candidate_views(img_bgr: np.ndarray) -> list[np.ndarray]:
    """Build smaller candidate views so AI OCR is faster and plate-focused."""
    h, w = img_bgr.shape[:2]
    views: list[np.ndarray] = []

    full = _preprocess_image(img_bgr)
    views.append(full)

    top_half = img_bgr[: max(1, h // 2), :]
    views.append(_preprocess_image(top_half))

    center_h_start = int(h * 0.15)
    center_h_end = int(h * 0.7)
    center_w_start = int(w * 0.1)
    center_w_end = int(w * 0.9)
    center_crop = img_bgr[center_h_start:center_h_end, center_w_start:center_w_end]
    if center_crop.size > 0:
        views.append(_preprocess_image(center_crop))

    gray = cv2.cvtColor(full, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    binary = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        15,
        2,
    )
    views.append(cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR))

    return views


async def _run_ocr_with_timeout(reader, image: np.ndarray, timeout_seconds: float):
    """Run EasyOCR with a hard timeout to avoid frontend hanging."""
    return await asyncio.wait_for(
        asyncio.to_thread(
            reader.readtext,
            image,
            detail=1,
            paragraph=False,
            decoder="greedy",
            batch_size=1,
            mag_ratio=1.0,
            text_threshold=0.55,
            low_text=0.25,
            link_threshold=0.4,
            allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        ),
        timeout=timeout_seconds,
    )


def _extract_plate_from_results(ocr_results: list) -> Optional[dict]:
    """
    Extract actual license plate from OCR results.
    Returns: {"plate": "KA 12 AB 1234", "confidence": 0.95, "all_text": [...]}
    """
    if not ocr_results:
        return None
    
    all_detected_text = []
    best_match = None
    best_confidence = 0
    
    # Process each OCR detection
    for (bbox, text, confidence) in ocr_results:
        clean_text = _normalize_text(text)
        all_detected_text.append(clean_text)
        
        # Try to match Indian plate pattern
        match = PLATE_PATTERN.search(clean_text)
        if match:
            plate = match.group(1)
            if confidence > best_confidence:
                best_match = plate
                best_confidence = confidence
    
    # If no pattern matched, try combining consecutive detections
    if not best_match and all_detected_text:
        combined = " ".join(all_detected_text[:5])  # Combine first 5 detections
        match = PLATE_PATTERN.search(combined)
        if match:
            best_match = match.group(1)
            best_confidence = 0.5  # Lower confidence for combined text
    
    if best_match:
        return {
            "plate": best_match,
            "confidence": min(best_confidence, 1.0),
            "all_text": all_detected_text,
        }
    
    return None


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------
@router.post(
    "/scan-plate",
    summary="AI License Plate Detection",
    response_description="Detected plate number auto-filled in form",
)
async def scan_plate(
    image: UploadFile = File(..., description="Camera photo (JPEG/PNG/WEBP)"),
):
    """
    🤖 AI-powered license plate detection.
    
    Uses EasyOCR deep learning model to detect and return:
    - **plate**: Detected license plate (e.g., "KA 12 AB 1234")
    - **confidence**: Detection confidence (0-1)
    - **all_text**: All text detected in image
    
    The form auto-fills with the detected plate!
    """
    # Validate input
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="❌ Unsupported format. Use JPEG, PNG, or WEBP.",
        )

    contents = await image.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="❌ Empty image file.",
        )

    # Decode image
    try:
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        logger.info("Image loaded: %s", img_bgr.shape)
    except Exception as exc:
        logger.error("Cannot decode image: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot decode image: {exc}",
        ) from exc

    views = _build_candidate_views(img_bgr)

    # Get OCR reader
    try:
        reader = await _get_ocr_reader()
        logger.info("OCR reader available")
    except Exception as exc:
        logger.error("OCR initialization failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI engine not available: {exc}",
        ) from exc

    # Run AI OCR across candidate views with per-view timeout and early exit
    all_text_agg: list[str] = []
    best_result: Optional[dict] = None

    for idx, view in enumerate(views):
        try:
            logger.info("Running OCR on view %s/%s", idx + 1, len(views))
            ocr_results = await _run_ocr_with_timeout(reader, view, timeout_seconds=8.0)
            if ocr_results:
                all_text_agg.extend([_normalize_text(text) for (_, text, _) in ocr_results])
                result = _extract_plate_from_results(ocr_results)
                if result and result.get("plate"):
                    logger.info("Plate detected on view %s: %s", idx + 1, result["plate"])
                    return {
                        "plate": _normalize_text(result["plate"]),
                        "confidence": float(result.get("confidence", 0.0)),
                        "all_text": list(dict.fromkeys(all_text_agg)),
                        "status": "success",
                    }
                if result and (best_result is None or result.get("confidence", 0.0) > best_result.get("confidence", 0.0)):
                    best_result = result
        except TimeoutError:
            logger.warning("OCR view %s timed out, trying next view", idx + 1)
            continue
        except Exception as exc:
            logger.warning("OCR view %s failed: %s", idx + 1, exc)
            continue

    if best_result and best_result.get("plate"):
        return {
            "plate": _normalize_text(best_result["plate"]),
            "confidence": float(best_result.get("confidence", 0.0)),
            "all_text": list(dict.fromkeys(all_text_agg)),
            "status": "fallback_plate",
        }

    return {
        "plate": "",
        "confidence": 0.0,
        "all_text": list(dict.fromkeys([t for t in all_text_agg if t])),
        "status": "no_plate_pattern_found",
    }
