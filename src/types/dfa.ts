export interface Transitions {
  [key: string]: string;
}

export interface DFAState {
  id: string;
  type: 'start' | 'transition' | 'final';
  transitions: Transitions;
  x: number;
  y: number;
}

export interface PathData {
  path: string;
  labelX: number;
  labelY: number;
}