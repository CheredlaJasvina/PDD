import React, { useState, useRef } from 'react';
import { FoodItem } from '../types';

interface ScannerProps {
  onScanComplete: (scans: FoodItem[]) => void;
  onAddManual: (item: any) => void;
}

const foodAutocompleteDB: Record<string, { category: 'fruits' | 'vegetables' | 'cooked food' | 'packaged food'; shelfLife: number; calories: number; isCooked: boolean }> = {
  apple: { category: 'fruits', shelfLife: 14, calories: 52, isCooked: false },
  banana: { category: 'fruits', shelfLife: 7, calories: 89, isCooked: false },
  orange: { category: 'fruits', shelfLife: 10, calories: 47, isCooked: false },
  strawberry: { category: 'fruits', shelfLife: 4, calories: 32, isCooked: false },
  grape: { category: 'fruits', shelfLife: 7, calories: 67, isCooked: false },
  mango: { category: 'fruits', shelfLife: 5, calories: 60, isCooked: false },
  blueberry: { category: 'fruits', shelfLife: 6, calories: 57, isCooked: false },
  pineapple: { category: 'fruits', shelfLife: 5, calories: 50, isCooked: false },
  watermelon: { category: 'fruits', shelfLife: 7, calories: 30, isCooked: false },
  lemon: { category: 'fruits', shelfLife: 14, calories: 29, isCooked: false },
  peach: { category: 'fruits', shelfLife: 5, calories: 39, isCooked: false },
  pear: { category: 'fruits', shelfLife: 6, calories: 57, isCooked: false },
  cherry: { category: 'fruits', shelfLife: 4, calories: 50, isCooked: false },
  kiwi: { category: 'fruits', shelfLife: 7, calories: 61, isCooked: false },
  avocado: { category: 'fruits', shelfLife: 4, calories: 160, isCooked: false },
  carrot: { category: 'vegetables', shelfLife: 21, calories: 41, isCooked: false },
  broccoli: { category: 'vegetables', shelfLife: 7, calories: 34, isCooked: false },
  spinach: { category: 'vegetables', shelfLife: 5, calories: 23, isCooked: false },
  tomato: { category: 'vegetables', shelfLife: 7, calories: 18, isCooked: false },
  potato: { category: 'vegetables', shelfLife: 30, calories: 77, isCooked: false },
  onion: { category: 'vegetables', shelfLife: 30, calories: 40, isCooked: false },
  garlic: { category: 'vegetables', shelfLife: 60, calories: 149, isCooked: false },
  cucumber: { category: 'vegetables', shelfLife: 7, calories: 15, isCooked: false },
  lettuce: { category: 'vegetables', shelfLife: 5, calories: 15, isCooked: false },
  cabbage: { category: 'vegetables', shelfLife: 14, calories: 25, isCooked: false },
  mushroom: { category: 'vegetables', shelfLife: 5, calories: 22, isCooked: false },
  milk: { category: 'packaged food', shelfLife: 7, calories: 42, isCooked: false },
  cheese: { category: 'packaged food', shelfLife: 21, calories: 402, isCooked: false },
  yogurt: { category: 'packaged food', shelfLife: 14, calories: 59, isCooked: false },
  bread: { category: 'packaged food', shelfLife: 6, calories: 265, isCooked: false },
  eggs: { category: 'packaged food', shelfLife: 21, calories: 155, isCooked: false },
  chicken: { category: 'packaged food', shelfLife: 3, calories: 165, isCooked: false },
  beef: { category: 'packaged food', shelfLife: 3, calories: 250, isCooked: false },
  fish: { category: 'packaged food', shelfLife: 2, calories: 206, isCooked: false },
  rice: { category: 'cooked food', shelfLife: 4, calories: 130, isCooked: true },
  pasta: { category: 'cooked food', shelfLife: 4, calories: 131, isCooked: true },
  soup: { category: 'cooked food', shelfLife: 3, calories: 50, isCooked: true },
  pizza: { category: 'cooked food', shelfLife: 3, calories: 266, isCooked: true }
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
      const response = await fetch('http://localhost:5000/api/inventory', {
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
  const [manualCategory, setManualCategory]   = useState<'fruits' | 'vegetables' | 'cooked food' | 'packaged food'>('fruits');
  const [manualShelfLife, setManualShelfLife] = useState(5);
  const [manualIsCooked, setManualIsCooked]   = useState(false);
  const [manualCalories, setManualCalories]   = useState(100);

  const handleNameChange = (val: string) => {
    setManualName(val);
    const key = val.toLowerCase().trim();
    
    // Look for exact key match first
    if (foodAutocompleteDB[key]) {
      const match = foodAutocompleteDB[key];
      setManualCategory(match.category);
      setManualShelfLife(match.shelfLife);
      setManualCalories(match.calories);
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

      const response = await fetch('http://localhost:5000/api/scan', {
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
      setScanError('Cannot reach backend server. Make sure Node.js is running on port 5000.');
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
                <strong style={{ color: '#fff' }}>How it works:</strong> The AI runs
                MobileNetV3 (trained on 1 000 ImageNet classes) on your photo.
                It identifies the food, cross-checks the result against the image
                colours, and rejects mismatches — so a cauliflower photo will
                never be accepted as an apple.
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
                          Running MobileNetV3 · cross-validating colours · estimating freshness
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

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              Save to Tracked Inventory
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
