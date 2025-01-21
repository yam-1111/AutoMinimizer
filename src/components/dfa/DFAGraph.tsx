import React from 'react';
import { DFAState } from '@/types/dfa';
import { generatePath } from '@/utils/pathUtils';

interface DFAGraphProps {
  states: DFAState[];
  svgRef: React.RefObject<SVGSVGElement>;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseDown: (event: React.MouseEvent, stateId: string) => void;
}

export const DFAGraph: React.FC<DFAGraphProps> = ({
  states,
  svgRef,
  onMouseMove,
  onMouseUp,
  onMouseDown,
}) => {
  // Group transitions by source and target
  const groupedTransitions = states.reduce((acc, sourceNode) => {
    Object.entries(sourceNode.transitions).forEach(([symbol, targetId]) => {
      if (targetId === 'none') return;
      
      const key = `${sourceNode.id}-${targetId}`;
      if (!acc[key]) {
        acc[key] = { symbols: [], source: sourceNode, target: targetId };
      }
      acc[key].symbols.push(symbol);
    });
    return acc;
  }, {} as Record<string, { symbols: string[], source: DFAState, target: string }>);

  const isStartState = (type: string) => type === 'start' || type === 'start+final';
  const isFinalState = (type: string) => type === 'final' || type === 'start+final';

  return (
    <svg 
      ref={svgRef}
      className="w-full h-full"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Draw transitions */}
      {Object.entries(groupedTransitions).map(([key, { symbols, source, target }]) => {
        const targetNode = states.find(n => n.id === target);
        if (!targetNode) return null;
        
        const { path, labelX, labelY } = generatePath(source, targetNode);
        
        return (
          <g key={key}>
            <path
              d={path}
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1.5"
              className="transition-all duration-200"
              markerEnd="url(#arrowhead)"
            />
            <text 
              x={labelX} 
              y={labelY} 
              textAnchor="middle" 
              dy=".3em"
              className="text-sm fill-muted-foreground"
            >
              {symbols.join(',')}
            </text>
          </g>
        );
      })}
      
      {/* Draw nodes */}
      {states.map((node) => (
        <g 
          key={node.id}
          onMouseDown={(e) => onMouseDown(e, node.id)}
          className="transition-transform duration-200 cursor-move"
        >
          {/* Start state arrow */}
          {isStartState(node.type) && (
            <path
              d={`M ${node.x - 40} ${node.y} L ${node.x - 20} ${node.y}`}
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />
          )}
          
          {/* Main circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r="20"
            className={`
              fill-background stroke-2
              ${isStartState(node.type) ? 'stroke-dfa-start' : 
                isFinalState(node.type) ? 'stroke-dfa-final' : 'stroke-dfa-transition'}
            `}
          />
          
          {/* Final state double circle */}
          {isFinalState(node.type) && (
            <circle
              cx={node.x}
              cy={node.y}
              r="24"
              className="fill-none stroke-dfa-final stroke-2"
            />
          )}
          
          {/* State label */}
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dy=".3em"
            className="select-none fill-foreground text-sm font-medium"
          >
            {node.id}
          </text>
        </g>
      ))}
      
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" className="fill-muted-foreground" />
        </marker>
      </defs>
    </svg>
  );
};