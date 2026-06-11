import React, { useState, useEffect, useRef } from 'react';
import type { Todo } from './types';
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
            <div className="text-center px-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider">{isTimerMode ? 'Laps' : 'Count'}</div>
              <div className="font-bold text-purple-600">
                {todo.trial_level} {todo.target_value ? `/ ${todo.target_value}` : ''}
              </div>
            </div>
            <button onClick={onDismiss} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-12 text-3xl font-light text-center cursor-pointer" onClick={() => setCurrentStepIndex(prev => prev + 1)}>
          {currentStepIndex === 0 ? todo.title : 
           currentStepIndex === 1 ? (todo.description || "No description provided.") : 
           todo.steps[currentStepIndex - 2]?.text}
        </div>

        <div className="bg-gray-50 p-4 flex justify-between items-center border-t">
          <button onClick={onDecrement} className="px-6 py-2 bg-gray-200 rounded-full hover:bg-gray-300">-</button>
          <button onClick={onIncrement} className="px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600">+</button>
        </div>
      </div>
    </div>
  );
}