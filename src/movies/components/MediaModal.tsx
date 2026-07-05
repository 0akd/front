// src/movies/components/MediaModal.tsx
import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, UploadCloud, Trash2, ClipboardPaste } from 'lucide-react';

export interface MediaItem {
  id: number;
  title: string;
  image_base64: string | null;
  parent_id: number | null;
  type: 'movie' | 'series' | 'season' | 'episode';
  status: 'watching' | 'watched' | 'planned' | 'dropped';
  position: number;
  children?: MediaItem[];
}

interface Props {
  initialData?: MediaItem | null;
  parentId: number | null;
  suggestedType: 'movie' | 'series' | 'season' | 'episode';
  onDismiss: () => void;
  onSave: (data: Partial<MediaItem>) => void;
}

export default function MediaModal({ initialData, parentId, suggestedType, onDismiss, onSave }: Props) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState(initialData?.type || suggestedType);
  const [status, setStatus] = useState(initialData?.status || 'planned');
  const [imageBase64, setImageBase64] = useState(initialData?.image_base64 || '');
  const [position, setPosition] = useState(initialData?.position?.toString() || '0');
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Image Handling Logic ---
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyboardPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleImageFile(file);
        e.preventDefault();
        break;
      }
    }
  };

  // NEW: Button Paste Logic (Uses Browser Clipboard API)
  const handleButtonPaste = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the file browser
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await clipboardItem.getType(imageTypes[0]);
          const file = new File([blob], 'pasted-image.png', { type: blob.type });
          handleImageFile(file);
          return;
        }
      }
      alert('No image found in your clipboard. Copy an image first!');
    } catch (err) {
      console.error('Clipboard read failed:', err);
      alert('Your browser blocked clipboard access. Please use Ctrl+V / Cmd+V instead.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };
  // ----------------------------

  const handleSave = () => {
    if (!title.trim()) return;
    
    // Cleanup in case user pastes raw string instead of using the visual tool
    let finalBase64 = imageBase64.trim();
    if (finalBase64 && !finalBase64.startsWith('data:image')) {
      finalBase64 = `data:image/jpeg;base64,${finalBase64.replace(/\s+/g, '')}`;
    }

    onSave({
      title: title.trim(),
      type,
      status,
      image_base64: finalBase64 || null,
      parent_id: parentId,
      position: parseInt(position) || 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header - Fixed to Top */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            {initialData ? '✏️ Edit Media' : '🎬 Add New Media'}
          </h2>
          <button onClick={onDismiss} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body - min-h-0 is CRITICAL to prevent flex overflow bug */}
        <div 
          className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0"
          onPaste={handleKeyboardPaste} 
        >
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">Title</label>
            <input 
              autoFocus
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Get Out"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm sm:text-base cursor-pointer"
              >
                <option value="movie">Movie</option>
                <option value="series">Series</option>
                <option value="season">Season</option>
                <option value="episode">Episode</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm sm:text-base cursor-pointer"
              >
                <option value="planned">Planned</option>
                <option value="watching">Watching</option>
                <option value="watched">Watched</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
          </div>

          {/* Smart Image Dropzone */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon size={16} className="text-purple-500" /> Poster / Cover
              </span>
            </label>
            
            <div 
              onClick={() => !imageBase64 && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center w-full h-48 sm:h-56 border-2 border-dashed rounded-xl transition-colors overflow-hidden ${
                isDragging ? 'border-purple-500 bg-purple-50' : 
                imageBase64 ? 'border-gray-200 bg-gray-900' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer'
              }`}
            >
              {imageBase64 ? (
                <>
                  <img src={imageBase64} alt="Preview" className="w-full h-full object-contain opacity-90" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImageBase64(''); }}
                      className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <UploadCloud size={32} className="mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Click or drag image here</p>
                  
                  {/* NEW: Paste Button */}
                  <button 
                    type="button"
                    onClick={handleButtonPaste}
                    className="mt-3 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <ClipboardPaste size={16} /> Paste from Clipboard
                  </button>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />
            </div>
          </div>
          
          <div>
             <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">Position Order</label>
             <input 
               type="number" 
               value={position} 
               onChange={(e) => setPosition(e.target.value)}
               className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm sm:text-base"
             />
          </div>
        </div>

        {/* Footer - Fixed to Bottom */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
          <button onClick={onDismiss} className="px-4 py-2 sm:px-6 sm:py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors text-sm sm:text-base">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!title.trim()} className="px-4 py-2 sm:px-6 sm:py-2.5 font-bold bg-purple-600 disabled:bg-purple-300 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 text-sm sm:text-base">
            {initialData ? 'Save Changes' : 'Add to Tracker'}
          </button>
        </div>

      </div>
    </div>
  );
}