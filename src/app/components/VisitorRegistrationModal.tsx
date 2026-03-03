/**
 * 📝 VISITOR REGISTRATION MODAL WITH CAMERA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Professional visitor registration modal featuring:
 * ✅ Webcam snapshot capture
 * ✅ Form validation
 * ✅ Date/time pickers for validity
 * ✅ Real-time preview
 * ✅ Error handling
 * ✅ Loading states
 * 
 * Integration: Works with visitorsApi.create() endpoint
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Calendar, Phone, Home, Car, FileText, Clock, CheckCircle } from 'lucide-react';
import { visitorsApi } from '../../lib/api';

interface VisitorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VisitorRegistrationModal({ isOpen, onClose, onSuccess }: VisitorRegistrationModalProps) {
  // ─── Form State ───
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitingFlat, setVisitingFlat] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTill, setValidTill] = useState('');

  // ─── Camera State ───
  const [cameraActive, setCameraActive] = useState(false);
  const [snapshot, setSnapshot] = useState<Blob | null>(null);
  const [snapshotPreview, setSnapshotPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ─── UI State ───
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'camera' | 'preview'>('form');

  // ─── Initialize default dates ───
  useEffect(() => {
    if (isOpen && !validFrom) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setValidFrom(now.toISOString().slice(0, 16)); // Format: YYYY-MM-DDTHH:mm
      setValidTill(tomorrow.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  // ═══════════════════════════════════════════════════════════════════════
  // 📸 CAMERA FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in your browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setStep('camera');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another application.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const captureSnapshot = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setSnapshot(blob);
          setSnapshotPreview(URL.createObjectURL(blob));
          stopCamera();
          setStep('preview');
        }
      }, 'image/jpeg', 0.9);
    }
  }, [stopCamera]);

  const retakeSnapshot = useCallback(() => {
    setSnapshot(null);
    if (snapshotPreview) {
      URL.revokeObjectURL(snapshotPreview);
      setSnapshotPreview(null);
    }
    startCamera();
  }, [snapshotPreview, startCamera]);

  // ═══════════════════════════════════════════════════════════════════════
  // 📝 FORM SUBMISSION
  // ═══════════════════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (!name.trim()) {
        throw new Error('Name is required');
      }
      if (!phone.trim()) {
        throw new Error('Phone number is required');
      }
      if (!visitingFlat.trim()) {
        throw new Error('Visiting flat is required');
      }
      if (!validFrom || !validTill) {
        throw new Error('Validity period is required');
      }

      // Validate phone format
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 7) {
        throw new Error('Invalid phone number');
      }

      // Check validity dates
      const fromDate = new Date(validFrom);
      const tillDate = new Date(validTill);
      if (tillDate <= fromDate) {
        throw new Error('Valid till must be after valid from');
      }

      // Build form data
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      formData.append('visiting_flat', visitingFlat.trim());
      
      if (vehicleNumber.trim()) {
        formData.append('vehicle_number', vehicleNumber.trim());
      }
      
      if (purpose.trim()) {
        formData.append('purpose', purpose.trim());
      }
      
      formData.append('valid_from', fromDate.toISOString());
      formData.append('valid_till', tillDate.toISOString());
      
      if (snapshot) {
        formData.append('snapshot', snapshot, 'visitor-photo.jpg');
      }

      // Submit
      await visitorsApi.create(formData);
      
      // Success
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register visitor');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 🧹 CLEANUP
  // ═══════════════════════════════════════════════════════════════════════

  const handleClose = useCallback(() => {
    stopCamera();
    if (snapshotPreview) {
      URL.revokeObjectURL(snapshotPreview);
    }
    
    // Reset form
    setName('');
    setPhone('');
    setVisitingFlat('');
    setVehicleNumber('');
    setPurpose('');
    setValidFrom('');
    setValidTill('');
    setSnapshot(null);
    setSnapshotPreview(null);
    setError(null);
    setStep('form');
    
    onClose();
  }, [stopCamera, snapshotPreview, onClose]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopCamera();
      if (snapshotPreview) {
        URL.revokeObjectURL(snapshotPreview);
      }
    };
  }, [stopCamera, snapshotPreview]);

  // ═══════════════════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════════════════

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Register New Visitor</h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'form' && 'Fill in visitor details'}
              {step === 'camera' && 'Capture visitor photo'}
              {step === 'preview' && 'Review and submit'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Visitor Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Visiting Flat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Home className="w-4 h-4 inline mr-2" />
                  Visiting Flat/Resident *
                </label>
                <input
                  type="text"
                  value={visitingFlat}
                  onChange={(e) => setVisitingFlat(e.target.value)}
                  placeholder="e.g., A-101, Tower B-205"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Vehicle Number (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Car className="w-4 h-4 inline mr-2" />
                  Vehicle Number (Optional)
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC-1234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Purpose (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Purpose of Visit (Optional)
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g., Personal visit, Delivery, Maintenance"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Validity Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Valid From *
                  </label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Valid Till *
                  </label>
                  <input
                    type="datetime-local"
                    value={validTill}
                    onChange={(e) => setValidTill(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Snapshot Preview */}
              {snapshotPreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Camera className="w-4 h-4 inline mr-2" />
                    Visitor Photo
                  </label>
                  <div className="relative">
                    <img
                      src={snapshotPreview}
                      alt="Visitor snapshot"
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={retakeSnapshot}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 px-3 py-1 rounded-lg text-sm font-medium shadow-lg transition-colors"
                    >
                      Retake Photo
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {!snapshotPreview && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Register Visitor
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Camera View */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-[480px] object-cover"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <button
                    onClick={captureSnapshot}
                    className="bg-white hover:bg-gray-100 text-gray-900 font-medium px-6 py-3 rounded-lg shadow-lg transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </button>
                  <button
                    onClick={() => {
                      stopCamera();
                      setStep('form');
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <p className="text-center text-gray-600 text-sm">
                Position yourself in the frame and click "Capture Photo"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
