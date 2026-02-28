import React, { useState } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Camera, Car, X } from 'lucide-react';

export default function VisitorRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    houseNumber: '',
  });
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'warning';
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage({
      type: 'success',
      text: 'New Visitor Registered - Entry Approved',
    });
    
    setTimeout(() => {
      setFormData({ name: '', phone: '', houseNumber: '' });
      setStatusMessage(null);
    }, 3000);
  };

  const handleCancel = () => {
    setFormData({ name: '', phone: '', houseNumber: '' });
    setStatusMessage(null);
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-[14px] mb-4 shadow-sm">
            <Camera className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Visitor Registration</h1>
          <p className="text-muted-foreground">Gate 1 - Main Entrance</p>
        </div>

        {/* Registration Form */}
        <div className="bg-card border border-border rounded-[16px] p-8 mb-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Visitor Name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <Input
              label="Visiting House Number"
              type="text"
              placeholder="e.g., A-204, B-108"
              value={formData.houseNumber}
              onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
              required
            />

            {/* Auto-detected Number Plate */}
            <div className="flex flex-col gap-2">
              <label className="text-foreground text-sm font-medium">Auto-Detected Number Plate</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-[12px]">
                <Car className="w-5 h-5 text-primary" />
                <span className="font-mono text-foreground font-medium">MH 12 AB 1234</span>
                <StatusBadge status="success" size="sm">Detected</StatusBadge>
              </div>
            </div>

            {/* Photo Preview */}
            <div className="flex flex-col gap-2">
              <label className="text-foreground text-sm font-medium">Photo Preview</label>
              <div className="aspect-video bg-secondary border border-border rounded-[14px] flex flex-col items-center justify-center">
                <Camera className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Auto-capture in progress...</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="success" size="lg" className="flex-1">
                Register & Allow Entry
              </Button>
              <Button type="button" variant="secondary" size="lg" onClick={handleCancel}>
                <X className="w-5 h-5" />
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-6 rounded-[16px] text-center border-2 shadow-sm ${
            statusMessage.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-700' 
              : statusMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-500 text-amber-700'
              : 'bg-blue-50 border-blue-500 text-blue-700'
          }`}>
            <p className="text-lg font-semibold">{statusMessage.text}</p>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>All visitor entries are logged and monitored 24/7</p>
        </div>
      </div>
    </div>
  );
}