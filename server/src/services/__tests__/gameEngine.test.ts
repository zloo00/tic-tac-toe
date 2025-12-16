import type { Cell } from '../gameEngine';
import { applyMove, detectDraw, detectWinner, switchTurn, validateMove } from '../gameEngine';

function emptyBoard(): Cell[] {
  return Array(9).fill('') as Cell[];
}

describe('gameEngine', () => {
  describe('validateMove', () => {
    test('accepts a valid move', () => {
      const board = emptyBoard();
      expect(validateMove(board, 0, 'X')).toEqual({ ok: true });
    });

    test('rejects non-integer cellIndex', () => {
      const board = emptyBoard();
      expect(validateMove(board, 1.2, 'X')).toEqual({ ok: false, reason: 'cellIndex must be an integer' });
    });

    test('rejects out-of-range cellIndex', () => {
      const board = emptyBoard();
      expect(validateMove(board, -1, 'X')).toEqual({ ok: false, reason: 'cellIndex must be between 0 and 8' });
      expect(validateMove(board, 9, 'X')).toEqual({ ok: false, reason: 'cellIndex must be between 0 and 8' });
    });

    test('rejects move on occupied cell', () => {
      const board = emptyBoard();
      board[4] = 'O';
      expect(validateMove(board, 4, 'X')).toEqual({ ok: false, reason: 'Cell is already occupied' });
    });

    test('rejects move after winner exists', () => {
      const board = ['X', 'X', 'X', '', '', '', '', '', ''] as const;
      expect(validateMove(board, 3, 'O')).toEqual({ ok: false, reason: 'Game already has a winner' });
    });

    test('rejects move after draw', () => {
      const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'] as const; // full, no winner
      expect(validateMove(board, 0, 'X')).toEqual({ ok: false, reason: 'Cell is already occupied' });
    });
  });

  describe('applyMove', () => {
    test('returns a new board and does not mutate input', () => {
      const board = emptyBoard();
      const next = applyMove(board, 2, 'X');
      expect(next).not.toBe(board);
      expect(board[2]).toBe('');
      expect(next[2]).toBe('X');
    });

    test('throws on invalid move', () => {
      const board = emptyBoard();
      board[0] = 'X';
      expect(() => applyMove(board, 0, 'O')).toThrow('Cell is already occupied');
    });
  });

  describe('detectWinner', () => {
    test('detects row winner', () => {
      const board = ['O', 'O', 'O', '', '', '', '', '', ''] as const;
      expect(detectWinner(board)).toBe('O');
    });

    test('detects column winner', () => {
      const board = ['X', '', '', 'X', '', '', 'X', '', ''] as const;
      expect(detectWinner(board)).toBe('X');
    });

    test('detects diagonal winner', () => {
      const board = ['X', '', '', '', 'X', '', '', '', 'X'] as const;
      expect(detectWinner(board)).toBe('X');
    });

    test('returns null when there is no winner', () => {
      const board = ['X', 'O', 'X', '', '', '', '', '', ''] as const;
      expect(detectWinner(board)).toBeNull();
    });
  });

  describe('detectDraw', () => {
    test('returns true when board full and no winner', () => {
      const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'] as const;
      expect(detectWinner(board)).toBeNull();
      expect(detectDraw(board)).toBe(true);
    });

    test('returns false when board not full', () => {
      const board = emptyBoard();
      board[0] = 'X';
      expect(detectDraw(board)).toBe(false);
    });

    test('returns false when winner exists', () => {
      const board = ['X', 'X', 'X', 'O', 'O', '', '', '', ''] as const;
      expect(detectDraw(board)).toBe(false);
    });
  });

  describe('switchTurn', () => {
    test('switches X -> O and O -> X', () => {
      expect(switchTurn('X')).toBe('O');
      expect(switchTurn('O')).toBe('X');
    });
  });
});


