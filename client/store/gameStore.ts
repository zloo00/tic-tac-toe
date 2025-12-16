import { create } from 'zustand';

type BoardCell = '' | 'X' | 'O';

interface GameState {
  roomCode: string | null;
  board: BoardCell[];
  turnUserId: string | null;
  winnerUserId: string | null;
  status: 'IDLE' | 'RUNNING' | 'FINISHED' | 'DRAW';
  setBoard: (board: BoardCell[]) => void;
  setMeta: (payload: {
    roomCode?: string | null;
    turnUserId?: string | null;
    winnerUserId?: string | null;
    status?: GameState['status'];
  }) => void;
  reset: () => void;
}

const createInitialState = () => ({
  roomCode: null,
  board: Array(9).fill('') as BoardCell[],
  turnUserId: null,
  winnerUserId: null,
  status: 'IDLE' as const,
});

export const useGameStore = create<GameState>((set) => ({
  ...createInitialState(),
  setBoard: (board) => set((state) => ({ ...state, board })),
  setMeta: (payload) =>
    set((state) => ({
      ...state,
      ...payload,
    })),
  reset: () => set(createInitialState()),
}));
