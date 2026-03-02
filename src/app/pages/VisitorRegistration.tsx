import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import {
  Camera, Car, X, ScanLine, RefreshCw,
  CheckCircle2, AlertCircle, UserCheck,
} from 'lucide-react';
import { visitorsApi } from '../../lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────
type ScanState = 'idle' | 'scanning' | 'done' | 'error';

interface ScanResult {
  plate: string;
  confidence: number;
  all_text: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)![1];
  const byteStr = atob(data);
  const arr = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Indian license plate format: KA 12 AB 1234 or KA12AB1234
function validatePlateFormat(plate: string): boolean {
  const cleaned = plate.replace(/\s|-/g, '').toUpperCase();
  // Must be: 2 letters + 2 digits + 2 letters + 4 digits
  return /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/.test(cleaned);
}

export default function VisitorRegistration() {
  const [formData, setFormData] = useState({
    name: '', phone: '', houseNumber: '', vehicleNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false); // big DONE screen

  // Camera
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [cameraActive,  setCameraActive]  = useState(false);
  const [cameraError,   setCameraError]   = useState<string | null>(null);
  const [scanState,     setScanState]     = useState<ScanState>('idle');
  const [scanResult,    setScanResult]    = useState<ScanResult | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  // ── Auto-start camera on mount ────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not available in this browser.');
      }

      streamRef.current?.getTracks().forEach((t) => t.stop());

      const constraints: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!stream) {
        throw lastError ?? new Error('No camera found on this device.');
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setScanResult(null);
      setCapturedFrame(null);
      setScanState('idle');
    } catch (err: any) {
      const msg = err.message ?? 'Camera access denied or not available.';
      setCameraActive(false);
      setCameraError(msg);
      console.error('Camera error:', err);
      // Page will still render with error message below
    }
  }, []);

  useEffect(() => {
    // Don't block page rendering - start camera in background
    const startCameraAsync = async () => {
      await startCamera();
    };
    startCameraAsync().catch(console.error);

    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []); // eslint-disable-line

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  // ── Capture frame ─────────────────────────────────────────────────────
  const captureFrame = useCallback((): string | null => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const srcWidth = video.videoWidth || 640;
    const srcHeight = video.videoHeight || 480;
    const maxWidth = 960;
    const scale = srcWidth > maxWidth ? maxWidth / srcWidth : 1;
    canvas.width = Math.round(srcWidth * scale);
    canvas.height = Math.round(srcHeight * scale);
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // ── One-click: capture photo AND read plate ───────────────────────────
  const captureAndScan = useCallback(async () => {
    setScanState('scanning');
    setScanResult(null);
    const dataURL = captureFrame();
    if (!dataURL) { setScanState('error'); return; }
    setCapturedFrame(dataURL);           // freeze the preview
    try {
      const blob = dataURLtoBlob(dataURL);
      const fd   = new FormData();
      fd.append('image', blob, 'plate.jpg');

      // Add 90-second timeout for AI OCR (first load: ~30-60s, cached: ~2-5s)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      const res = await fetch('/api/plate/scan-plate', { 
        method: 'POST', 
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`OCR service error: ${res.status}`);
      const data: ScanResult = await res.json();
      setScanResult(data);
      setScanState('done');
      if (data.plate) setFormData((prev) => ({ ...prev, vehicleNumber: data.plate }));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setScanState('error');
        alert('⏱️ AI detection took too long (>90 seconds).\n\n✏️ Please enter the license plate manually below.');
      } else {
        setScanState('error');
        alert('❌ AI detection failed.\n\n✏️ Please enter the license plate manually below.\n\nFormat: KA 12 AB 1234');
      }
      setScanResult({ plate: '', confidence: 0, all_text: [] });
    }
  }, [captureFrame]);

  // ── Retake – restart live feed ────────────────────────────────────────
  const retake = useCallback(async () => {
    setCapturedFrame(null);
    setScanResult(null);
    setScanState('idle');
    // re-open camera if it was stopped
    if (!streamRef.current) {
      await startCamera();
    } else {
      setCameraActive(true);
    }
  }, [startCamera]);

  // ── Register ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name',         formData.name);
      fd.append('phone',        formData.phone);
      fd.append('house_number', formData.houseNumber);
      if (formData.vehicleNumber) fd.append('vehicle_number', formData.vehicleNumber);
      fd.append('gate_id', 'Gate 1');
      await visitorsApi.register(fd);
      stopCamera();
      setRegistered(true);          // ← show DONE screen
    } catch (err: any) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
        ? err 
        : 'Registration failed. Please try again.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewVisitor = () => {
    setRegistered(false);
    setFormData({ name: '', phone: '', houseNumber: '', vehicleNumber: '' });
    setCapturedFrame(null);
    setScanState('idle');
    setScanResult(null);
    startCamera();
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DONE SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (registered) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border border-border rounded-[24px] p-12 shadow-sm flex flex-col items-center gap-6">
            {/* Big green tick */}
            <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-600" strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-green-600 tracking-tight">DONE</h1>
              <p className="text-lg text-foreground font-medium mt-1">Visitor Registered!</p>
            </div>

            <div className="w-full bg-secondary rounded-[14px] p-4 text-left space-y-1">
              <Detail label="Name"    value={formData.name} />
              <Detail label="Phone"   value={formData.phone} />
              <Detail label="House"   value={formData.houseNumber} />
              {formData.vehicleNumber && (
                <Detail label="Plate" value={formData.vehicleNumber} />
              )}
            </div>

            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-[12px] font-semibold text-base">
                <UserCheck className="w-5 h-5" />
                Entry Approved — Gate 1
              </div>
              <Button type="button" variant="secondary" className="w-full" onClick={handleNewVisitor}>
                Register Next Visitor
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN FORM
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-[14px] mb-4 shadow-sm">
            <Camera className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Visitor Registration</h1>
          <p className="text-muted-foreground">Gate 1 · Main Entrance</p>
        </div>

        {/* ── Camera ── */}
        <div className="bg-card border border-border rounded-[16px] p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Camera &amp; Plate OCR</h2>
            <span className="ml-auto text-xs text-muted-foreground">Auto-started · EasyOCR</span>
          </div>

          {/* Viewport */}
          <div className="relative aspect-video bg-secondary border border-border rounded-[12px] overflow-hidden mb-4">

            {/* Live feed */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive && !capturedFrame ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {/* Frozen captured photo */}
            {capturedFrame && (
              <img src={capturedFrame} alt="Captured" className="w-full h-full object-cover" />
            )}

            {/* Placeholder when camera not ready */}
            {!cameraActive && !capturedFrame && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Camera className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{cameraError ?? 'Starting camera…'}</p>
                {cameraError && (
                  <Button type="button" variant="secondary" onClick={startCamera}>
                    Retry Camera
                  </Button>
                )}
              </div>
            )}

            {/* Scanning overlay */}
            {scanState === 'scanning' && (
              <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-3">
                <ScanLine className="w-12 h-12 text-white animate-pulse" />
                <p className="text-white font-semibold">Reading Number Plate…</p>
              </div>
            )}

            {/* Result badge */}
            {scanState === 'done' && scanResult && (
              <div className={`absolute bottom-3 inset-x-3 px-4 py-2 rounded-[10px] flex items-center gap-2
                ${scanResult.plate ? 'bg-green-600' : 'bg-amber-500'} text-white`}>
                {scanResult.plate
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <AlertCircle  className="w-4 h-4 shrink-0" />}
                <span className="text-sm font-semibold">
                  {scanResult.plate
                    ? `Plate: ${scanResult.plate}  (${Math.round(scanResult.confidence * 100)}%)`
                    : 'No plate found – enter manually below'}
                </span>
              </div>
            )}

            {scanState === 'error' && (
              <div className="absolute bottom-3 inset-x-3 px-4 py-3 rounded-[10px] bg-red-600 text-white flex flex-col items-start gap-2">
                <div className="flex items-center gap-2 w-full">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-semibold">OCR failed – please enter manually</span>
                </div>
                <Input
                  type="text"
                  placeholder="e.g., KA 12 AB 1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, vehicleNumber: e.target.value }))}
                  className="w-full bg-white text-black text-xs h-8 rounded"
                />
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="flex-1 h-7 text-xs"
                    onClick={() => {
                      setScanState('idle');
                      setCapturedFrame(null);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Action buttons */}
          <div className="flex gap-3">
            {scanState !== 'done' && scanState !== 'error' ? (
              <Button
                type="button"
                variant="default"
                className="flex-1"
                disabled={!cameraActive || scanState === 'scanning'}
                onClick={captureAndScan}
              >
                <ScanLine className="w-4 h-4 mr-2" />
                {scanState === 'scanning' ? 'Reading Plate…' : 'Capture Photo & Read Plate'}
              </Button>
            ) : (
              <Button type="button" variant="secondary" className="flex-1" onClick={retake}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake Photo
              </Button>
            )}
          </div>

          {/* Detected text chips */}
          {scanState === 'done' && scanResult && scanResult.all_text.length > 0 && (
            <div className="mt-3 p-3 bg-secondary rounded-[10px]">
              <p className="text-xs text-muted-foreground mb-1 font-medium">All detected text – click to use:</p>
              <div className="flex flex-wrap gap-1">
                {scanResult.all_text.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, vehicleNumber: t }))}
                    className="text-xs px-2 py-0.5 rounded bg-card border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Registration Form ── */}
        <div className="bg-card border border-border rounded-[16px] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Visitor Name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              minLength={2}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter phone number (min 7 digits)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              minLength={7}
              maxLength={20}
            />
            <Input
              label="Visiting House Number"
              type="text"
              placeholder="e.g., A-204"
              value={formData.houseNumber}
              onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
              required
              minLength={1}
            />

            <div className="relative">
              <Input
                label="Vehicle Number (auto-filled by OCR)"
                type="text"
                placeholder="Captured from camera or type manually"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
              />
              {scanState === 'done' && scanResult?.plate && formData.vehicleNumber === scanResult.plate && (
                <span className="absolute right-3 top-9 flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto-filled
                </span>
              )}
              {formData.vehicleNumber && !validatePlateFormat(formData.vehicleNumber) && (
                <p className="text-xs text-red-600 mt-1">⚠ Invalid format. Use: KA 12 AB 1234</p>
              )}
              {formData.vehicleNumber && validatePlateFormat(formData.vehicleNumber) && (
                <p className="text-xs text-green-600 mt-1">✓ Valid plate format</p>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                type="submit"
                variant="success"
                size="lg"
                className="flex-1 text-base font-bold"
                disabled={submitting}
              >
                {submitting ? 'Registering…' : '✓ Register & Allow Entry'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  setFormData({ name: '', phone: '', houseNumber: '', vehicleNumber: '' });
                  retake();
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          All visitor entries are logged and monitored 24/7
        </p>
      </div>
    </div>
  );
}

// ─── Small helper component ──────────────────────────────────────────────────
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

