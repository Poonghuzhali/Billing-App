import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function CameraScanner({ onScan }) {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const readerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(
      null,
      videoRef.current,
      (result, err) => {
        if (result) {
          const code = result.getText();
          onScan(code);
          reader.reset();
          setActive(false);
        }
      }
    ).catch(() => {
      setError('Camera access denied or unavailable.');
    });

    return () => {
      reader.reset();
    };
  }, [active, onScan]);

  return (
    <div className="relative">
      {!active ? (
        <button
          onClick={() => { setActive(true); setError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Open Camera Scanner
        </button>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
          <video ref={videoRef} className="w-full max-h-64 object-cover" />
          <div className="absolute inset-0 border-2 border-emerald-400 rounded-lg pointer-events-none" />
          <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-0.5 rounded text-xs font-semibold">Scanning...</div>
          <button
            onClick={() => { readerRef.current?.reset(); setActive(false); }}
            className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-700"
          >✕</button>
          {error && <div className="absolute bottom-2 left-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs">{error}</div>}
        </div>
      )}
    </div>
  );
}
