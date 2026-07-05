// src/movies/components/MovieTracker.tsx
import React, { useState, useEffect } from 'react';
import MediaModal, { type MediaItem } from './MediaModal';
import { makeApiRequest } from '../lib/api';
import { 
  Film, Tv, ListVideo, PlaySquare, CheckCircle2, Clock, 
  Eye, XCircle, Plus, Edit2, Trash2, ChevronRight, Image as ImageIcon 
} from 'lucide-react';

export default function MovieTracker() {
  const [tree, setTree] = useState<MediaItem[]>([]);
  const [currentPath, setCurrentPath] = useState<MediaItem[]>([]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const loadData = async () => {
    const fetched = await makeApiRequest('', 'GET');
    if (fetched && fetched.success) {
      setTree(fetched.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
  
  const getCurrentItems = () => {
    if (currentPath.length === 0) return tree;
    const searchTree = (nodes: MediaItem[]): MediaItem | null => {
      for (const node of nodes) {
        if (node.id === currentParentId) return node;
        if (node.children) {
          const found = searchTree(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    const parentNode = searchTree(tree);
    return parentNode?.children || [];
  };

  const currentItems = getCurrentItems();

  const handleSave = async (data: Partial<MediaItem>) => {
    if (editingItem) {
      await makeApiRequest(`/${editingItem.id}`, 'PUT', data);
    } else {
      await makeApiRequest('', 'POST', data);
    }
    setShowModal(false);
    setEditingItem(null);
    loadData();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this item (and all seasons/episodes inside it)?')) return;
    
    await makeApiRequest(`/${id}`, 'DELETE');
    loadData();
  };

  const toggleStatus = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycle: Record<string, string> = {
      'planned': 'watching',
      'watching': 'watched',
      'watched': 'dropped',
      'dropped': 'planned'
    };
    const nextStatus = cycle[item.status] || 'planned';
    
    await makeApiRequest(`/${item.id}`, 'PUT', { status: nextStatus });
    loadData();
  };

  const drillDown = (item: MediaItem) => {
    if (item.type === 'movie' || item.type === 'episode') return; 
    setCurrentPath([...currentPath, item]);
  };

  const drillUp = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'watching': return <Eye size={16} className="text-blue-500" />;
      case 'watched': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'dropped': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-amber-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'series': return <Tv size={16} />;
      case 'season': return <ListVideo size={16} />;
      case 'episode': return <PlaySquare size={16} />;
      default: return <Film size={16} />;
    }
  };

  const suggestedType = currentPath.length === 0 ? 'movie' : 
                        currentPath[currentPath.length - 1].type === 'series' ? 'season' : 'episode';

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-4 lg:px-8 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <h1 className="font-extrabold text-lg md:text-xl text-gray-900 flex items-center gap-2">
          🍿 Media Tracker
        </h1>
        <button 
          onClick={() => setIsEditingMode(!isEditingMode)}
          className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
            isEditingMode 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-600 ring-offset-2' 
              : 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50'
          }`}
        >
          {isEditingMode ? 'Done Editing' : '✏️ Edit Mode'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 bg-white p-3 rounded-xl shadow-sm border border-gray-200/60 overflow-x-auto scrollbar-hide">
          <span 
            className={`cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${currentPath.length === 0 ? 'text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg' : 'hover:text-purple-600 px-3 py-1.5'}`} 
            onClick={() => setCurrentPath([])}
          >
            <Film size={14}/> Library
          </span>
          {currentPath.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={14} className="text-gray-300 shrink-0" />
              <span 
                className={`cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${index === currentPath.length - 1 ? 'text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg' : 'hover:text-purple-600 px-3 py-1.5'}`} 
                onClick={() => drillUp(index)}
              >
                {getTypeIcon(crumb.type)} {crumb.title}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Media Grid */}
        {currentItems.length === 0 ? (
          <div className="text-center p-12 sm:p-20 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
            <div className="text-5xl sm:text-6xl mb-4 opacity-50">📭</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Nothing here yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mt-2 font-medium">Click the + button to add media.</p>
          </div>
        ) : (
          /* THE BULLETPROOF GRID CSS */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {currentItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => (item.type !== 'movie' && item.type !== 'episode') ? drillDown(item) : undefined}
                className={`group flex flex-col bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-purple-300/50 hover:-translate-y-1 ${(item.type !== 'movie' && item.type !== 'episode') ? 'cursor-pointer' : ''}`}
              >
                
                {/* Poster Image Area */}
                <div 
                  className="relative w-full bg-gray-100 overflow-hidden shrink-0 border-b border-gray-100"
                  style={{ aspectRatio: '2/3' }}
                >
                  {item.image_base64 ? (
                    <img 
                      src={item.image_base64} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/80">
                      <ImageIcon size={24} className="mb-2 opacity-50" />
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">No Cover</span>
                    </div>
                  )}

                  {/* Status Overlay Badge */}
                  <button 
                    onClick={(e) => toggleStatus(item, e)}
                    className="absolute top-2 right-2 p-1.5 bg-white/95 backdrop-blur-md shadow-sm rounded-lg hover:scale-110 transition-transform z-10 border border-gray-100"
                    title={`Current Status: ${item.status}`}
                  >
                    {getStatusIcon(item.status)}
                  </button>
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 z-10">
                    {getTypeIcon(item.type)} {item.type}
                  </div>

                  {/* Edit Mode Overlays */}
                  {isEditingMode && (
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingItem(item); setShowModal(true); }}
                        className="p-2 sm:p-3 bg-white text-blue-600 rounded-full hover:scale-110 shadow-xl transition-transform"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-2 sm:p-3 bg-red-500 text-white rounded-full hover:scale-110 shadow-xl transition-transform"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors" title={item.title}>
                    {item.title}
                  </h3>
                  
                  {/* Children count indicator */}
                  <div className="mt-auto pt-2">
                    {item.children && item.children.length > 0 ? (
                      <p className="text-[10px] sm:text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                        <ListVideo size={10} className="text-purple-400"/>
                        {item.children.length} {item.children[0].type}s
                      </p>
                    ) : (
                      <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Empty</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {isEditingMode && (
        <button 
          onClick={() => { setEditingItem(null); setShowModal(true); }}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 w-14 h-14 sm:w-16 sm:h-16 bg-purple-600 text-white rounded-full shadow-xl shadow-purple-500/40 hover:bg-purple-700 hover:scale-110 transition-all duration-300 flex items-center justify-center cursor-pointer"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Media Modal */}
      {showModal && (
        <MediaModal 
          initialData={editingItem}
          parentId={currentParentId}
          suggestedType={suggestedType as any}
          onDismiss={() => { setShowModal(false); setEditingItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}