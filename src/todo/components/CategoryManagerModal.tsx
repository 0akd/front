// src/todo/CategoryManagerModal.tsx
import React, { useState, useMemo } from 'react';
import type { Category } from '../types';
import { ChevronRight, ChevronDown, Folder, FileText, AlertTriangle, X } from 'lucide-react';

interface Props {
  isEditingMode: boolean;
  categories: Category[];
  clipboard: any; // Using any for brevity since type is defined in TodoApp
  setClipboard: (item: any) => void;
  onDismiss: () => void;
  onSelectCategory: (cat: Category | null) => void;
  onCreateCategory: (name: string, desc: string | null, parentId: number | null) => void;
  onUpdateCategory: (id: number, updates: Partial<Category>) => void;
  onDeleteCategory: (id: number) => void;
}

export default function CategoryManagerModal({
  isEditingMode, categories, clipboard, setClipboard, onDismiss, onSelectCategory, onCreateCategory, onUpdateCategory, onDeleteCategory
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

  const visibleCategories = useMemo(() => {
    const result: (Category & { displayLevel: number })[] = [];
    const traverse = (cats: Category[], level: number) => {
      // ⚡ Enforce visual sorting based on position updates
      const sortedCats = [...cats].sort((a, b) => a.position - b.position);
      
      for (const cat of sortedCats) {
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
      
      {/* Sub-Category Dialog */}
      {addingSubToCat && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Add Sub-category</h3>
            <input type="text" value={subCatName} onChange={e => setSubCatName(e.target.value)} placeholder="Name" className="w-full px-4 py-2 border rounded-xl mb-3" />
            <input type="text" value={subCatDesc} onChange={e => setSubCatDesc(e.target.value)} placeholder="Description" className="w-full px-4 py-2 border rounded-xl mb-5" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setAddingSubToCat(null)} className="px-4 py-2 text-gray-500">Cancel</button>
              <button onClick={() => {
                if (subCatName.trim()) {
                  onCreateCategory(subCatName.trim(), subCatDesc.trim() || null, addingSubToCat.id);
                  setCollapsedIds(prev => { const next = new Set(prev); next.delete(addingSubToCat.id); return next; });
                  setAddingSubToCat(null); setSubCatName(""); setSubCatDesc("");
                }
              }} className="px-4 py-2 bg-purple-600 text-white rounded-xl">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {categoryToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border-t-4 border-red-500">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-red-500" size={24} />
              <h3 className="text-lg font-bold text-red-600">Delete Folder?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">Permanently remove <strong>'{categoryToDelete.name}'</strong> and all sub-folders?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCategoryToDelete(null)} className="px-4 py-2 text-gray-500">Cancel</button>
              <button onClick={() => { onDeleteCategory(categoryToDelete.id); setCategoryToDelete(null); }} className="px-4 py-2 bg-red-500 text-white rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="bg-white rounded-3xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2"><Folder className="text-purple-500"/> Categories</h2>
          <button onClick={onDismiss} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        {isEditingMode && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-2 mb-2">
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New Root Category" className="flex-1 px-4 py-2 border rounded-xl" />
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Description" className="flex-1 px-4 py-2 border rounded-xl" />
              <button onClick={() => {
                if (newCatName.trim()) { onCreateCategory(newCatName.trim(), newCatDesc.trim() || null, null); setNewCatName(""); setNewCatDesc(""); }
              }} className="px-5 py-2 bg-purple-600 text-white rounded-xl">Add</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div onClick={() => { if (!isEditingMode) onSelectCategory(null); }} className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl cursor-pointer">
            <div className="w-6 flex justify-center"><FileText className="text-gray-400" size={18} /></div>
            <span className="font-semibold text-gray-800">📋 All Tasks</span>
          </div>

          {visibleCategories.map((cat, index) => {
            const hasChildren = cat.children && cat.children.length > 0;
            const isCollapsed = collapsedIds.has(cat.id);
            const isEditingThis = editingCatId === cat.id;

            // Figure out adjacent categories at the SAME level for movement
            const siblings = visibleCategories.filter(c => c.parent_id === cat.parent_id);
            const mySiblingIndex = siblings.findIndex(c => c.id === cat.id);
            const canMoveUp = mySiblingIndex > 0;
            const canMoveDown = mySiblingIndex < siblings.length - 1;

            return (
              <div key={cat.id} className="flex flex-col p-2 hover:bg-gray-50 rounded-xl transition-colors" style={{ paddingLeft: `${(cat.displayLevel * 1.5) + 0.5}rem` }}>
                
                <div className="flex items-center gap-2 w-full">
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
                      <div className="font-medium text-gray-800 truncate flex items-center gap-2">
                        {cat.name}
                        {!isEditingMode && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">#{cat.position}</span>}
                      </div>
                      {isEditingMode && cat.description && <div className="text-xs text-gray-500 truncate">{cat.description}</div>}
                    </div>
                  )}

                  {/* Add Sub-category shortcut */}
                  {isEditingMode && !isEditingThis && (
                     <button onClick={() => setAddingSubToCat(cat)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg" title="Add Sub-folder">➕</button>
                  )}

                  {/* Save button for inline edits */}
                  {isEditingMode && isEditingThis && (
                    <button onClick={() => {
                      if (editingCatName.trim()) onUpdateCategory(cat.id, { name: editingCatName.trim(), description: editingCatDesc.trim() || null });
                      setEditingCatId(null);
                    }} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200">💾</button>
                  )}
                </div>

                {/* --- Android-Style Button Row for Categories --- */}
                {isEditingMode && !isEditingThis && (
                  <div className="flex justify-end mt-2">
                    <div className="flex bg-gray-100/50 rounded-xl p-1 gap-1">
                      <button onClick={() => setClipboard({ id: cat.id, type: 'CATEGORY', isCut: true })} className="p-1.5 hover:bg-white rounded-lg" title="Cut">✂️</button>
                      <button onClick={() => setClipboard({ id: cat.id, type: 'CATEGORY', isCut: false })} className="p-1.5 hover:bg-white rounded-lg" title="Copy">📋</button>
                      <button disabled={!canMoveUp} onClick={() => onUpdateCategory(cat.id, { position: siblings[mySiblingIndex - 1].position })} className={`p-1.5 rounded-lg ${canMoveUp ? 'hover:bg-white' : 'opacity-30 cursor-not-allowed'}`} title="Move Up">↑</button>
                      <button disabled={!canMoveDown} onClick={() => onUpdateCategory(cat.id, { position: siblings[mySiblingIndex + 1].position })} className={`p-1.5 rounded-lg ${canMoveDown ? 'hover:bg-white' : 'opacity-30 cursor-not-allowed'}`} title="Move Down">↓</button>
                      <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); setEditingCatDesc(cat.description || ""); }} className="p-1.5 hover:bg-white rounded-lg" title="Edit">✏️</button>
                      <button onClick={() => setCategoryToDelete(cat)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="Delete">🗑️</button>
                    </div>
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