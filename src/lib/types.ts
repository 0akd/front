export interface Point { x: number; y: number; }
export interface Stroke {
  points: Point[];
  colorArgb: number;
  strokeWidth: number;
  isEraser: boolean;
  isNormalized: boolean;
}
export interface WhiteboardSlide {
  id: number;
  title: string;
  strokes: Stroke[];
}
export interface Step { id: number; text: string; position: number; }
export interface Todo {
  id: number;
  title: string;
  description: string | null;
  position: number;
  completed: boolean;
  trial_level: number;
  category_id: number | null;
  category_name: string | null;
  steps: Step[];
  target_value: number | null;
  whiteboard_json: string | null;
  lap_duration: number | null;
}
export interface Category {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  position: number;
  level: number;
  children: Category[];
}