import React from 'react';
import { DFAState } from '@/types/dfa';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MyhillStateTableProps {
  states: DFAState[];
  alphabet: string[];
  equivalenceClasses: string[][]; // Array of merged state groups (e.g., [['q0', 'q1'], ['q2']])
}

export const MyhillStateTable: React.FC<MyhillStateTableProps> = ({
  states,
  alphabet,
  equivalenceClasses,
}) => {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-2">Merged States</h4>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>State</TableHead>
              {alphabet.map((symbol) => (
                <TableHead key={symbol}>{symbol}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {equivalenceClasses.map((eqClass, index) => {
              // Find a representative state from the equivalence class
              const representativeState = states.find((s) => s.id === eqClass[0])!;

              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {eqClass.join(', ')} {/* Display merged states, e.g., "q0, q1" */}
                  </TableCell>
                  {alphabet.map((symbol) => {
                    const targetStateId = representativeState.transitions[symbol];
                    const targetClass = equivalenceClasses.findIndex((ec) =>
                      ec.includes(targetStateId)
                    );
                    const targetDisplay = targetClass !== -1 ? `q${targetClass}` : 'none';

                    return (
                      <TableCell key={symbol}>
                        {targetDisplay}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};