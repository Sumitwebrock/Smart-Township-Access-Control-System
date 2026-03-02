import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import {
  Camera, Car, ScanLine, RefreshCw,
  CheckCircle2, AlertCircle, UserCheck, CreditCard,
} from 'lucide-react';
import { employeesApi } from '../../lib/api';

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

export default function EmployeeRegistration() {
  const [formData, setFormData] = useState({
    name: '', house_number: '', rfid_tag: '', vehicle_number: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false); // big DONE screen
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      if (!res.ok) { setScanState('error'); return; }
      const data: ScanResult = await res.json();
      setScanResult(data);
      setScanState('done');
      setFormData((prev) => ({ ...prev, vehicle_number: data.plate.toUpperCase() }));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setScanState('error');
        alert('⏱️ AI detection took too long (>90 seconds).\n\n✏️ Please enter the license plate manually below.');
      } else {
        setScanState('error');
        alert('❌ AI detection failed.\n\n✏️ Please enter the license plate manually below.\n\nFormat: KA 12 AB 1234');
      }
    }
  }, [captureFrame]);

  // ── Retake photo ──────────────────────────────────────────────────────
  const retakePhoto = useCallback(() => {
    setCapturedFrame(null);
    setScanResult(null);
    setScanState('idle');
    startCamera();
  }, [startCamera]);

  // ── Handle submission ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Stop camera before registering
      stopCamera();

      // Register employee
      await employeesApi.register({
        name: formData.name,
        house_number: formData.house_number,
        rfid_tag: formData.rfid_tag,
        vehicle_number: formData.vehicle_number || undefined,
      });

      setRegistered(true); // show DONE screen
    } catch (err: unknown) {
      // Handle error properly
      let message = 'Registration failed. Please try again.';
      
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String((err as any).message);
      } else if (typeof err === 'string') {
        message = err;
      }
      
      setErrorMsg(message);
      startCamera(); // restart camera on error
    } finally {
      setSubmitting(false);
    }
  };

  // ── Register next employee ────────────────────────────────────────────
  const registerNext = () => {
    setRegistered(false);
    setFormData({ name: '', house_number: '', rfid_tag: '', vehicle_number: '' });
    setScanResult(null);
    setCapturedFrame(null);
    setScanState('idle');
    setErrorMsg(null);
    startCamera();
  };

  // ===========================================================================
  // RENDER: DONE screen
  // ===========================================================================
  if (registered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
          {/* Big green checkmark */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-600" strokeWidth={2.5} />
            </div>
          </div>

          {/* DONE heading */}
          <h1 className="text-5xl font-bold text-green-600">DONE</h1>

          {/* Employee details */}
          <div className="space-y-3 text-left bg-gray-50 rounded-xl p-6">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">
              Employee Registered
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-gray-400" />
                <span className="text-lg font-semibold text-gray-800">{formData.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">RFID: {formData.rfid_tag}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">House: {formData.house_number}</span>
              </div>
              {formData.vehicle_number && (
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600 font-mono">{formData.vehicle_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Access granted banner */}
          <div className="bg-green-600 text-white rounded-xl p-4">
            <p className="text-lg font-semibold">Registration Complete</p>
            <p className="text-sm opacity-90">Employee access activated</p>
          </div>

          {/* Register next button */}
          <Button
            onClick={registerNext}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold"
          >
            Register Next Employee
          </Button>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RENDER: Registration form
  // ===========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <UserCheck className="w-8 h-8" />
                Employee Registration
              </h1>
              <p className="text-blue-100 mt-2">Register new township employee</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error message */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{errorMsg}</p>
            </div>
          )}

          {/* Camera Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              Vehicle Number Plate
            </h2>

            {cameraError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-700 text-sm">{cameraError}</p>
              </div>
            ) : (
              <>
                {/* Video preview or captured frame */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  {capturedFrame ? (
                    <img src={capturedFrame} alt="Captured" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      <canvas ref={canvasRef} className="hidden" />
                    </>
                  )}
                  {scanState === 'scanning' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center text-white">
                        <ScanLine className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                        <p className="font-semibold">Scanning plate...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scan result */}
                {scanResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-800 font-semibold">Detected Plate:</span>
                      <span className="text-green-600 text-sm">
                        {(scanResult.confidence * 100).toFixed(1)}% confidence
                      </span>
                    </div>
                    <p className="text-2xl font-mono font-bold text-green-900 tracking-wider">
                      {scanResult.plate}
                    </p>
                    {scanResult.all_text.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-green-700 mb-2">Other detected text:</p>
                        <div className="flex flex-wrap gap-2">
                          {scanResult.all_text
                            .filter((t) => t !== scanResult.plate)
                            .map((t, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({ ...prev, vehicle_number: t.toUpperCase() }))
                                }
                                className="px-3 py-1 bg-white border border-green-300 rounded-full text-xs text-green-800 hover:bg-green-100 transition"
                              >
                                {t}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OCR Error - Manual Input Fallback */}
                {scanState === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-semibold">OCR failed – enter manually</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., KA 12 AB 1234"
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData((p) => ({ ...p, vehicle_number: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm font-mono"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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

                {/* Camera controls */}
                <div className="flex gap-3">
                  {!capturedFrame ? (
                    <Button
                      type="button"
                      onClick={captureAndScan}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold flex items-center justify-center gap-2"
                      disabled={!cameraActive || scanState === 'scanning'}
                    >
                      <Camera className="w-5 h-5" />
                      {scanState === 'scanning' ? 'Scanning...' : 'Capture & Read Plate'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={retakePhoto}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 font-semibold flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Retake Photo
                    </Button>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Form fields */}
          <section className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter employee name"
              required
              minLength={2}
              maxLength={200}
            />
            <Input
              label="House Number"
              value={formData.house_number}
              onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
              placeholder="e.g., A-101"
              required
              minLength={1}
              maxLength={50}
            />
            <Input
              label="RFID Tag"
              value={formData.rfid_tag}
              onChange={(e) => setFormData({ ...formData, rfid_tag: e.target.value })}
              placeholder="e.g., RF123456789"
              required
              minLength={4}
              maxLength={100}
            />
            <div>
              <Input
                label="Vehicle Number (Optional)"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                placeholder="e.g., MH 12 AB 1234"
                maxLength={50}
              />
              {formData.vehicle_number && !validatePlateFormat(formData.vehicle_number) && (
                <p className="text-xs text-red-600 mt-1">⚠ Invalid format. Use: KA 12 AB 1234</p>
              )}
              {formData.vehicle_number && validatePlateFormat(formData.vehicle_number) && (
                <p className="text-xs text-green-600 mt-1">✓ Valid plate format</p>
              )}
            </div>
          </section>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={submitting || !formData.name || !formData.house_number || !formData.rfid_tag}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Registering...' : 'Register Employee'}
          </Button>
        </form>
      </div>
    </div>
  );
}
