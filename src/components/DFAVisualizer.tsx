import React, { useState, useRef } from 'react';
import { DFAState } from '@/types/dfa';
import { StateTable } from './dfa/StateTable';
import { DFAGraph } from './dfa/DFAGraph';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const DFAVisualizer = () => {
  const [alphabet, setAlphabet] = useState('a,b');
  const [states, setStates] = useState<DFAState[]>([
    { id: 'q0', type: 'start', transitions: { a: 'none', b: 'none' }, x: 200, y: 300 }, // Changed to start+final
    { id: 'q1', type: 'transition', transitions: { a: 'none', b: 'none' }, x: 500, y: 300 }
  ]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [draggedState, setDraggedState] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  const alphabetArray = alphabet.split(',').map(char => char.trim()).filter(Boolean);

  const handleAlphabetChange = (value: string) => {
    const newAlphabet = value.replace(/[^a-z0-9!@#$%^&*()_+\-=~,]/gi, '');
    setAlphabet(newAlphabet);
    const newAlphabetArray = newAlphabet.split(',').map(char => char.trim()).filter(Boolean);

    setStates(prevStates => prevStates.map(state => {
      const updatedTransitions = Object.fromEntries(
        newAlphabetArray.map(char => [char, 'none'])
      );

      Object.entries(state.transitions).forEach(([symbol, target]) => {
        if (newAlphabetArray.includes(symbol)) {
          updatedTransitions[symbol] = target;
        }
      });

      return {
        ...state,
        transitions: updatedTransitions
      };
    }));
  };

  const handleMouseDown = (event: React.MouseEvent, stateId: string) => {
    setDraggedState(stateId);
    event.preventDefault();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggedState || !svgRef.current) return;

    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPoint = point.matrixTransform(ctm.inverse());

    setStates(states.map(state => {
      if (state.id === draggedState) {
        return { ...state, x: svgPoint.x, y: svgPoint.y };
      }
      return state;
    }));
  };

  const handleMouseUp = () => {
    setDraggedState(null);
  };

  const addState = () => {
    const lastState = states[states.length - 1];
    const usedNumbers = states.map(s => parseInt(s.id.substring(1)));
    let newNumber = 0;
    while (usedNumbers.includes(newNumber)) {
      newNumber++;
    }

    const newState: DFAState = {
      id: `q${newNumber}`,
      type: 'transition',
      transitions: Object.fromEntries(alphabetArray.map(char => [char, 'none'])),
      x: lastState.x + 300,
      y: lastState.y
    };
    setStates([...states, newState]);
  };

  const removeState = (index: number) => {
    const newStates = [...states];
    const removedState = newStates[index].id;

    const hasIncomingTransitions = newStates.some(state =>
      Object.values(state.transitions).some(target => target === removedState)
    );

    if (hasIncomingTransitions) {
      setWarningMessage('Cannot remove state with incoming transitions');
      setShowWarning(true);
      return;
    }

    newStates.splice(index, 1);

    const removedNumber = parseInt(removedState.substring(1));
    newStates.forEach(state => {
      Object.entries(state.transitions).forEach(([key, value]) => {
        if (value !== 'none') {
          const transitionNumber = parseInt(value.substring(1));
          if (transitionNumber > removedNumber) {
            state.transitions[key] = `q${transitionNumber - 1}`;
          }
        }
      });
    });

    newStates.forEach((state, i) => {
      const currentNumber = parseInt(state.id.substring(1));
      if (currentNumber > removedNumber) {
        state.id = `q${currentNumber - 1}`;
      }
    });

    setStates(newStates);
  };

  const handleTypeChange = (index: number, newType: string) => {
    // Validate type changes
    if (newType === 'start' || newType === 'start+final') {
      // Check if there's already a start state
      const hasStartState = states.some((state, i) =>
        i !== index && (state.type === 'start' || state.type === 'start+final')
      );

      if (hasStartState) {
        setWarningMessage('Only one start state is allowed');
        setShowWarning(true);
        return;
      }
    }

    const newStates = [...states];
    newStates[index].type = newType as DFAState['type'];
    setStates(newStates);
  };

  const handleTransitionChange = (stateIndex: number, symbol: string, target: string) => {
    setStates(prevStates => {
      const newStates = [...prevStates];
      const currentState = { ...newStates[stateIndex] };
      const newTransitions = { ...currentState.transitions };
      newTransitions[symbol] = target;
      currentState.transitions = newTransitions;
      newStates[stateIndex] = currentState;
      return newStates;
    });
  };

  return (
    <div className="flex flex-col h-screen">


      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={30} minSize={15} maxSize={45}>
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary">AutoMinimizer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              A Visualizer for the Deterministic Finite Automata (DFA) Minimization
            </p>
          </div>
          <div className="h-full border-r border-border bg-card p-4 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Alphabet (Σ)</label>
                <input
                  type="text"
                  value={alphabet}
                  onChange={(e) => handleAlphabetChange(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter symbols separated by comma"
                />
              </div>

              <StateTable
                states={states}
                alphabetArray={alphabetArray}
                onTypeChange={handleTypeChange}
                onTransitionChange={handleTransitionChange}
                onRemoveState={removeState}
                onAddState={addState}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={80}>
          <div className="h-full relative bg-background">
            <DFAGraph
              states={states}
              svgRef={svgRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseDown={handleMouseDown}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warning</DialogTitle>
          </DialogHeader>
          <AlertDescription>{warningMessage}</AlertDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DFAVisualizer;