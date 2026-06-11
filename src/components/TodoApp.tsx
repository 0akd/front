import React, { useState, useEffect } from 'react';
import type { Todo, Category } from '../lib/types';
import { makeApiRequest } from '../lib/api';
import TabletModal from './TabletModal';
import Whiteboard from './Whiteboard';
import EditTodoModal from './EditTodoModal';
import { CheckCircle2, Circle, Edit2, Palette, Trash2, Plus, Folder, AlertCircle } from 'lucide-react';

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<number | null>(null);
  
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [hasError, setHasError] = useState(false);

  // Modals
  const [activeTabletTodo, setActiveTabletTodo] = useState<Todo | null>(null);
  const [todoForWhiteboard, setTodoForWhiteboard] = useState<Todo | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const loadData = async () => {
    setHasError(false);
    
    // Explicitly pass empty string to match Android behavior
    const fetchedTodos = await makeApiRequest('', 'GET'); 
    const fetchedCategories = await makeApiRequest('/categories', 'GET');
    
    if (fetchedTodos && Array.isArray(fetchedTodos)) {
      setTodos(fetchedTodos);
    } else {
      setHasError(true);
    }

    if (fetchedCategories?.data) {
      setCategories(fetchedCategories.data);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    await makeApiRequest('', 'POST', { 
      title: newTaskTitle.trim(), 
      category_id: currentCategory 
    });
    setNewTaskTitle('');
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

  const displayTodos = currentCategory === null 
    ? todos 
    : todos.filter(t => t.category_id === currentCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-30">
        <h1 className="font-bold text-xl text-gray-800">My Tasks</h1>
        <button 
          onClick={() => setIsEditingMode(!isEditingMode)}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${isEditingMode ? 'bg-purple-600 text-white' : 'text-purple-600 border border-purple-600 hover:bg-purple-50'}`}
        >
          {isEditingMode ? 'Done Editing' : '✏️ Edit Mode'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 mt-4 space-y-6">
        
        {/* Category Selector */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setCurrentCategory(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${currentCategory === null ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              All Tasks
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setCurrentCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-2 ${currentCategory === cat.id ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <Folder size={14} /> {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Quick Add Form */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input 
            type="text" 
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-5 py-4 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-lg"
          />
          <button type="submit" disabled={!newTaskTitle.trim()} className="bg-purple-600 text-white px-6 rounded-2xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            <Plus size={20}/> Add
          </button>
        </form>

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
            <p className="text-sm mt-1">Add a new task above to get started.</p>
          </div>
        )}

        {/* Task List */}
        {!hasError && (
          <div className="space-y-3">
            {displayTodos.map(todo => (
              <div key={todo.id} className={`p-4 sm:p-5 rounded-2xl border ${todo.completed ? 'bg-gray-100 border-transparent' : 'bg-white border-purple-200'} shadow-sm transition-all flex items-center gap-4`}>
                
                <div className="cursor-pointer" onClick={() => updateTodo(todo.id, { completed: !todo.completed })}>
                  {todo.completed ? <CheckCircle2 className="text-emerald-500" size={28} /> : <Circle className="text-gray-300 hover:text-purple-400 transition-colors" size={28} />}
                </div>
                
                <div 
                  className="flex-1 cursor-pointer min-w-0" 
                  onClick={() => !isEditingMode && setActiveTabletTodo(todo)}
                >
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

                {/* Tools Area */}
                {isEditingMode ? (
                  <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                    <button onClick={() => setEditingTodo(todo)} className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteTodo(todo.id)} className="p-2 sm:p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                      <Trash2 size={18} />
                    </button>
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
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {editingTodo && (
        <EditTodoModal 
          todo={editingTodo}
          categories={categories}
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