// src/movies/components/MediaModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

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

  const handleSave = () => {
    if (!title.trim()) return;
    
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? '✏️ Edit Media' : '🎬 Add New Media'}
          </h2>
          <button onClick={onDismiss} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Title</label>
            <input 
              autoFocus
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Breaking Bad"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="movie">Movie</option>
                <option value="series">Series</option>
                <option value="season">Season</option>
                <option value="episode">Episode</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="planned">Clock / Planned</option>
                <option value="watching">Eye / Watching</option>
                <option value="watched">Check / Watched</option>
                <option value="dropped">X / Dropped</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
              <ImageIcon size={16} className="text-purple-500" /> Poster / Cover (Base64)
            </label>
            <textarea 
              rows={4}
              value={imageBase64} 
              onChange={(e) => setImageBase64(e.target.value)}
              placeholder="Paste raw Base64 string here..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-mono text-xs"
            />
          </div>
          
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1.5">Position Order</label>
             <input 
               type="number" 
               value={position} 
               onChange={(e) => setPosition(e.target.value)}
               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
             />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onDismiss} className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!title.trim()} className="px-6 py-2.5 font-bold bg-purple-600 disabled:bg-purple-300 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30">
            {initialData ? 'Save Changes' : 'Add to Tracker'}
          </button>
        </div>

      </div>
    </div>
  );
}