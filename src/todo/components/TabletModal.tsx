import React, { useState, useEffect, useRef } from 'react';
import type { Todo } from '../lib/types';
import { Play, Pause, X } from 'lucide-react';

interface Props {
  todo: Todo;
  onDismiss: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function TabletModal({ todo, onDismiss, onIncrement, onDecrement }: Props) {
  const isTimerMode = todo.lap_duration != null && todo.lap_duration > 0;
  const totalSeconds = todo.lap_duration || 60;
  
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/tick.mp3');
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      audioRef.current?.play().catch(e => console.log("Audio play blocked by browser:", e));
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Reached zero: pause, increment lap count, reset clock.
            setIsRunning(false);
            onIncrement();
            return totalSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      audioRef.current?.pause();
    }
    return () => clearInterval(interval);
  }, [isRunning, totalSeconds, onIncrement]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  const totalPages = 2 + (todo.steps?.length || 0);

  const handleStepClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 2) {
      if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
    } else {
      if (currentStepIndex < totalPages - 1) setCurrentStepIndex(prev => prev + 1);
    }
  };

  let contentText = "";
  if (currentStepIndex === 0) contentText = todo.title;
  else if (currentStepIndex === 1) contentText = (todo.description && todo.description.trim() !== "") ? todo.description : "No description provided.";
  else contentText = todo.steps?.[currentStepIndex - 2]?.text || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold truncate flex-1">{todo.title}</h2>
          
          <div className="flex items-center gap-4">
            {isTimerMode && (
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full hover:bg-purple-200"
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                <span className="font-bold text-purple-600 font-mono">{mins}:{secs}</span>
              </button>
            )}

            <div className="flex items-center bg-gray-100 rounded-full p-1 gap-2">
              <button onClick={onDecrement} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 hover:bg-gray-200 font-bold shadow-sm transition-colors">-</button>
              <div className="text-center px-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{isTimerMode ? 'Laps' : 'Count'}</div>
                <div className="font-bold text-purple-600 text-sm">
                  {todo.trial_level} {todo.target_value ? `/ ${todo.target_value}` : ''}
                </div>
              </div>
              <button onClick={onIncrement} className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-500 text-white hover:bg-purple-600 font-bold shadow-sm transition-colors">+</button>
            </div>

            <button onClick={onDismiss} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        <div 
          className="flex-1 flex items-center justify-center p-12 text-3xl font-light text-center cursor-pointer select-none" 
          onClick={handleStepClick}
        >
          {contentText}
        </div>

        <div className="bg-gray-50 p-4 flex justify-between items-center border-t rounded-b-3xl">
          <button 
            onClick={() => { if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1); }}
            disabled={currentStepIndex === 0}
            className={`px-4 py-2 font-medium ${currentStepIndex > 0 ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-300 cursor-not-allowed'} rounded-lg transition-colors`}
          >
            ← Prev
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div 
                key={i} 
                onClick={() => setCurrentStepIndex(i)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-colors ${i === currentStepIndex ? 'bg-purple-500 w-3 h-3' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          <button 
            onClick={() => { if (currentStepIndex < totalPages - 1) setCurrentStepIndex(prev => prev + 1); }}
            disabled={currentStepIndex >= totalPages - 1}
            className={`px-4 py-2 font-medium ${currentStepIndex < totalPages - 1 ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-300 cursor-not-allowed'} rounded-lg transition-colors`}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}