import React, { useRef, useState, useEffect } from 'react';
import type { Todo, WhiteboardSlide, Stroke, Point } from '../lib/types';
import { Eraser, Pen, Save, Trash2, X, Undo, Redo } from 'lucide-react';

interface Props {
  todo: Todo;
  onDismiss: () => void;
  onSave: (json: string) => void;
}

export default function Whiteboard({ todo, onDismiss, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  
  const initialData = todo.whiteboard_json ? JSON.parse(todo.whiteboard_json) : { slides: [{ id: 1, title: 'Slide 1', strokes: [] }] };
  
  // History State for Undo/Redo
  const [slides, setSlides] = useState<WhiteboardSlide[]>(initialData.slides || initialData);
  const [history, setHistory] = useState<WhiteboardSlide[][]>([initialData.slides || initialData]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  const updateSlidesAndHistory = (newSlides: WhiteboardSlide[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newSlides];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSlides(newSlides);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setSlides(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setSlides(history[historyIndex + 1]);
    }
  };

  // Re-draw all saved strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const strokes = slides[activeSlide]?.strokes || [];
    
    strokes.forEach(stroke => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? '#ffffff' : '#000000';
      ctx.lineWidth = stroke.isEraser ? 32 : 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      stroke.points.forEach((p, i) => {
        const x = stroke.isNormalized ? p.x * canvas.width : p.x;
        const y = stroke.isNormalized ? p.y * canvas.height : p.y;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [slides, activeSlide]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    setCurrentStroke([{ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const newPoint = { x, y };

    // REAL-TIME INK: Draw directly to canvas context instantly
    const ctx = canvasRef.current!.getContext('2d');
    if (ctx && currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1];
      ctx.beginPath();
      ctx.strokeStyle = isErasing ? '#ffffff' : '#000000';
      ctx.lineWidth = isErasing ? 32 : 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(lastPoint.x * canvasRef.current!.width, lastPoint.y * canvasRef.current!.height);
      ctx.lineTo(x * canvasRef.current!.width, y * canvasRef.current!.height);
      ctx.stroke();
    }

    setCurrentStroke(prev => [...prev, newPoint]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.length > 1) {
      const newStroke: Stroke = {
        points: currentStroke,
        colorArgb: 0,
        strokeWidth: isErasing ? 32 : 4,
        isEraser: isErasing,
        isNormalized: true
      };

      const updatedSlides = [...slides];
      updatedSlides[activeSlide] = {
        ...updatedSlides[activeSlide],
        strokes: [...updatedSlides[activeSlide].strokes, newStroke]
      };
      
      updateSlidesAndHistory(updatedSlides);
    }
    setCurrentStroke([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/90 flex flex-col items-center justify-center p-4">
      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 bg-white/10 backdrop-blur p-4 rounded-2xl flex justify-between items-center z-10 max-w-md mx-auto border border-white/20 overflow-x-auto">
        
        <div className="flex gap-2 bg-white/20 p-1 rounded-xl">
          <button onClick={() => setIsErasing(false)} className={`p-2 rounded-lg text-white ${!isErasing ? 'bg-white/30 shadow' : ''}`}><Pen size={20}/></button>
          <button onClick={() => setIsErasing(true)} className={`p-2 rounded-lg text-white ${isErasing ? 'bg-white/30 shadow' : ''}`}><Eraser size={20}/></button>
        </div>

        <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
          <button onClick={undo} disabled={historyIndex === 0} className={`p-2 rounded-lg text-white ${historyIndex === 0 ? 'opacity-30' : 'hover:bg-white/20'}`}><Undo size={20}/></button>
          <button onClick={redo} disabled={historyIndex === history.length - 1} className={`p-2 rounded-lg text-white ${historyIndex === history.length - 1 ? 'opacity-30' : 'hover:bg-white/20'}`}><Redo size={20}/></button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => {
            const updated = [...slides];
            updated[activeSlide].strokes = [];
            updateSlidesAndHistory(updated);
          }} className="p-2 text-red-400 hover:bg-white/10 rounded-full"><Trash2 size={24}/></button>
          <button onClick={() => onSave(JSON.stringify({ version: 2, slides }))} className="p-2 text-emerald-400 hover:bg-white/10 rounded-full"><Save size={24}/></button>
          <button onClick={onDismiss} className="p-2 text-gray-300 hover:bg-white/10 rounded-full"><X size={24}/></button>
        </div>
      </div>
      
      {/* Canvas confined to Vivo Y200 5G Dimensions (1080x2400) */}
      <div className="relative bg-white shadow-2xl overflow-hidden rounded-3xl" style={{ aspectRatio: '1080 / 2400', height: '100%', maxHeight: '90vh' }}>
        <canvas
          ref={canvasRef}
          width={1080}
          height={2400}
          className="w-full h-full object-contain cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOut={handlePointerUp}
        />
      </div>
    </div>
  );
}