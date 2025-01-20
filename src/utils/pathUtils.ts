import { DFAState, PathData } from '@/types/dfa';

export const generatePath = (start: DFAState, end: DFAState): PathData => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // For self-loops
  if (start.id === end.id) {
    const radius = 30;
    const centerX = start.x;
    const centerY = start.y - radius;
    
    return {
      path: `M ${start.x} ${start.y - 20} 
             C ${start.x - radius} ${start.y - radius},
               ${start.x + radius} ${start.y - radius},
               ${start.x} ${start.y - 20}`,
      labelX: centerX,
      labelY: centerY - 10
    };
  }
  
  const normalX = -dy / distance;
  const normalY = dx / distance;
  
  const controlPointOffset = Math.min(distance * 0.3, 50);
  
  const nodeRadius = 20;
  const startRatio = nodeRadius / distance;
  const endRatio = (distance - nodeRadius) / distance;
  
  const startX = start.x + dx * startRatio;
  const startY = start.y + dy * startRatio;
  const endX = start.x + dx * endRatio;
  const endY = start.y + dy * endRatio;
  
  const controlX = (startX + endX) / 2 + normalX * controlPointOffset;
  const controlY = (startY + endY) / 2 + normalY * controlPointOffset;
  
  const labelX = (startX + endX) / 2 + normalX * controlPointOffset * 0.7;
  const labelY = (startY + endY) / 2 + normalY * controlPointOffset * 0.7;
  
  return {
    path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
    labelX,
    labelY
  };
};