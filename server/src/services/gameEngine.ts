export type Symbol = 'X' | 'O';
export type Cell = '' | Symbol;
export type Board = ReadonlyArray<Cell>;

export type ValidateMoveResult =
  | { ok: true }
  | { ok: false; reason: string };

const WIN_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function isSymbol(value: unknown): value is Symbol {
  return value === 'X' || value === 'O';
}

function isCell(value: unknown): value is Cell {
  return value === '' || isSymbol(value);
}

function assertBoard(board: Board): ValidateMoveResult {
  if (!Array.isArray(board)) return { ok: false, reason: 'Board must be an array' };
  if (board.length !== 9) return { ok: false, reason: 'Board must have exactly 9 cells' };
  if (!board.every(isCell)) return { ok: false, reason: 'Board contains invalid cell value' };
  return { ok: true };
}

export function validateMove(board: Board, cellIndex: number, symbol: Symbol): ValidateMoveResult {
  const boardCheck = assertBoard(board);
  if (!boardCheck.ok) return boardCheck;

  if (!Number.isInteger(cellIndex)) return { ok: false, reason: 'cellIndex must be an integer' };
  if (cellIndex < 0 || cellIndex > 8) return { ok: false, reason: 'cellIndex must be between 0 and 8' };
  if (!isSymbol(symbol)) return { ok: false, reason: 'symbol must be X or O' };

  if (board[cellIndex] !== '') return { ok: false, reason: 'Cell is already occupied' };

  // Disallow moves after the game is already decided.
  const winner = detectWinner(board);
  if (winner) return { ok: false, reason: 'Game already has a winner' };
  if (detectDraw(board)) return { ok: false, reason: 'Game already ended in a draw' };

  return { ok: true };
}

export function applyMove(board: Board, cellIndex: number, symbol: Symbol): Cell[] {
  const res = validateMove(board, cellIndex, symbol);
  if (!res.ok) {
    throw new Error(res.reason);
  }
  const next = board.slice();
  next[cellIndex] = symbol;
  return next;
}

export function detectWinner(board: Board): Symbol | null {
  const boardCheck = assertBoard(board);
  if (!boardCheck.ok) return null;

  for (const [a, b, c] of WIN_LINES) {
    const v = board[a];
    if (v !== '' && v === board[b] && v === board[c]) {
      return v;
    }
  }
  return null;
}

export function detectDraw(board: Board): boolean {
  const boardCheck = assertBoard(board);
  if (!boardCheck.ok) return false;
  return detectWinner(board) === null && board.every((c) => c !== '');
}

export function switchTurn(symbol: Symbol): Symbol {
  return symbol === 'X' ? 'O' : 'X';
}


