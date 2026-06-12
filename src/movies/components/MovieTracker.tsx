// src/movies/components/MovieTracker.tsx
import React, { useState, useEffect } from 'react';
import MediaModal, { type MediaItem } from './MediaModal';
import { 
  Film, Tv, ListVideo, PlaySquare, CheckCircle2, Clock, 
  Eye, XCircle, Plus, Edit2, Trash2, ArrowLeft, ChevronRight 
} from 'lucide-react';

const API_BASE = import.meta.env?.PUBLIC_API_URL || 'http://localhost:8787';

export default function MovieTracker() {
  const [tree, setTree] = useState<MediaItem[]>([]);
  const [currentPath, setCurrentPath] = useState<MediaItem[]>([]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/movies`);
      const json = await res.json();
      if (json.success) {
        setTree(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch media', err);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // Determine current items to show based on drill-down path
  const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
  
  const getCurrentItems = () => {
    if (currentPath.length === 0) return tree;
    // Find the latest reference to the parent from the freshly fetched tree
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
    try {
      if (editingItem) {
        await fetch(`${API_BASE}/api/movies/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        await fetch(`${API_BASE}/api/movies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      setShowModal(false);
      setEditingItem(null);
      fetchMedia();
    } catch (err) {
      alert('Failed to save media.');
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this item (and all seasons/episodes inside it)?')) return;
    try {
      await fetch(`${API_BASE}/api/movies/${id}`, { method: 'DELETE' });
      fetchMedia();
    } catch (err) {
      alert('Failed to delete.');
    }
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
    try {
      await fetch(`${API_BASE}/api/movies/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchMedia();
    } catch (err) {}
  };

  const drillDown = (item: MediaItem) => {
    if (item.type === 'movie') return; // Movies don't have children
    setCurrentPath([...currentPath, item]);
  };

  const drillUp = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'watching': return <Eye size={18} className="text-blue-500" />;
      case 'watched': return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'dropped': return <XCircle size={18} className="text-red-500" />;
      default: return <Clock size={18} className="text-amber-500" />;
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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-30">
        <h1 className="font-bold text-xl text-gray-800 flex items-center gap-2">
          🍿 Media Tracker
        </h1>
        <button 
          onClick={() => setIsEditingMode(!isEditingMode)}
          className={`px-5 py-2 rounded-full font-bold transition-all ${isEditingMode ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-purple-600 border-2 border-purple-600 hover:bg-purple-50'}`}
        >
          {isEditingMode ? 'Done Editing' : '✏️ Edit Mode'}
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-4 mt-4 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          <span 
            className={`cursor-pointer transition-colors flex items-center gap-1 ${currentPath.length === 0 ? 'text-purple-600' : 'hover:text-purple-600'}`} 
            onClick={() => setCurrentPath([])}
          >
            <Film size={16}/> Library
          </span>
          {currentPath.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
              <span 
                className={`cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap ${index === currentPath.length - 1 ? 'text-purple-600' : 'hover:text-purple-600'}`} 
                onClick={() => drillUp(index)}
              >
                {getTypeIcon(crumb.type)} {crumb.title}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Media Grid */}
        {currentItems.length === 0 ? (
          <div className="text-center p-16 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <p className="text-xl font-bold text-gray-500">Nothing here yet.</p>
            <p className="text-gray-400 mt-2">Click the floating + button to add media.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {currentItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => item.type !== 'movie' ? drillDown(item) : undefined}
                className={`group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${item.type !== 'movie' ? 'cursor-pointer' : ''}`}
              >
                
                {/* Poster Image Area */}
                <div className="aspect-[2/3] bg-gray-100 relative">
                  {item.image_base64 ? (
                    <img src={item.image_base64} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                      {getTypeIcon(item.type)}
                      <span className="text-xs font-bold uppercase tracking-widest mt-2">{item.type}</span>
                    </div>
                  )}

                  {/* Status Overlay Badge */}
                  <button 
                    onClick={(e) => toggleStatus(item, e)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur shadow-sm rounded-lg hover:scale-110 transition-transform"
                    title={`Current Status: ${item.status}`}
                  >
                    {getStatusIcon(item.status)}
                  </button>
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1">
                    {getTypeIcon(item.type)}
                  </div>
                </div>

                {/* Details Area */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 line-clamp-1 group-hover:text-purple-600 transition-colors" title={item.title}>
                    {item.title}
                  </h3>
                  
                  {/* Children count indicator */}
                  {item.children && item.children.length > 0 && (
                     <p className="text-xs text-gray-500 font-medium mt-1">
                        Contains {item.children.length} {item.children[0].type}s
                     </p>
                  )}
                </div>

                {/* Edit Mode Overlays */}
                {isEditingMode && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingItem(item); setShowModal(true); }}
                      className="p-3 bg-white text-blue-600 rounded-xl hover:scale-110 shadow-lg transition-transform"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 shadow-lg transition-transform"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {isEditingMode && (
        <button 
          onClick={() => { setEditingItem(null); setShowModal(true); }}
          className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-purple-600 text-white rounded-2xl shadow-2xl hover:bg-purple-700 hover:scale-105 transition-all flex items-center justify-center"
        >
          <Plus size={32} />
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