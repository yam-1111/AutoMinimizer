import React, { useState, useRef } from 'react';
import { DFAState } from '@/types/dfa';
import { StateTable } from './dfa/StateTable';
import { MyhillNerodeVisualizer } from './dfa/MyhillNerodeVisualizer';
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
import { ThemeToggle } from './ui/theme-toggle';
import Footer from '@/components/Footer';

const DFAVisualizer = () => {
  const [alphabet, setAlphabet] = useState('a,b');
  const [states, setStates] = useState<DFAState[]>([
    { id: 'q0', type: 'start', transitions: { a: 'none', b: 'none' }, x: 200, y: 300 },
    { id: 'q1', type: 'transition', transitions: { a: 'none', b: 'none' }, x: 300, y: 300 }
  ]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [draggedState, setDraggedState] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const [minimizedStates, setMinimizedStates] = useState<DFAState[]>([]);

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

  const handleExport = () => {
    const data = {
      alphabet,
      states
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automaton.alt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Your automaton has been exported successfully.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(file.name.endsWith('.atl') || file.name.endsWith('.alt'))) {
      toast({
        title: "Invalid DFA File",
        description: "Please select a .alt file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.alphabet && Array.isArray(data.states)) {
          const newAlphabetArray = data.alphabet.split(',').map((c: string) => c.trim());
          // Normalize transitions for all alphabet symbols
          const normalizedStates = data.states.map((state: DFAState) => {
            const transitions = Object.fromEntries(
              newAlphabetArray.map((char: string) => [
                char,
                state.transitions[char] || 'none' // Fill missing symbols with 'none'
              ])
            );
            return { ...state, transitions };
          });

          setAlphabet(data.alphabet);
          setStates(normalizedStates); // Use normalized states
          toast({
            title: "Import Successful",
            description: "Your DFA FSM has been imported successfully.",
          });
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "The selected file contains invalid data",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    // Reset the input value to allow importing the same file again
    event.target.value = '';
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
      x: lastState.x + 100,
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

  const handleSampleImport = async (filename: string) => {
    try {
      const response = await fetch(`/dfa_examples/${filename}`);
      if (!response.ok) throw new Error('Sample not found');

      const data = await response.json();
      const newAlphabetArray = data.alphabet.split(',').map((c: string) => c.trim());

      // Normalize transitions same as regular import
      const normalizedStates = data.states.map((state: DFAState) => {
        const transitions = Object.fromEntries(
          newAlphabetArray.map((char: string) => [
            char,
            state.transitions[char] || 'none'
          ])
        );
        return { ...state, transitions };
      });

      setAlphabet(data.alphabet);
      setStates(normalizedStates);

      toast({
        title: "Sample Loaded",
        description: `${filename} has been loaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Failed to Load Sample",
        description: "Could not load the selected sample file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-grow">
          {/* Left Panel - State Table */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={45}>
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-primary">AutoMinimizer</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    A Visualizer for the Deterministic Finite Automata (DFA) Minimization
                  </p>
                </div>
                <ThemeToggle />
              </div>
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
                  onImport={handleImport}
                  onExport={handleExport}
                  onSampleImport={handleSampleImport}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Graph and Minimization */}
          <ResizablePanel defaultSize={75}>
            <ResizablePanelGroup direction="vertical">
              {/* Upper Panel - DFA Graph */}
              <ResizablePanel defaultSize={50}>
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

              <ResizableHandle />

              {/* Lower Panel - Myhill-Nerode Visualization */}
              <ResizablePanel defaultSize={50}>
                <MyhillNerodeVisualizer
                  states={states}
                  alphabet={alphabetArray}
                  onMinimizedDFA={setMinimizedStates}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warning</DialogTitle>
          </DialogHeader>
          <AlertDescription>{warningMessage}</AlertDescription>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default DFAVisualizer;