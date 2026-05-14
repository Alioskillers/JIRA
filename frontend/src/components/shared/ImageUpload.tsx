'use client';

import { useState, useCallback } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  currentImageUrl?: string;
}

export function ImageUpload({ onFileSelect, onClear, currentImageUrl }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setPreview(null);
    onClear?.();
  };

  if (preview) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-zinc-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 p-1 bg-zinc-900/80 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-300" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dragging ? 'border-sky-500 bg-sky-500/5' : 'border-zinc-700 hover:border-zinc-600'
      }`}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="image-upload"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <label htmlFor="image-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-2">
          <div className="p-2 bg-zinc-800 rounded-full">
            <ImageIcon className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm text-zinc-300">Drop image here or <span className="text-sky-400">browse</span></p>
            <p className="text-xs text-zinc-500 mt-0.5">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </label>
    </div>
  );
}
