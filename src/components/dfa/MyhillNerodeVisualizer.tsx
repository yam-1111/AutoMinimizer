import { MyhillNerodeTable } from '@/types/dfa';
import { DFAState, FSM } from '@/types/dfa';
import React, { useState, useEffect } from 'react';
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { DFAGraph } from './DFAGraph';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mergeStatePairs } from '@/utils/MyhillMerge';

interface MyhillNerodeVisualizerProps {
  states: DFAState[];
  alphabet: string[];
  onMinimizedDFA: (states: DFAState[]) => void;
}

export const MyhillNerodeVisualizer: React.FC<MyhillNerodeVisualizerProps> = ({
  states,
  alphabet,
  onMinimizedDFA,
}) => {
  const [table, setTable] = useState<MyhillNerodeTable>({
    pairs: {},
    iteration: 0,
    markingHistory: [],
  });
  const [showMinimized, setShowMinimized] = useState(false);
  const [minimizationComplete, setMinimizationComplete] = useState(false);
  const [minimizedStates, setMinimizedStates] = useState<DFAState[]>([]);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [iterationHistory, setIterationHistory] = useState<MyhillNerodeTable[]>([]);
  const [mergedFSM, setMergedFSM] = useState<FSM | null>(null);
  const [draggedState, setDraggedState] = useState<string | null>(null);


  useEffect(() => {
    if (states.length > 0) {
      const initialTable = initializeTable();
      setTable(initialTable);
      setIterationHistory([initialTable]);
      setCurrentIteration(0);
      setShowMinimized(false);
      setMinimizationComplete(false);
      setMinimizedStates([]);
    }
  }, [states, alphabet]);

  // New effect for merged FSM updates
  useEffect(() => {
    if (states.length > 0 && table.pairs) {
      const unmarked = states
        .slice(1)
        .flatMap((state1, i) =>
          states.slice(0, i + 1)
            .filter(state2 => !table.pairs[state1.id]?.[state2.id])
            .map(state2 => [state1.id, state2.id])
        );
      const fsmCopy = JSON.parse(JSON.stringify({ states, alphabet }));
      setMergedFSM(mergeStatePairs(fsmCopy, unmarked));
    }
  }, [table.pairs, states, alphabet]);

  const initializeTable = () => {
    const pairs: Record<string, Record<string, boolean>> = {};
    const markingHistory: MyhillNerodeTable['markingHistory'] = [];

    // Create empty table for all states except q0
    states.forEach((state1, i) => {
      if (i === 0) return;
      pairs[state1.id] = {};
      states.slice(0, i).forEach(state2 => {
        pairs[state1.id][state2.id] = false;
      });
    });

    // Phase 1: Mark pairs where one is final and other is not
    states.forEach((state1, i) => {
      if (i === 0) return;
      states.slice(0, i).forEach(state2 => {
        const state1IsFinal = state1.type === 'final' || state1.type === 'start+final';
        const state2IsFinal = state2.type === 'final' || state2.type === 'start+final';
        if (state1IsFinal !== state2IsFinal) {
          pairs[state1.id][state2.id] = true;
          markingHistory.push({
            pair: [state1.id, state2.id],
            reason: `One state is final (${state1IsFinal ? state1.id : state2.id}) and the other is not`,
            iteration: 0,
          });
        }
      });
    });

    return { pairs, iteration: 0, markingHistory };;
  };

  const isStatePairMarked = (state1: string, state2: string): boolean => {
    if (state1 === state2) return false;
    if (state1 === 'none' || state2 === 'none') return true;
    if (state1 === 'q0' || state2 === 'q0') return false; // Don't mark pairs with q0

    const [higher, lower] = state1 > state2 ? [state1, state2] : [state2, state1];
    return table.pairs[higher]?.[lower] ?? false;
  };

  const performIteration = () => {
    if (minimizationComplete) return;

    const newPairs = JSON.parse(JSON.stringify(table.pairs));
    const newHistory = [...table.markingHistory];
    let changed = false;

    states.forEach((state1, i) => {
      if (i === 0) return;
      states.slice(0, i).forEach(state2 => {
        if (!newPairs[state1.id][state2.id]) {
          for (const symbol of alphabet) {
            // Handle undefined transitions by falling back to 'none'
            const nextState1 = state1.transitions[symbol] ?? 'none';
            const nextState2 = state2.transitions[symbol] ?? 'none';
            if (nextState1 !== nextState2 && isStatePairMarked(nextState1, nextState2)) {
              newPairs[state1.id][state2.id] = true;
              newHistory.push({
                pair: [state1.id, state2.id],
                reason: `Transitions on '${symbol}' lead to distinguishable states (${nextState1}, ${nextState2})`,
                iteration: table.iteration + 1,
              });
              changed = true;
              break;
            }
          }
        }
      });
    });


    const newIterationTable = {
      pairs: newPairs,
      iteration: table.iteration + 1,
      markingHistory: newHistory,
    };

    const updatedHistory = [...iterationHistory, newIterationTable];
    setIterationHistory(updatedHistory);
    setCurrentIteration(updatedHistory.length - 1);
    setTable(newIterationTable);

    if (!changed) {
      const minStates = generateMinimizedDFA();
      setMinimizedStates(minStates);
      setMinimizationComplete(true); // Disables the Next button
      onMinimizedDFA(minStates);
    }
  };

  const goToPreviousIteration = () => {
    if (currentIteration > 0) {
      const prevIteration = currentIteration - 1;
      setCurrentIteration(prevIteration);
      setTable(iterationHistory[prevIteration]);
    }
  };

  const findEquivalenceClasses = () => {
    const equivalenceClasses: string[][] = [];
    const assigned = new Set<string>();

    // Always start with q0 in its own class
    equivalenceClasses.push(['q0']);
    assigned.add('q0');

    // Find equivalence classes for remaining states
    states.slice(1).forEach(state => {
      if (!assigned.has(state.id)) {
        const eqClass = [state.id];
        assigned.add(state.id);

        states.slice(1).forEach(otherState => {
          if (!assigned.has(otherState.id) && !isStatePairMarked(state.id, otherState.id)) {
            eqClass.push(otherState.id);
            assigned.add(otherState.id);
          }
        });

        equivalenceClasses.push(eqClass);
      }
    });

    return equivalenceClasses;
  };

  const generateMinimizedDFA = () => {
    const equivalenceClasses = findEquivalenceClasses();

    return equivalenceClasses.map((eqClass, index) => {
      // Find a representative state from the equivalence class
      const representativeState = states.find(s => s.id === eqClass[0])!;

      // Determine the type of the new state
      const hasStart = eqClass.some(id =>
        states.find(s => s.id === id)?.type.includes('start')
      );
      const hasFinal = eqClass.some(id =>
        states.find(s => s.id === id)?.type.includes('final')
      );

      let type: DFAState['type'] = 'transition';
      if (hasStart && hasFinal) type = 'start+final';
      else if (hasStart) type = 'start';
      else if (hasFinal) type = 'final';

      // Create new transitions
      const newTransitions = { ...representativeState.transitions };
      Object.keys(newTransitions).forEach(symbol => {
        const oldTarget = newTransitions[symbol];
        if (oldTarget !== 'none') {
          const targetClass = equivalenceClasses.findIndex(ec =>
            ec.includes(oldTarget)
          );
          newTransitions[symbol] = targetClass !== -1 ? `q${targetClass}` : 'none';
        }
      });

      return {
        id: `q${index}`,
        type,
        transitions: newTransitions,
        x: 200 + index * 150,
        y: 300,
      };
    });
  };


  // Add handlers for dragging states
  const handleMouseDown = (event: React.MouseEvent, stateId: string) => {
    setDraggedState(stateId);
    event.preventDefault();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggedState || !svgRef.current || !mergedFSM) return;

    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPoint = point.matrixTransform(ctm.inverse());

    setMergedFSM(prev => ({
      ...prev!,
      states: prev!.states.map(state => {
        if (state.id === draggedState) {
          return { ...state, x: svgPoint.x, y: svgPoint.y };
        }
        return state;
      })
    }));
  };

  const handleMouseUp = () => {
    setDraggedState(null);
  };

  return (

    <div className="h-full flex flex-col">
      {/* Main Container */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Myhill-Nerode Minimization</h3>
          <div className="space-x-2">
            <Button
              onClick={goToPreviousIteration}
              disabled={currentIteration <= 0}
            >
              Previous
            </Button>
            <Button
              onClick={performIteration}
              disabled={minimizationComplete}
            >
              Next
            </Button>
            <Button
              onClick={() => setShowMinimized(!showMinimized)}
              disabled={!minimizationComplete}
            >
              {showMinimized ? 'Hide' : 'Show'} Minimized DFA
            </Button>
          </div>
        </div>
      </div>
      {/* Table and Marking History */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Distinguished Pairs Table</h4>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background"></TableHead>
                    {states.map(state => (
                      <TableHead key={state.id}>{state.id}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {states.map((state1, i) => i > 0 && (
                    <TableRow key={state1.id}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        {state1.id}
                      </TableCell>
                      {states.slice(0, i).map((state2) => (
                        <TableCell
                          key={`${state1.id}-${state2.id}`}
                          className={
                            table.pairs[state1.id]?.[state2.id]
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300'
                          }
                        >
                          {table.pairs[state1.id]?.[state2.id] ? '×' : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Marking History */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Marking History</h4>
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              {table.markingHistory.map((entry, index) => (
                <div
                  key={index}
                  className="mb-2 p-2 border rounded"
                >
                  <p className="font-medium">
                    Iteration {entry.iteration}: Marked ({entry.pair[0]}, {entry.pair[1]})
                  </p>
                  <p className="text-sm text-muted-foreground">{entry.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Minimized DFA */}
        {showMinimized && minimizedStates.length > 0 && (
          <div className="mt-4 border rounded-lg p-4">
            <h4 className="font-medium mb-2">Minimized DFA</h4>
            <div className="h-[300px] relative bg-background">
              <DFAGraph
                states={minimizedStates}
                svgRef={svgRef}
                onMouseMove={() => { }}
                onMouseUp={() => { }}
                onMouseDown={() => { }}
              />
            </div>
          </div>
        )}

        {/* Unmarked Pairs */}
        <div className="border rounded-lg p-4 mt-4">
          <h4 className="font-medium mb-2">Unmarked Pairs</h4>
          <div className="overflow-auto max-h-[300px]">
            {states.map((state1, i) => i > 0 && (
              states.slice(0, i).map((state2) => (
                !table.pairs[state1.id]?.[state2.id] && (
                  <div key={`${state1.id}-${state2.id}`} className="mb-2 p-2 border rounded">
                    <p>({state1.id}, {state2.id})</p>
                  </div>
                )
              ))
            ))}
          </div>
        </div>



        <div className="border rounded-lg p-4 mt-4">
          <h4 className="font-medium mb-2">Merged DFA Visualization</h4>
          <div className="h-[300px] relative bg-background">
            <div className="absolute inset-0">
              {mergedFSM ? (
                <DFAGraph
                  states={mergedFSM.states}
                  svgRef={svgRef}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseDown={handleMouseDown}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                  Merged DFA will appear here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div >
  );
};