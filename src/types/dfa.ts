export interface Transitions {
  [key: string]: string;
}

export type DFAState = {
  id: string;
  type: 'start' | 'transition' | 'final' | 'start+final';  // Added 'start+final' type
  transitions: Record<string, string>;
  x: number;
  y: number;
};

export interface PathData {
  path: string;
  labelX: number;
  labelY: number;
}

export interface MyhillNerodeTable {
  pairs: Record<string, Record<string, boolean>>;
  iteration: number;
  markingHistory: Array<{
    pair: [string, string];
    reason: string;
    iteration: number;
  }>;
}
