import { DFAState } from '@/types/dfa';

export interface FSM {
  alphabet: string[];
  states: DFAState[];
}

export function mergeStatePairs(fsm: FSM, statePairs: string[][]): FSM {
  const stateGroups: Record<string, string> = {};

  const find = (state: string): string => {
    if (!stateGroups[state]) return state;
    return stateGroups[state] = find(stateGroups[state]);
  };

  const union = (state1: string, state2: string) => {
    const root1 = find(state1);
    const root2 = find(state2);
    if (root1 !== root2) stateGroups[root2] = root1;
  };

  statePairs.forEach(([s1, s2]) => union(s1, s2));

  const mergedMapping: Record<string, Set<string>> = {};
  fsm.states.forEach(({ id }) => {
    const root = find(id);
    mergedMapping[root] = mergedMapping[root] || new Set();
    mergedMapping[root].add(id);
  });

  const newStates: DFAState[] = [];
  const stateReplacements: Record<string, string> = {};

  Object.entries(mergedMapping).forEach(([root, states]) => {
    const mergedId = `{${[...states].join(',')}}`;
    const representative = fsm.states.find(s => s.id === [...states][0])!;

    newStates.push({
      id: mergedId,
      type: representative.type,
      transitions: {},
      x: [...states].reduce((sum, id) => sum + (fsm.states.find(s => s.id === id)?.x || 0), 0) / states.size,
      y: [...states].reduce((sum, id) => sum + (fsm.states.find(s => s.id === id)?.y || 0), 0) / states.size
    });

    states.forEach(id => stateReplacements[id] = mergedId);
  });

  newStates.forEach(state => {
    const mergedIds = state.id.replace(/[{}]/g, '').split(',');
    const transitions: Record<string, Set<string>> = {};

    mergedIds.forEach(id => {
      const original = fsm.states.find(s => s.id === id)!;
      Object.entries(original.transitions).forEach(([symbol, target]) => {
        const mapped = stateReplacements[target] || target;
        transitions[symbol] = transitions[symbol] || new Set();
        transitions[symbol].add(mapped);
      });
    });

    Object.entries(transitions).forEach(([symbol, targets]) => {
      const arr = [...targets];
      state.transitions[symbol] = arr.length > 1 ? `{${arr.join(',')}}` : arr[0];
    });
  });

  return { alphabet: [...fsm.alphabet], states: newStates };
}