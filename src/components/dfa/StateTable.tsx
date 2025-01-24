import React from 'react';
import { X } from 'lucide-react';
import { DFAState } from '@/types/dfa';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StateTableProps {
  states: DFAState[];
  alphabetArray: string[];
  onTypeChange: (index: number, newType: string) => void;
  onTransitionChange: (stateIndex: number, symbol: string, target: string) => void;
  onRemoveState: (index: number) => void;
  onAddState: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export const StateTable: React.FC<StateTableProps> = ({
  states,
  alphabetArray,
  onTypeChange,
  onTransitionChange,
  onRemoveState,
  onAddState,
  onImport,
  onExport,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-foreground">States</h3>
        <button
          onClick={onAddState}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Add State
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <label className="flex-1">
          <input
            type="file"
            accept=".alt"
            onChange={onImport}
            className="hidden"
            id="import-file"
          />
          <div className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition-opacity text-center cursor-pointer">
            Import (.alt)
          </div>
        </label>
        <button
          onClick={onExport}
          className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Export my DFA FSM
        </button>
      </div>
      <div
        className="border rounded-lg resize overflow-auto min-h-[200px] max-h-[400px]"
        style={{ minWidth: '300px' }}
      >
        <table className="w-full">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">State</th>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Type</th>
              {alphabetArray.map(char => (
                <th key={char} className="p-3 text-left text-sm font-medium text-muted-foreground">{char}</th>
              ))}
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {states.map((state, index) => (
              <tr key={state.id} className="hover:bg-muted/50">
                <td className="p-3">{state.id}</td>
                <td className="p-3">
                  <Select
                    value={state.type}
                    onValueChange={(value) => onTypeChange(index, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Start</SelectItem>
                      <SelectItem value="transition">Transition</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="start+final">Start + Final</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                {alphabetArray.map(char => (
                  <td key={char} className="p-3">
                    <Select
                      value={state.transitions[char]}
                      onValueChange={(value) => onTransitionChange(index, char, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {states.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                ))}
                <td className="p-3">
                  <button
                    onClick={() => onRemoveState(index)}
                    className="p-1 text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
