import React, { useState, useRef } from 'react';
import { FoodItem } from '../types';

interface ScannerProps {
  onScanComplete: (scans: FoodItem[]) => void;
  onAddManual: (item: any) => void;
}

const foodAutocompleteDB: Record<string, {
  category: 'fruits' | 'vegetables' | 'cooked food' | 'packaged food' | 'non-veg' | 'liquid';
  shelfLife: number; calories: number; protein: number; carbs: number; fat: number; isCooked: boolean;
}> = {
  // ── Fruits ──────────────────────────────────────────────────────────────────
  apple:       { category: 'fruits',        shelfLife: 14,  calories: 52,  protein: 0.3, carbs: 14,  fat: 0.2, isCooked: false },
  banana:      { category: 'fruits',        shelfLife: 7,   calories: 89,  protein: 1.1, carbs: 23,  fat: 0.3, isCooked: false },
  orange:      { category: 'fruits',        shelfLife: 10,  calories: 47,  protein: 0.9, carbs: 12,  fat: 0.1, isCooked: false },
  strawberry:  { category: 'fruits',        shelfLife: 4,   calories: 32,  protein: 0.7, carbs: 8,   fat: 0.3, isCooked: false },
  grape:       { category: 'fruits',        shelfLife: 7,   calories: 67,  protein: 0.6, carbs: 17,  fat: 0.4, isCooked: false },
  mango:       { category: 'fruits',        shelfLife: 5,   calories: 60,  protein: 0.8, carbs: 15,  fat: 0.4, isCooked: false },
  blueberry:   { category: 'fruits',        shelfLife: 6,   calories: 57,  protein: 0.7, carbs: 14,  fat: 0.3, isCooked: false },
  pineapple:   { category: 'fruits',        shelfLife: 5,   calories: 50,  protein: 0.5, carbs: 13,  fat: 0.1, isCooked: false },
  watermelon:  { category: 'fruits',        shelfLife: 7,   calories: 30,  protein: 0.6, carbs: 8,   fat: 0.2, isCooked: false },
  lemon:       { category: 'fruits',        shelfLife: 14,  calories: 29,  protein: 1.1, carbs: 9,   fat: 0.3, isCooked: false },
  peach:       { category: 'fruits',        shelfLife: 5,   calories: 39,  protein: 0.9, carbs: 10,  fat: 0.3, isCooked: false },
  pear:        { category: 'fruits',        shelfLife: 6,   calories: 57,  protein: 0.4, carbs: 15,  fat: 0.1, isCooked: false },
  cherry:      { category: 'fruits',        shelfLife: 4,   calories: 50,  protein: 1.0, carbs: 12,  fat: 0.3, isCooked: false },
  kiwi:        { category: 'fruits',        shelfLife: 7,   calories: 61,  protein: 1.1, carbs: 15,  fat: 0.5, isCooked: false },
  avocado:     { category: 'fruits',        shelfLife: 4,   calories: 160, protein: 2.0, carbs: 9,   fat: 15,  isCooked: false },
  papaya:      { category: 'fruits',        shelfLife: 5,   calories: 43,  protein: 0.5, carbs: 11,  fat: 0.3, isCooked: false },
  pomegranate: { category: 'fruits',        shelfLife: 14,  calories: 83,  protein: 1.7, carbs: 19,  fat: 1.2, isCooked: false },
  guava:       { category: 'fruits',        shelfLife: 5,   calories: 68,  protein: 2.6, carbs: 14,  fat: 1.0, isCooked: false },
  // ── Vegetables ──────────────────────────────────────────────────────────────
  carrot:      { category: 'vegetables',    shelfLife: 21,  calories: 41,  protein: 0.9, carbs: 10,  fat: 0.2, isCooked: false },
  broccoli:    { category: 'vegetables',    shelfLife: 7,   calories: 34,  protein: 2.8, carbs: 7,   fat: 0.4, isCooked: false },
  spinach:     { category: 'vegetables',    shelfLife: 5,   calories: 23,  protein: 2.9, carbs: 4,   fat: 0.4, isCooked: false },
  tomato:      { category: 'vegetables',    shelfLife: 7,   calories: 18,  protein: 0.9, carbs: 4,   fat: 0.2, isCooked: false },
  potato:      { category: 'vegetables',    shelfLife: 30,  calories: 77,  protein: 2.0, carbs: 17,  fat: 0.1, isCooked: false },
  onion:       { category: 'vegetables',    shelfLife: 30,  calories: 40,  protein: 1.1, carbs: 9,   fat: 0.1, isCooked: false },
  garlic:      { category: 'vegetables',    shelfLife: 60,  calories: 149, protein: 6.4, carbs: 33,  fat: 0.5, isCooked: false },
  cucumber:    { category: 'vegetables',    shelfLife: 7,   calories: 15,  protein: 0.7, carbs: 4,   fat: 0.1, isCooked: false },
  lettuce:     { category: 'vegetables',    shelfLife: 5,   calories: 15,  protein: 1.4, carbs: 3,   fat: 0.2, isCooked: false },
  cabbage:     { category: 'vegetables',    shelfLife: 14,  calories: 25,  protein: 1.3, carbs: 6,   fat: 0.1, isCooked: false },
  mushroom:    { category: 'vegetables',    shelfLife: 5,   calories: 22,  protein: 3.1, carbs: 3,   fat: 0.3, isCooked: false },
  capsicum:    { category: 'vegetables',    shelfLife: 7,   calories: 31,  protein: 1.0, carbs: 6,   fat: 0.3, isCooked: false },
  cauliflower: { category: 'vegetables',    shelfLife: 7,   calories: 25,  protein: 1.9, carbs: 5,   fat: 0.3, isCooked: false },
  peas:        { category: 'vegetables',    shelfLife: 3,   calories: 81,  protein: 5.4, carbs: 14,  fat: 0.4, isCooked: false },
  corn:        { category: 'vegetables',    shelfLife: 3,   calories: 86,  protein: 3.3, carbs: 19,  fat: 1.4, isCooked: false },
  pumpkin:     { category: 'vegetables',    shelfLife: 90,  calories: 26,  protein: 1.0, carbs: 7,   fat: 0.1, isCooked: false },
  eggplant:    { category: 'vegetables',    shelfLife: 5,   calories: 25,  protein: 1.0, carbs: 6,   fat: 0.2, isCooked: false },
  // ── Packaged Food ──────────────────────────────────────────────────────────
  cheese:      { category: 'packaged food', shelfLife: 21,  calories: 402, protein: 25,  carbs: 1,   fat: 33,  isCooked: false },
  yogurt:      { category: 'packaged food', shelfLife: 14,  calories: 59,  protein: 3.5, carbs: 5,   fat: 3.3, isCooked: false },
  bread:       { category: 'packaged food', shelfLife: 6,   calories: 265, protein: 9.0, carbs: 51,  fat: 3.2, isCooked: false },
  butter:      { category: 'packaged food', shelfLife: 30,  calories: 717, protein: 0.9, carbs: 0.1, fat: 81,  isCooked: false },
  cereal:      { category: 'packaged food', shelfLife: 180, calories: 379, protein: 8.0, carbs: 84,  fat: 2.0, isCooked: false },
  chocolate:   { category: 'packaged food', shelfLife: 90,  calories: 546, protein: 5.0, carbs: 60,  fat: 31,  isCooked: false },
  biscuit:     { category: 'packaged food', shelfLife: 60,  calories: 423, protein: 6.0, carbs: 64,  fat: 15,  isCooked: false },
  // ── Liquids ────────────────────────────────────────────────────────────────
  milk:        { category: 'liquid',        shelfLife: 7,   calories: 42,  protein: 3.4, carbs: 5,   fat: 1.0, isCooked: false },
  juice:       { category: 'liquid',        shelfLife: 10,  calories: 50,  protein: 0.7, carbs: 12,  fat: 0.2, isCooked: false },
  water:       { category: 'liquid',        shelfLife: 365, calories: 0,   protein: 0,   carbs: 0,   fat: 0,   isCooked: false },
  coconut_water:{ category: 'liquid',       shelfLife: 3,   calories: 19,  protein: 0.7, carbs: 4,   fat: 0.2, isCooked: false },
  // ── Non-Veg ────────────────────────────────────────────────────────────────
  eggs:        { category: 'non-veg',       shelfLife: 21,  calories: 155, protein: 13,  carbs: 1,   fat: 11,  isCooked: false },
  chicken:     { category: 'non-veg',       shelfLife: 3,   calories: 165, protein: 31,  carbs: 0,   fat: 3.6, isCooked: false },
  beef:        { category: 'non-veg',       shelfLife: 3,   calories: 250, protein: 26,  carbs: 0,   fat: 15,  isCooked: false },
  fish:        { category: 'non-veg',       shelfLife: 2,   calories: 206, protein: 22,  carbs: 0,   fat: 12,  isCooked: false },
  mutton:      { category: 'non-veg',       shelfLife: 2,   calories: 294, protein: 25,  carbs: 0,   fat: 21,  isCooked: false },
  prawn:       { category: 'non-veg',       shelfLife: 2,   calories: 99,  protein: 24,  carbs: 0,   fat: 0.3, isCooked: false },
  // ── Cooked Food ────────────────────────────────────────────────────────────
  rice:        { category: 'cooked food',   shelfLife: 4,   calories: 130, protein: 2.7, carbs: 28,  fat: 0.3, isCooked: true },
  pasta:       { category: 'cooked food',   shelfLife: 4,   calories: 131, protein: 5.0, carbs: 25,  fat: 1.1, isCooked: true },
  soup:        { category: 'liquid',        shelfLife: 3,   calories: 50,  protein: 2.0, carbs: 8,   fat: 1.5, isCooked: true },
  pizza:       { category: 'cooked food',   shelfLife: 3,   calories: 266, protein: 11,  carbs: 33,  fat: 10,  isCooked: true },
  curry:       { category: 'cooked food',   shelfLife: 2,   calories: 180, protein: 8.0, carbs: 20,  fat: 9.0, isCooked: true },
  biryani:     { category: 'cooked food',   shelfLife: 2,   calories: 290, protein: 12,  carbs: 45,  fat: 8.0, isCooked: true },
  sandwich:    { category: 'cooked food',   shelfLife: 1,   calories: 250, protein: 10,  carbs: 35,  fat: 8.0, isCooked: true },
};

export const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onAddManual }) => {
  const [isScanning, setIsScanning]     = useState(false);
  const [scanError, setScanError]       = useState<string | null>(null);
  const [scanResults, setScanResults]   = useState<FoodItem[] | null>(null);
  const [useManual, setUseManual]       = useState(false);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [isDragOver, setIsDragOver]     = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);

  const handleSaveScannedItem = async (item: FoodItem) => {
    setIsSavingItem(true);
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await response.json();
      if (data.success) {
        onScanComplete([data.item]);
        resetScan();
      } else {
        alert('Failed to save item: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error connecting to backend server.');
    } finally {
      setIsSavingItem(false);
    }
  };

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 150);
    } catch (err) {
      alert("Unable to access camera: " + err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });
            triggerScan(file);
            stopCamera();
          }
        }, "image/jpeg", 0.85);
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Manual form
  const [manualName, setManualName]           = useState('');
  const [manualCategory, setManualCategory]   = useState<'fruits' | 'vegetables' | 'cooked food' | 'packaged food' | 'non-veg' | 'liquid'>('fruits');
  const [manualShelfLife, setManualShelfLife] = useState(5);
  const [manualIsCooked, setManualIsCooked]   = useState(false);
  const [manualCalories, setManualCalories]   = useState(100);
  const [manualProtein, setManualProtein]     = useState(2);
  const [manualCarbs, setManualCarbs]         = useState(10);
  const [manualFat, setManualFat]             = useState(1);
  const [manualSpiceLevel, setManualSpiceLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');

  const handleNameChange = (val: string) => {
    setManualName(val);
    const key = val.toLowerCase().trim();
    
    // Look for exact key match first
    if (foodAutocompleteDB[key]) {
      const match = foodAutocompleteDB[key];
      setManualCategory(match.category);
      setManualShelfLife(match.shelfLife);
      setManualCalories(match.calories);
      setManualProtein(match.protein);
      setManualCarbs(match.carbs);
      setManualFat(match.fat);
      setManualIsCooked(match.isCooked);
      return;
    }
    
    // Look for partial key match
    const matchedKey = Object.keys(foodAutocompleteDB).find(
      k => key.includes(k) || k.includes(key)
    );
    if (matchedKey && key.length > 2) {
      const match = foodAutocompleteDB[matchedKey];
      setManualCategory(match.category);
      setManualShelfLife(match.shelfLife);
      setManualCalories(match.calories);
      setManualProtein(match.protein);
      setManualCarbs(match.carbs);
      setManualFat(match.fat);
      setManualIsCooked(match.isCooked);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── drag helpers ──────────────────────────────────────────────────────────
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true);  };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) triggerScan(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) triggerScan(e.target.files[0]);
  };

  // ── main scan function ────────────────────────────────────────────────────
  const triggerScan = async (file: File) => {
    // Validate it's actually an image
    if (!file.type.startsWith('image/')) {
      setScanError('Please upload an image file (JPG, PNG, WEBP, etc.).');
      return;
    }

    // Show a local preview immediately
    setPreviewUrl(URL.createObjectURL(file));
    setIsScanning(true);
    setScanError(null);
    setScanResults(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('https://pdd-9fqv.onrender.com/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setScanError(data.message || 'Scan rejected by classifier.');
        setIsScanning(false);
        return;
      }

      setScanResults(data.scannedItems);
    } catch {
      setScanError('Cannot reach backend server. Please verify your connection.');
    } finally {
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setScanResults(null);
    setScanError(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    onAddManual({
      name: manualName,
      category: manualCategory,
      shelfLifeDays: Number(manualShelfLife),
      isCooked: manualIsCooked,
      calories: Number(manualCalories),
      protein: Number(manualProtein),
      carbs: Number(manualCarbs),
      fat: Number(manualFat),
      spiceLevel: manualSpiceLevel,
    });
    setManualName('');
    setUseManual(false);
  };

  // ── status colour helper ──────────────────────────────────────────────────
  const statusColor = (s: string) =>
    s === 'Fresh' ? 'var(--color-fresh)' :
    s === 'Slightly Spoiled' ? 'var(--color-warning)' :
    'var(--color-spoiled)';

  const statusClass = (s: string) =>
    s === 'Fresh' ? 'fresh-badge' :
    s === 'Slightly Spoiled' ? 'warning-badge' :
    'spoiled-badge';

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h1>AI Visual Freshness Scanner</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Upload or drag a photo of any food item — the AI identifies it and estimates
          freshness automatically. No labels or dropdowns needed.
        </p>
      </div>

      {/* ── Mode switcher ── */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem' }}>
          <button
            className="btn-secondary"
            style={{
              flex: 1,
              borderColor: !useManual ? 'var(--color-fresh)' : 'var(--glass-border)',
              background:  !useManual ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.02)',
            }}
            onClick={() => { setUseManual(false); resetScan(); }}
          >
            📸 Camera &amp; Image Scanner
          </button>
          <button
            className="btn-secondary"
            style={{
              flex: 1,
              borderColor: useManual ? 'var(--color-fresh)' : 'var(--glass-border)',
              background:  useManual ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.02)',
            }}
            onClick={() => setUseManual(true)}
          >
            ✍️ Manual Entry
          </button>
        </div>

        {/* ══════════════════════ IMAGE SCANNER ══════════════════════ */}
        {!useManual && (
          <div>

            {/* ── How it works tip ── */}
            <div style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              padding: '0.85rem 1rem',
              background: 'rgba(0,230,118,0.04)',
              border: '1px solid rgba(0,230,118,0.15)',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🤖</span>
              <span>
                <strong style={{ color: '#fff' }}>How it works:</strong> The AI uses
                Qwen 27B Vision (multimodal) to identify the food in your photo,
                estimate its freshness from visual cues, and return detailed nutrition
                and storage guidance — no labels or manual input needed.
              </span>
            </div>

            {/* ── Camera Toggle Button ── */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                className="btn-secondary"
                type="button"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderColor: isCameraActive ? 'var(--color-fresh)' : 'var(--glass-border)',
                  background: isCameraActive ? 'rgba(0,230,118,0.05)' : 'var(--glass-bg)',
                  fontWeight: 600
                }}
                onClick={() => {
                  if (isCameraActive) stopCamera();
                  else startCamera();
                }}
              >
                📷 {isCameraActive ? 'Switch to Upload Mode' : 'Use Live Web Camera'}
              </button>
            </div>

            {isCameraActive ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: '320px',
                  background: '#000',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '2px solid var(--color-fresh)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem'
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: '350px', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1rem',
                    display: 'flex',
                    gap: '1rem',
                    zIndex: 10,
                  }}
                >
                  <button
                    className="btn-primary"
                    type="button"
                    style={{ background: 'var(--color-fresh)', color: '#0b0c10', padding: '0.6rem 1.25rem', fontWeight: 700 }}
                    onClick={capturePhoto}
                  >
                    📸 Capture &amp; Analyze
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    style={{ background: 'rgba(255,23,68,0.2)', borderColor: 'var(--color-spoiled)', color: 'var(--color-spoiled)', padding: '0.6rem 1.25rem', fontWeight: 700 }}
                    onClick={stopCamera}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ── Drag & Drop zone ── */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isScanning && fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragOver ? 'var(--color-fresh)' : 'var(--glass-border)'}`,
                    borderRadius: '16px',
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDragOver ? 'rgba(0,230,118,0.04)' : 'rgba(0,0,0,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isScanning ? 'default' : 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  {isScanning ? (
                    <>
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="preview"
                          style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover', opacity: 0.25,
                          }}
                        />
                      )}
                      <div style={{
                        position: 'absolute', left: 0, width: '100%', height: '3px',
                        background: 'rgba(0,230,118,0.8)',
                        boxShadow: '0 0 12px var(--color-fresh)',
                        animation: 'scanLine 1.8s ease-in-out infinite',
                      }}/>
                      <div style={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
                        <div style={{
                          width: '48px', height: '48px', margin: '0 auto 1rem',
                          border: '4px solid rgba(255,255,255,0.1)',
                          borderTop: '4px solid var(--color-fresh)',
                          borderRadius: '50%',
                          animation: 'spin 0.9s linear infinite',
                        }}/>
                        <h2 style={{ fontSize: '1.1rem' }}>Analysing food composition…</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                          Sending to Qwen 27B Vision · analysing food · estimating freshness
                        </p>
                      </div>
                    </>
                  ) : previewUrl && scanResults ? (
                    <img
                      src={previewUrl}
                      alt="scanned food"
                      style={{
                        width: '100%', height: '280px',
                        objectFit: 'cover', borderRadius: '14px',
                        opacity: 0.6,
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📸</div>
                      <h2 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
                        Drop a food photo here
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        or click to select from your device
                      </p>
                      <span
                        className="btn-primary"
                        style={{
                          display: 'inline-flex', marginTop: '1.5rem',
                          padding: '0.6rem 1.4rem', fontSize: '0.85rem',
                          pointerEvents: 'none',
                        }}
                      >
                        Select Image
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Accepted formats note ── */}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.6rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                  Supports JPG · PNG · WEBP · GIF — max ~10 MB
                </p>
              </>
            )}

            {/* ── Error / Rejection card ── */}
            {scanError && (
              <div
                className="glass-card"
                style={{
                  borderColor: 'var(--color-spoiled)',
                  background: 'var(--color-spoiled-bg)',
                  marginTop: '1.5rem',
                  display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  animation: 'fadeInUp 0.3s ease',
                }}
              >
                <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'var(--color-spoiled)', marginBottom: '0.3rem' }}>
                    Scan Rejected
                  </h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{scanError}</p>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', flexShrink: 0 }}
                  onClick={resetScan}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* ── Success results ── */}
            {scanResults && scanResults.length > 0 && (
              <div style={{ marginTop: '2rem', animation: 'fadeInUp 0.35s ease' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '1rem',
                }}>
                  <h2 style={{ color: 'var(--color-fresh)' }}>
                    ✅ {scanResults.length} Item{scanResults.length > 1 ? 's' : ''} Detected
                  </h2>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                    onClick={resetScan}
                  >
                    Scan Another
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {scanResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="glass-card"
                      style={{
                        borderLeft: `6px solid ${statusColor(item.status)}`,
                        animation: `fadeInUp ${0.2 + idx * 0.08}s ease`,
                      }}
                    >
                      {/* Header row */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem',
                        marginBottom: '1rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {previewUrl && (
                            <img
                              src={previewUrl}
                              alt={item.name}
                              style={{
                                width: '60px', height: '60px',
                                borderRadius: '10px', objectFit: 'cover',
                                border: '1px solid var(--glass-border)',
                              }}
                            />
                          )}
                          <div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>
                              {item.name}
                            </h3>
                            <span style={{
                              fontSize: '0.75rem', color: 'var(--text-muted)',
                              textTransform: 'capitalize',
                            }}>
                              {item.category} · {item.isCooked ? 'Cooked' : 'Raw'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                          <span className={`user-score-badge ${statusClass(item.status)}`}>
                            {item.status} · {item.originalFreshness}%
                          </span>
                          {/* Show AI confidence if available */}
                          {(item as any).confidence && (
                            <span style={{
                              fontSize: '0.7rem', color: 'var(--text-muted)',
                              padding: '0.15rem 0.5rem',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '6px',
                            }}>
                              🤖 AI confidence: {(item as any).confidence}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Freshness bar */}
                      <div className="progress-container" style={{ marginBottom: '1rem' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${item.originalFreshness}%`,
                            background: statusColor(item.status),
                          }}
                        />
                      </div>

                      {/* OCR info */}
                      {item.ocrInfo?.hasOcrMatch && (
                        <div style={{
                          marginBottom: '0.75rem',
                          padding: '0.7rem 1rem',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-warning)',
                          fontSize: '0.82rem',
                        }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>
                            🔍 Label OCR:
                          </span>{' '}
                          Brand: <strong>{item.ocrInfo.brand}</strong> · Expiry:{' '}
                          <strong>
                            {item.ocrInfo.expiryDate
                              ? new Date(item.ocrInfo.expiryDate).toLocaleDateString()
                              : '—'}
                          </strong>
                        </div>
                      )}

                      {/* Nutrition details */}
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}>
                        <div style={{ display: 'flex', gap: '1rem', fontWeight: 600 }}>
                          <span>🔥 Calories: {item.nutrition.calories} kcal</span>
                          <span>💪 Protein: {item.nutrition.protein}g</span>
                          <span>🍞 Carbs: {item.nutrition.carbs}g</span>
                          <span>💧 Fat: {item.nutrition.fat}g</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                          ℹ️ {item.nutrition.healthNotes || 'No health notes available.'}
                        </div>
                      </div>

                      {/* Guidance + safety */}
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: '0.4rem',
                        fontSize: '0.85rem',
                        marginTop: '0.75rem'
                      }}>
                        <div>
                          <strong>🌡️ Storage:</strong>{' '}
                          <span style={{ color: 'var(--text-muted)' }}>{item.storageGuidance}</span>
                        </div>
                        <div>
                          <strong>🛡️ Safety:</strong>{' '}
                          <span style={{
                            color: item.status === 'Spoiled'
                              ? 'var(--color-spoiled)'
                              : 'var(--text-muted)',
                          }}>
                            {item.safetyAdvisory}
                          </span>
                        </div>
                      </div>

                      {/* Dietary conflicts */}
                      {item.compatibilityConflicts && item.compatibilityConflicts.length > 0 && (
                        <div style={{
                          marginTop: '0.75rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          background: 'rgba(255,23,68,0.05)',
                          border: '1px solid rgba(255,23,68,0.2)',
                          fontSize: '0.8rem',
                          color: 'var(--color-spoiled)',
                        }}>
                          ⚠️ Dietary conflict with your profile:{' '}
                          <strong>{item.compatibilityConflicts.join(', ')}</strong>
                        </div>
                      )}

                      {/* Save & Discard buttons */}
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                        <button
                          className="btn-primary"
                          type="button"
                          style={{
                            flex: 1,
                            background: 'var(--color-fresh)',
                            color: '#0b0c10',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                          }}
                          onClick={() => handleSaveScannedItem(item)}
                          disabled={isSavingItem}
                        >
                          💾 {isSavingItem ? 'Saving...' : 'Save to Pantry'}
                        </button>
                        <button
                          className="btn-secondary"
                          type="button"
                          style={{
                            flex: 1,
                            borderColor: 'var(--color-spoiled)',
                            color: 'var(--color-spoiled)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                          }}
                          onClick={resetScan}
                          disabled={isSavingItem}
                        >
                          🗑️ Discard Scan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════ MANUAL ENTRY ══════════════════════ */}
        {useManual && (
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(255,234,0,0.04)',
              border: '1px solid rgba(255,234,0,0.15)',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}>
              💡 Use this when the AI scanner can't identify an item (poor lighting, unusual packaging, etc.).
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                Food Item Name
              </label>
              <input
                type="text"
                placeholder="e.g. Organic Strawberries"
                value={manualName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  Category
                </label>
                <select
                  value={manualCategory}
                  onChange={(e: any) => setManualCategory(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                >
                  <option value="fruits">Fruits</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="cooked food">Cooked Food</option>
                  <option value="packaged food">Packaged Food</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="liquid">Liquid</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  Shelf-life (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={manualShelfLife}
                  onChange={(e) => setManualShelfLife(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input
                  type="checkbox"
                  id="manualCooked"
                  checked={manualIsCooked}
                  onChange={(e) => setManualIsCooked(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="manualCooked" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Already cooked / ready to eat?
                </label>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>
            </div>

            {/* Nutrition row: Protein / Carbs / Fat */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', fontWeight: 600 }}>Protein (g)</label>
                <input type="number" min="0" step="0.1" value={manualProtein}
                  onChange={(e) => setManualProtein(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', fontWeight: 600 }}>Carbs (g)</label>
                <input type="number" min="0" step="0.1" value={manualCarbs}
                  onChange={(e) => setManualCarbs(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', fontWeight: 600 }}>Fat (g)</label>
                <input type="number" min="0" step="0.1" value={manualFat}
                  onChange={(e) => setManualFat(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '8px', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  Spice Level
                </label>
                <select
                  value={manualSpiceLevel}
                  onChange={(e: any) => setManualSpiceLevel(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              Save to Tracked Inventory
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
