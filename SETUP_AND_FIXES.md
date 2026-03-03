# Smart Township Access Control System - Setup & Fixes

## Issues Identified and Fixed

### 1. Port Mismatch (✓ FIXED)
**Problem:** Vite proxy was configured to point to port 8010, but the backend runs on port 8000.

**Fix Applied:** Updated `vite.config.ts` to use port 8000:
```typescript
target: 'http://localhost:8000',  // Changed from 8010
```

### 2. Missing OCR Dependencies (⚠ ACTION REQUIRED)
**Problem:** `easyocr` and `opencv-python-headless` are not installed.

**Fix Required:** Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

If installation keeps getting interrupted, install individually:
```bash
pip install fastapi==0.115.6
pip install uvicorn[standard]==0.32.1
pip install sqlalchemy==2.0.36
pip install python-jose[cryptography]==3.3.0
pip install passlib[bcrypt]==1.7.4
pip install python-multipart==0.0.20
pip install python-dotenv==1.0.1
pip install opencv-python-headless
pip install easyocr
```

### 3. Enhanced Error Handling (✓ FIXED)
**Problem:** Frontend showed generic errors without helpful details.

**Fixes Applied:**
- Added console logging in both `EmployeeRegistration.tsx` and `VisitorRegistration.tsx`
- Improved error messages to show actual error details
- Added better null checking for plate detection results

## How to Start the System

### 1. Start the Backend Server
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend (in a new terminal)
```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

## Testing the Plate Recognition

1. Navigate to either:
   - Employee Registration: http://localhost:5173/employee-registration
   - Visitor Registration: http://localhost:5173/visitor-registration

2. Allow camera access when prompted

3. Click "Capture & Read Plate" button

4. The OCR will:
   - Take 30-60 seconds on first run (downloading AI models)
   - Be much faster on subsequent scans (2-5 seconds)
   - Show detected plate number or allow manual entry if detection fails

## Troubleshooting

### Backend not starting?
- Ensure all dependencies are installed: `pip list | grep -E "easyocr|opencv|fastapi"`
- Check for port conflicts: Port 8000 must be available
- View backend logs for specific errors

### Frontend can't reach backend?
- Verify backend is running on port 8000
- Check console for network errors (F12 in browser)
- Ensure vite proxy is configured correctly

### OCR still failing?
- Open browser console (F12) to see detailed error messages
- Check backend terminal for OCR initialization logs
- First OCR request may timeout (90s) while downloading models
- Try manual entry if OCR consistently fails

## Architecture

```
Frontend (React + Vite)
  ↓ /api/* requests (proxied)
  ↓ → http://localhost:8000/api/v1/*
  ↓
Backend (FastAPI + EasyOCR)
  ├── /api/v1/plate/scan-plate (OCR endpoint)
  ├── /api/v1/employees/* (Employee management)
  └── /api/v1/visitors/* (Visitor management)
```

## Changes Made

### Files Modified:
1. ✅ `vite.config.ts` - Fixed port from 8010 to 8000
2. ✅ `src/app/pages/EmployeeRegistration.tsx` - Added logging and error handling
3. ✅ `src/app/pages/VisitorRegistration.tsx` - Added logging and error handling

### Backend Code (Already Correct):
- ✅ `backend/app/routes/plate_recognition.py` - OCR implementation
- ✅ `backend/app/main.py` - API routes configured correctly
- ✅ `backend/requirements.txt` - All dependencies listed

## Next Steps

1. **Install backend dependencies** (see section 2 above)
2. **Start both servers** (backend on port 8000, frontend on port 5173)
3. **Test plate recognition** in both employee and visitor sections
4. **Check console logs** if issues persist

---

**Note:** The OCR functionality uses EasyOCR with deep learning models. The first scan will download models (~100MB) and may take 30-60 seconds. Subsequent scans are much faster.
