import React, { useState } from 'react';
import type { Category } from '../lib/types';
import { X } from 'lucide-react';

interface Props {
  initialPosition: number;
  initialCategoryId: number | null;
  categories: Category[];
  onDismiss: () => void;
  onSave: (title: string, position: number, catId: number | null, targetVal: number | null, lapDur: number | null) => void;
}

export default function AddTodoModal({ initialPosition, initialCategoryId, categories, onDismiss, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState(initialPosition.toString());
  const [categoryId, setCategoryId] = useState<number | ''>(initialCategoryId || '');
  const [targetValue, setTargetValue] = useState('');
  const [lapMinutes, setLapMinutes] = useState('');
  const [lapSeconds, setLapSeconds] = useState('');

  const handleSave = () => {
    if (!title.trim()) return;
    
    const totalLapSeconds = 
      (parseInt(lapMinutes) || 0) * 60 + 
      (parseInt(lapSeconds) || 0);

    onSave(
      title.trim(),
      parseInt(position) || 0,
      categoryId === '' ? null : Number(categoryId),
      targetValue ? parseInt(targetValue) : null,
      totalLapSeconds > 0 ? totalLapSeconds : null
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold">✨ Add New Task</h2>
          <button onClick={onDismiss} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input 
              autoFocus
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input 
                type="number" 
                value={position} 
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <input 
                type="number" 
                value={targetValue} 
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lap Duration</label>
            <div className="flex gap-4">
              <input 
                type="number" 
                placeholder="Minutes"
                value={lapMinutes} 
                onChange={(e) => setLapMinutes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input 
                type="number" 
                placeholder="Seconds"
                value={lapSeconds} 
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (val <= 59) setLapSeconds(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="">Uncategorized</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                   {cat.level > 0 ? "↳ ".repeat(cat.level) : ""}{cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onDismiss} className="px-5 py-2 font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim()} className="px-5 py-2 font-medium bg-purple-600 disabled:bg-purple-300 text-white rounded-xl transition-colors">Add Task</button>
        </div>

      </div>
    </div>
  );
}