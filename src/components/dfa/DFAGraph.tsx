import React, { useState, useEffect, useRef } from 'react';
import { DFAState } from '@/types/dfa';
import { generatePath } from '@/utils/pathUtils';
import { Button } from '@/components/ui/button'; // Import shadcn Button
import { ZoomIn, ZoomOut } from 'lucide-react'; // Import icons for zoom controls

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
  const [scale, setScale] = useState(1); // State to manage zoom level
  const [viewBox, setViewBox] = useState({ x: -100, y: -100, width: 1200, height: 800 }); // State to manage viewBox
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container div

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

  // Function to generate self-loop path
  const generateSelfLoop = (node: DFAState, hasTopTransition: boolean) => {
    const r = 18; // Node radius
    const loopR = 12; // Loop radius
    const verticalOffset = 15; // Distance above the state circle
  
    // Calculate the center point for the loop (above the node)
    const loopCenterX = node.x;
    const loopCenterY = node.y - r - verticalOffset;
  
    // Define the circular path
    const startAngle = 0; // Start angle in degrees
    const endAngle = 165; // Full circle in degrees
  
    // Arrowhead properties
    const arrowLength = 3; // Length of the arrow lines
    const arrowAngle = 10; // Angle of the arrowhead lines in degrees
    const arrowRad = (arrowAngle * Math.PI) / 180;
  
    // Calculate the arrowhead position (at the right side of the circle)
    const arrowBaseX = loopCenterX + loopR; // X-coordinate at the rightmost point of the circle
    const arrowBaseY = loopCenterY;
  
    const arrowRightX = arrowBaseX + arrowLength * Math.cos(-arrowRad); // Top arrow line
    const arrowRightY = arrowBaseY + arrowLength * Math.sin(-arrowRad);
    const arrowLeftX = arrowBaseX + arrowLength * Math.cos(arrowRad); // Bottom arrow line
    const arrowLeftY = arrowBaseY + arrowLength * Math.sin(arrowRad);
  
    return {
      path: `M ${loopCenterX + loopR} ${loopCenterY} 
             A ${loopR} ${loopR} 0 1 1 ${loopCenterX + loopR - 0.01} ${loopCenterY} 
             M ${arrowBaseX} ${arrowBaseY}
             L ${arrowRightX} ${arrowRightY}
             M ${arrowBaseX} ${arrowBaseY}
             L ${arrowLeftX} ${arrowLeftY}`,
      labelX: loopCenterX,
      labelY: loopCenterY - loopR - 2 // Position label above the loop
    };
  };

  // Zoom in function
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale * 1.2, 3)); // Limit max zoom to 3x
  };

  // Zoom out function
  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale / 1.2, 0.5)); // Limit min zoom to 0.5x
  };

  // Update viewBox when scale changes
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const { width, height } = container.getBoundingClientRect();

      // Calculate new viewBox dimensions based on scale
      const newWidth = width / scale;
      const newHeight = height / scale;

      // Center the viewBox
      const newX = viewBox.x + (viewBox.width - newWidth) / 2;
      const newY = viewBox.y + (viewBox.height - newHeight) / 2;

      setViewBox({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }
  }, [scale]);

  return (
    <div 
      ref={containerRef}
      style={{ overflow: 'auto', width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Zoom controls - Sticky on the right side */}
      <div
        style={{
          position: 'fixed', // Make the zoom controls sticky
          top: '10%', // Center vertically
          right: 20, // Position on the right side
          transform: 'translateY(-55%)', // Center vertically
          zIndex: 1000, // Ensure it's above other elements
          display: 'flex',
          flexDirection: 'column', // Stack buttons vertically
          gap: 8, // Space between buttons
        }}
      >
        <Button
          onClick={zoomIn}
          size="lg" // Make the button large
          variant="outline" // Use outline variant for a clean look
          className="p-3" // Add padding for a larger click area
        >
          <ZoomIn className="h-6 w-6" /> {/* Add zoom-in icon */}
        </Button>
        <Button
          onClick={zoomOut}
          size="lg" // Make the button large
          variant="outline" // Use outline variant for a clean look
          className="p-3" // Add padding for a larger click area
        >
          <ZoomOut className="h-6 w-6" /> {/* Add zoom-out icon */}
        </Button>
      </div>

      <svg 
        ref={svgRef}
        className="w-full h-full origin-center"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
      >
        {/* Draw transitions */}
        {Object.entries(groupedTransitions).map(([key, { symbols, source, target }]) => {
          const targetNode = states.find(n => n.id === target);
          if (!targetNode) return null;

          // Check if this is a self-loop
          if (source.id === target) {
            // Check if there are any incoming transitions from above
            const hasTopTransition = Object.values(groupedTransitions).some(
              trans => trans.target === source.id && 
              states.find(s => s.id === trans.source.id)?.y < source.y
            );
            
            const { path, labelX, labelY } = generateSelfLoop(source, hasTopTransition);
            
            return (
              <g key={key}>
                <path
                  d={path}
                  fill="none"
                  className="stroke-foreground stroke-1.5 transition-all duration-200"
                  markerEnd="url(#arrowhead)"
                />
                <text 
                  x={labelX} 
                  y={labelY} 
                  textAnchor="middle" 
                  dy=".3em"
                  className="text-lg fill-foreground font-serif tracking-wider"
                >
                  {symbols.join(' , ')}
                </text>
              </g>
            );
          }
          
          const { path, labelX, labelY } = generatePath(source, targetNode);
          
          return (
            <g key={key}>
              <path
                d={path}
                fill="none"
                stroke="black"
                strokeWidth="1.5"
                className="stroke-foreground stroke-1.5 transition-all duration-200"
                markerEnd="url(#arrowhead)"
              />
              <text 
                x={labelX} 
                y={labelY} 
                textAnchor="middle" 
                dy=".3em"
                className="text-lg fill-foreground font-serif tracking-wider"
              >
                {symbols.join(' , ')}
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
                d={`M ${node.x - 50} ${node.y} L ${node.x - 20} ${node.y}`}
                className="stroke-foreground stroke-1.5"
                markerEnd="url(#arrowhead)"
              />
            )}
            
            {/* Main circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r="18"
              className="fill-background stroke-foreground stroke-2"
            />
            
            {/* Final state double circle */}
            {isFinalState(node.type) && (
              <circle
                cx={node.x}
                cy={node.y}
                r="22"
                className="fill-none stroke-foreground stroke-2"
              />
            )}
            
            {/* State label */}
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dy=".2em"
              className="select-none fill-foreground text-lg font-serif"
            >
              {node.id}
            </text>
          </g>
        ))}
        
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon 
              points="0 0, 8 3, 0 6" 
              className="fill-foreground"
              strokeWidth="1"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
};