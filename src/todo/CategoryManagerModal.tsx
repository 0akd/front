// src/todo/CategoryManagerModal.tsx
import React, { useState, useMemo } from 'react';
import type { Category } from './types';
import { ChevronRight, ChevronDown, Folder, FileText, Plus, Edit2, Trash2, Save, X, AlertTriangle } from 'lucide-react';

interface Props {
  isEditingMode: boolean;
  categories: Category[];
  onDismiss: () => void;
  onSelectCategory: (cat: Category | null) => void;
  onCreateCategory: (name: string, desc: string | null, parentId: number | null) => void;
  onUpdateCategory: (id: number, name: string, desc: string | null) => void;
  onDeleteCategory: (id: number) => void;
}

export default function CategoryManagerModal({
  isEditingMode, categories, onDismiss, onSelectCategory, onCreateCategory, onUpdateCategory, onDeleteCategory
}: Props) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingCatDesc, setEditingCatDesc] = useState("");

  const [addingSubToCat, setAddingSubToCat] = useState<Category | null>(null);
  const [subCatName, setSubCatName] = useState("");
  const [subCatDesc, setSubCatDesc] = useState("");

  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Flatten tree for rendering, respecting collapsed states
  const visibleCategories = useMemo(() => {
    const result: (Category & { displayLevel: number })[] = [];
    const traverse = (cats: Category[], level: number) => {
      for (const cat of cats) {
        result.push({ ...cat, displayLevel: level });
        if (!collapsedIds.has(cat.id) && cat.children && cat.children.length > 0) {
          traverse(cat.children, level + 1);
        }
      }
    };
    traverse(categories, 0);
    return result;
  }, [categories, collapsedIds]);

  const toggleCollapse = (id: number) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* --- ADD SUB-CATEGORY DIALOG --- */}
      {addingSubToCat && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Add Sub-category to '{addingSubToCat.name}'</h3>
            <input type="text" value={subCatName} onChange={e => setSubCatName(e.target.value)} placeholder="Name" className="w-full px-4 py-2 border rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="text" value={subCatDesc} onChange={e => setSubCatDesc(e.target.value)} placeholder="Description (Optional)" className="w-full px-4 py-2 border rounded-xl mb-5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setAddingSubToCat(null); setSubCatName(""); setSubCatDesc(""); }} className="px-4 py-2 font-medium text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={() => {
                if (subCatName.trim()) {
                  onCreateCategory(subCatName.trim(), subCatDesc.trim() || null, addingSubToCat.id);
                  setCollapsedIds(prev => { const next = new Set(prev); next.delete(addingSubToCat.id); return next; });
                  setAddingSubToCat(null); setSubCatName(""); setSubCatDesc("");
                }
              }} className="px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {categoryToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border-t-4 border-red-500">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-red-500" size={24} />
              <h3 className="text-lg font-bold text-red-600">Delete Folder?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Deleting <strong>'{categoryToDelete.name}'</strong> will permanently remove it AND all its sub-folders. Tasks inside will be uncategorized.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCategoryToDelete(null)} className="px-4 py-2 font-medium text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={() => { onDeleteCategory(categoryToDelete.id); setCategoryToDelete(null); }} className="px-4 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600">Delete Forever</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN MANAGER DIALOG --- */}
      <div className="bg-white rounded-3xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2"><Folder className="text-purple-500"/> Categories</h2>
          <button onClick={onDismiss} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        {isEditingMode && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-2 mb-2">
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New Root Category Name" className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Description (Optional)" className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              <button onClick={() => {
                if (newCatName.trim()) { onCreateCategory(newCatName.trim(), newCatDesc.trim() || null, null); setNewCatName(""); setNewCatDesc(""); }
              }} className="px-5 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700">Add</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* ALL TASKS (Root) */}
          <div onClick={() => { if (!isEditingMode) onSelectCategory(null); }} className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
            <div className="w-6 flex justify-center"><FileText className="text-gray-400" size={18} /></div>
            <span className="font-semibold text-gray-800">📋 All Tasks</span>
          </div>

          {visibleCategories.map(cat => {
            const hasChildren = cat.children && cat.children.length > 0;
            const isCollapsed = collapsedIds.has(cat.id);
            const isEditingThis = editingCatId === cat.id;

            return (
              <div key={cat.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl group transition-colors" style={{ paddingLeft: `${(cat.displayLevel * 1.5) + 0.5}rem` }}>
                {/* Collapse Toggle */}
                <div className="w-6 flex justify-center cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleCollapse(cat.id); }}>
                  {hasChildren ? (isCollapsed ? <ChevronRight size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>) : <span className="w-4"/>}
                </div>
                
                <Folder className="text-purple-400 flex-shrink-0" size={18} />

                {isEditingThis ? (
                  <div className="flex-1 flex flex-col gap-1 pr-2">
                    <input autoFocus type="text" value={editingCatName} onChange={e => setEditingCatName(e.target.value)} className="px-3 py-1 border rounded-lg text-sm" placeholder="Name" />
                    <input type="text" value={editingCatDesc} onChange={e => setEditingCatDesc(e.target.value)} className="px-3 py-1 border rounded-lg text-sm" placeholder="Description" />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { if (!isEditingMode) onSelectCategory(cat); }}>
                    <div className="font-medium text-gray-800 truncate">{cat.name}</div>
                    {isEditingMode && cat.description && <div className="text-xs text-gray-500 truncate">{cat.description}</div>}
                  </div>
                )}

                {/* Edit Controls */}
                {isEditingMode && (
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditingThis ? (
                      <button onClick={() => {
                        if (editingCatName.trim()) onUpdateCategory(cat.id, editingCatName.trim(), editingCatDesc.trim() || null);
                        setEditingCatId(null);
                      }} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><Save size={14}/></button>
                    ) : (
                      <>
                        <button onClick={() => setAddingSubToCat(cat)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"><Plus size={14}/></button>
                        <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); setEditingCatDesc(cat.description || ""); }} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg"><Edit2 size={14}/></button>
                        <button onClick={() => setCategoryToDelete(cat)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={14}/></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}