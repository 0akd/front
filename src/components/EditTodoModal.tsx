import React, { useState } from 'react';
import type { Todo, Category } from '../lib/types';
import { X } from 'lucide-react';

interface Props {
  todo: Todo;
  categories: Category[];
  onDismiss: () => void;
  onSave: (id: number, updates: Partial<Todo>) => void;
}

export default function EditTodoModal({ todo, categories, onDismiss, onSave }: Props) {
  const [title, setTitle] = useState(todo.title);
  const [position, setPosition] = useState(todo.position.toString());
  const [categoryId, setCategoryId] = useState<number | ''>(todo.category_id || '');
  const [lapDuration, setLapDuration] = useState(todo.lap_duration?.toString() || '');

  const handleSave = () => {
    onSave(todo.id, {
      title,
      position: parseInt(position) || 0,
      category_id: categoryId === '' ? null : Number(categoryId),
      lap_duration: lapDuration ? parseInt(lapDuration) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold">✏️ Edit Task</h2>
          <button onClick={onDismiss} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input 
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Timer (Seconds)</label>
              <input 
                type="number" 
                placeholder="e.g. 60"
                value={lapDuration} 
                onChange={(e) => setLapDuration(e.target.value)}
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
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onDismiss} className="px-5 py-2 font-medium text-gray-600 hover:bg-gray-200 rounded-xl">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">Save Changes</button>
        </div>

      </div>
    </div>
  );
}