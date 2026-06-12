import React, { useState, useEffect } from 'react';
import type { Todo, Category } from '../lib/types';
import { makeApiRequest } from '../lib/api';
import TabletModal from './TabletModal';
import Whiteboard from '../Whiteboard';
import EditTodoModal from './EditTodoModal';
import AddTodoModal from './AddTodoModal';
import CategoryManagerModal from './CategoryManagerModal';
import { Edit2, Palette, Trash2, Folder, AlertCircle, Plus, Clipboard as ClipboardIcon, Scissors } from 'lucide-react';

type ClipboardType = 'TODO' | 'CATEGORY';
interface ClipboardItem {
  id: number;
  type: ClipboardType;
  isCut: boolean;
}

function flattenCategories(categories: Category[]): Category[] {
  const flat: Category[] = [];
  const traverse = (cats: Category[], level: number = 0) => {
    for (const cat of cats) {
      flat.push({ ...cat, level });
      if (cat.children) traverse(cat.children, level + 1);
    }
  };
  traverse(categories);
  return flat;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);

  // Modals
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [activeTabletTodo, setActiveTabletTodo] = useState<Todo | null>(null);
  const [todoForWhiteboard, setTodoForWhiteboard] = useState<Todo | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [targetAddPosition, setTargetAddPosition] = useState(0);

  const loadData = async () => {
    setHasError(false);
    const fetchedTodos = await makeApiRequest('', 'GET'); 
    const fetchedCategories = await makeApiRequest('/categories', 'GET');
    
    if (fetchedTodos && Array.isArray(fetchedTodos)) {
      setTodos(fetchedTodos);
    } else {
      setHasError(true);
    }

    if (fetchedCategories?.data) {
      setCategories(fetchedCategories.data);
      if (currentCategory) {
        const flat = flattenCategories(fetchedCategories.data);
        setCurrentCategory(flat.find(c => c.id === currentCategory.id) || null);
      }
    }
  };

  useEffect(() => { loadData(); }, []);

  const addTodo = async (title: string, position: number, categoryId: number | null, targetValue: number | null, lapDuration: number | null) => {
    await makeApiRequest('', 'POST', { 
      title, 
      position, 
      category_id: categoryId,
      target_value: targetValue,
      lap_duration: lapDuration
    });
    loadData();
  };

  const updateTodo = async (id: number, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await makeApiRequest(`/${id}`, 'PUT', updates);
    loadData(); 
  };

  const deleteTodo = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this task?")) return;
    await makeApiRequest(`/${id}`, 'DELETE');
    loadData();
  };

  // Category API for Manager
  const createCategory = async (name: string, description: string | null, parentId: number | null) => {
    await makeApiRequest('/categories', 'POST', { name, description, parent_id: parentId });
    loadData();
  };

  const updateCategory = async (id: number, updates: Partial<Category>) => {
    await makeApiRequest(`/categories/${id}`, 'PUT', updates);
    loadData();
  };

  const deleteCategory = async (id: number) => {
    await makeApiRequest(`/categories/${id}?cascade=true`, 'DELETE');
    if (currentCategory?.id === id) {
      const flat = flattenCategories(categories);
      setCurrentCategory(flat.find(c => c.id === currentCategory.parent_id) || null);
    }
    loadData();
  };

  // Copy/Move API
  const copyTodo = async (id: number, newCategoryId: number | null) => {
    await makeApiRequest(`/${id}/copy`, 'POST', { category_id: newCategoryId });
    loadData();
  };

  const copyCategory = async (id: number, newParentId: number | null) => {
    await makeApiRequest(`/categories/${id}/copy`, 'POST', { parent_id: newParentId });
    loadData();
  };

  const handlePaste = async () => {
    if (!clipboard) return;
    const targetId = currentCategory?.id || null;

    if (clipboard.type === 'TODO') {
      if (clipboard.isCut) await updateTodo(clipboard.id, { category_id: targetId });
      else await copyTodo(clipboard.id, targetId);
    } else {
      if (clipboard.isCut) await updateCategory(clipboard.id, { parent_id: targetId } as any);
      else await copyCategory(clipboard.id, targetId);
    }
    setClipboard(null);
  };

  const displayCategories = currentCategory ? currentCategory.children : categories;
  const displayTodos = todos
    .filter(t => t.category_id === (currentCategory?.id || null))
    .sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen bg-gray-50 pb-32 relative">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-30">
        <h1 className="font-bold text-xl text-gray-800">My Tasks</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryManager(true)} className="px-4 py-2 rounded-full font-medium transition-colors text-purple-600 border border-purple-600 hover:bg-purple-50">
            📁 Manage
          </button>
          <button 
            onClick={() => setIsEditingMode(!isEditingMode)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${isEditingMode ? 'bg-purple-600 text-white' : 'text-purple-600 border border-purple-600 hover:bg-purple-50'}`}
          >
            {isEditingMode ? 'Done Editing' : '✏️ Edit Mode'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 mt-4 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          <span className={`cursor-pointer hover:text-purple-600 whitespace-nowrap ${!currentCategory ? 'text-purple-600 font-bold' : ''}`} onClick={() => setCurrentCategory(null)}>🏠 Home</span>
          {(() => {
            const crumbs: Category[] = [];
            let curr = currentCategory;
            const flatCats = flattenCategories(categories);
            while (curr) {
              crumbs.unshift(curr);
              curr = flatCats.find(c => c.id === curr!.parent_id) || null;
            }
            return crumbs.map((crumb) => (
              <React.Fragment key={crumb.id}>
                <span className="text-gray-400">›</span>
                <span 
                  className={`cursor-pointer hover:text-purple-600 whitespace-nowrap ${crumb.id === currentCategory?.id ? 'text-purple-600 font-bold' : ''}`} 
                  onClick={() => setCurrentCategory(crumb)}
                >
                  {crumb.name}
                </span>
              </React.Fragment>
            ));
          })()}
        </div>

        {/* Folder Ribbon */}
        {displayCategories && displayCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {displayCategories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setCurrentCategory(cat)}
                className="px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-purple-50"
              >
                <Folder size={14} className="text-purple-500" /> {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* API Error State */}
        {hasError && (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-3xl text-red-600">
            <AlertCircle size={48} className="mb-4" />
            <h3 className="font-bold text-lg">Connection Error</h3>
            <p className="text-sm opacity-80">Could not connect to the database. Check console for details.</p>
          </div>
        )}

        {/* Empty State */}
        {!hasError && displayTodos.length === 0 && (
          <div className="text-center p-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg font-medium">No tasks here.</p>
            {isEditingMode && <p className="text-sm mt-1">Click the + button to add a task.</p>}
          </div>
        )}

        {/* Task List */}
        {!hasError && (
          <div className="space-y-3">
            {displayTodos.map((todo, index) => {
              const canMoveUp = index > 0;
              const canMoveDown = index < displayTodos.length - 1;
              const targetFraction = todo.target_value && todo.target_value > 0
                ? Math.min(todo.trial_level / todo.target_value, 1)
                : (todo.completed ? 1 : 0);

              return (
                <div 
                  key={todo.id} 
                  className={`relative p-4 sm:p-5 rounded-2xl border ${todo.completed ? 'bg-gray-100 border-transparent' : 'bg-white border-purple-200'} shadow-sm transition-all overflow-hidden cursor-pointer select-none`}
                  onClick={(e) => {
                    if (isEditingMode) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    
                    if (x < rect.width * 0.3) {
                      if (todo.trial_level > 0) {
                        const newLevel = todo.trial_level - 1;
                        const isCompleted = todo.target_value ? newLevel >= todo.target_value : false;
                        updateTodo(todo.id, { trial_level: newLevel, completed: isCompleted });
                      }
                    } else if (x > rect.width * 0.7) {
                      const newLevel = todo.trial_level + 1;
                      const isCompleted = todo.target_value ? newLevel >= todo.target_value : false;
                      updateTodo(todo.id, { trial_level: newLevel, completed: isCompleted });
                    } else {
                      setActiveTabletTodo(todo);
                    }
                  }}
                >
                  {/* Progress Fill Background */}
                  {targetFraction > 0 && (
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-300 ${todo.completed ? 'bg-emerald-500/20' : 'bg-purple-500/20'}`}
                      style={{ width: `${targetFraction * 100}%`, zIndex: 0 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-4 w-full">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-medium truncate ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {todo.title}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <div className="text-[10px] sm:text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">
                          #{todo.position} {todo.lap_duration ? `• ⏱️ ${todo.lap_duration}s` : ''}
                        </div>
                        {todo.category_name && (
                          <div className="text-[10px] sm:text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded truncate max-w-[100px]">
                            {todo.category_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditingMode ? (
                      <div className="flex bg-white/80 backdrop-blur rounded-xl p-1 gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setClipboard({ id: todo.id, type: 'TODO', isCut: true }); }} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Cut"><Scissors size={18}/></button>
                        <button onClick={(e) => { e.stopPropagation(); setClipboard({ id: todo.id, type: 'TODO', isCut: false }); }} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Copy"><ClipboardIcon size={18}/></button>
                        <button disabled={!canMoveUp} onClick={(e) => { e.stopPropagation(); updateTodo(todo.id, { position: displayTodos[index - 1].position }); }} className={`p-2 rounded-lg transition-colors ${canMoveUp ? 'hover:bg-gray-200' : 'opacity-30 cursor-not-allowed'}`} title="Move Up">↑</button>
                        <button disabled={!canMoveDown} onClick={(e) => { e.stopPropagation(); updateTodo(todo.id, { position: displayTodos[index + 1].position }); }} className={`p-2 rounded-lg transition-colors ${canMoveDown ? 'hover:bg-gray-200' : 'opacity-30 cursor-not-allowed'}`} title="Move Down">↓</button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingTodo(todo); }} className="p-2 hover:bg-gray-200 text-blue-600 rounded-lg transition-colors" title="Edit"><Edit2 size={18}/></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }} className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors" title="Delete"><Trash2 size={18}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 sm:gap-6">
                        <button onClick={(e) => { e.stopPropagation(); setTodoForWhiteboard(todo); }} className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors hidden sm:block">
                          <Palette size={20} />
                        </button>
                        <div className="text-center min-w-[3rem]">
                          <div className="text-[9px] sm:text-[10px] text-gray-400 font-bold tracking-wider">{todo.lap_duration ? 'LAPS' : 'COUNT'}</div>
                          <div className="text-xl sm:text-2xl font-bold text-purple-600">{todo.trial_level}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Buttons (Bottom Right) */}
      {isEditingMode && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
          
          {clipboard && (
            <button 
              onClick={handlePaste} 
              className="flex items-center gap-3 px-6 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:bg-emerald-600 transition-transform hover:scale-105"
            >
              <ClipboardIcon size={24} />
              <span>{clipboard.isCut ? 'Move Here' : 'Paste Here'}</span>
            </button>
          )}

          <button 
            onClick={() => {
              const targetPos = displayTodos.length > 0 ? displayTodos[displayTodos.length - 1].position + 1 : 0;
              setTargetAddPosition(targetPos);
              setShowAddDialog(true);
            }} 
            className="flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-2xl shadow-xl hover:bg-purple-700 transition-transform hover:scale-105"
          >
            <Plus size={32} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showCategoryManager && (
        <CategoryManagerModal
          isEditingMode={isEditingMode}
          categories={categories}
          clipboard={clipboard}
          setClipboard={setClipboard}
          onDismiss={() => setShowCategoryManager(false)}
          onSelectCategory={(cat) => { setCurrentCategory(cat); setShowCategoryManager(false); }}
          onCreateCategory={createCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
        />
      )}

      {showAddDialog && (
        <AddTodoModal
          initialPosition={targetAddPosition}
          initialCategoryId={currentCategory?.id || null}
          categories={flattenCategories(categories)}
          onDismiss={() => setShowAddDialog(false)}
          onSave={(title, position, catId, targetVal, lapDur) => {
            addTodo(title, position, catId, targetVal, lapDur);
            setShowAddDialog(false);
          }}
        />
      )}

      {editingTodo && (
        <EditTodoModal 
          todo={editingTodo}
          categories={flattenCategories(categories)}
          onDismiss={() => setEditingTodo(null)}
          onSave={(id, updates) => {
            updateTodo(id, updates);
            setEditingTodo(null);
          }}
        />
      )}

      {activeTabletTodo && (
        <TabletModal 
          todo={activeTabletTodo} 
          onDismiss={() => setActiveTabletTodo(null)}
          onIncrement={() => {
            const newLevel = activeTabletTodo.trial_level + 1;
            const isCompleted = activeTabletTodo.target_value ? newLevel >= activeTabletTodo.target_value : false;
            updateTodo(activeTabletTodo.id, { trial_level: newLevel, completed: isCompleted });
            setActiveTabletTodo({ ...activeTabletTodo, trial_level: newLevel, completed: isCompleted });
          }}
          onDecrement={() => {
            if (activeTabletTodo.trial_level > 0) {
              const newLevel = activeTabletTodo.trial_level - 1;
              const isCompleted = activeTabletTodo.target_value ? newLevel >= activeTabletTodo.target_value : false;
              updateTodo(activeTabletTodo.id, { trial_level: newLevel, completed: isCompleted });
              setActiveTabletTodo({ ...activeTabletTodo, trial_level: newLevel, completed: isCompleted });
            }
          }}
        />
      )}

      {todoForWhiteboard && (
        <Whiteboard 
          todo={todoForWhiteboard}
          onDismiss={() => setTodoForWhiteboard(null)}
          onSave={(json) => {
            updateTodo(todoForWhiteboard.id, { whiteboard_json: json });
            setTodoForWhiteboard(null);
          }}
        />
      )}
    </div>
  );
}