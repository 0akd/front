import React, { useRef, useState, useEffect } from 'react';
import type { Todo, WhiteboardSlide, Stroke, Point } from './types';
import { Eraser, Pen, Save, Trash2, X } from 'lucide-react';

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
  const [slides, setSlides] = useState<WhiteboardSlide[]>(initialData.slides || initialData);
  const [activeSlide, setActiveSlide] = useState(0);

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
    setCurrentStroke(prev => [...prev, { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }]);
  };

  const handlePointerUp = () => {
    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false);
      return;
    }
    
    const newStroke: Stroke = {
      points: currentStroke,
      colorArgb: 0,
      strokeWidth: isErasing ? 32 : 4,
      isEraser: isErasing,
      isNormalized: true
    };

    setSlides(prev => {
      const updated = [...prev];
      updated[activeSlide].strokes.push(newStroke);
      return updated;
    });
    
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
      <div className="bg-white p-4 shadow flex justify-between items-center z-10">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setIsErasing(false)} className={`p-2 rounded ${!isErasing ? 'bg-white shadow' : ''}`}><Pen size={20}/></button>
          <button onClick={() => setIsErasing(true)} className={`p-2 rounded ${isErasing ? 'bg-white shadow' : ''}`}><Eraser size={20}/></button>
        </div>
        <div className="flex gap-4">
          <button onClick={() => {
            const updated = [...slides];
            updated[activeSlide].strokes = [];
            setSlides(updated);
          }} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={24}/></button>
          <button onClick={() => onSave(JSON.stringify({ version: 2, slides }))} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full"><Save size={24}/></button>
          <button onClick={onDismiss} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="w-full h-full object-contain cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
      />
    </div>
  );
}