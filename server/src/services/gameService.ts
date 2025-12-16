import { Types } from 'mongoose';
import {
  GameModel,
  MoveModel,
  RoomModel,
  type GameDocument,
  type RoomDocument,
} from '../models';
import { GameStatus, MoveSymbol, RoomStatus } from '../models/enums';
import {
  GameAlreadyFinishedError,
  GameNotFoundError,
  InvalidMoveError,
  NotYourTurnError,
  RoomNotFoundError,
  UnauthorizedError,
} from '../utils/errors';

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export interface MakeMoveInput {
  userId: string;
  roomCode: string;
  cellIndex: number;
}

export async function getRoomByCode(code: string): Promise<RoomDocument | null> {
  return RoomModel.findOne({
    code: code.trim().toUpperCase(),
    isDeleted: false,
  });
}

export function detectWinner(board: string[]): MoveSymbol | null {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as MoveSymbol;
    }
  }
  return null;
}

export function isBoardFull(board: string[]): boolean {
  return board.every((cell) => cell !== '');
}

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

function validateCellIndex(cellIndex: number): void {
  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
    throw new InvalidMoveError('Cell index must be between 0 and 8');
  }
}

function getOpponentUserId(game: GameDocument, currentUserId: string): Types.ObjectId | null {
  const opponent = game.players.find((player) => player.user.toString() !== currentUserId);
  return opponent?.user ?? null;
}

export async function makeMove(input: MakeMoveInput): Promise<GameDocument> {
  const roomCode = normalizeRoomCode(input.roomCode);
  validateCellIndex(input.cellIndex);

  const room = await getRoomByCode(roomCode);
  if (!room) {
    throw new RoomNotFoundError();
  }

  const userInRoom = room.players.some((playerId) => playerId.toString() === input.userId);
  if (!userInRoom) {
    throw new UnauthorizedError('You are not a member of this room');
  }

  const game = await GameModel.findOne({
    room: room._id,
    isDeleted: false,
  });

  if (!game) {
    throw new GameNotFoundError('No active game found for this room');
  }

  if (game.status !== GameStatus.RUNNING) {
    throw new GameAlreadyFinishedError('Game is not accepting moves');
  }

  const player = game.players.find((entry) => entry.user.toString() === input.userId);
  if (!player) {
    throw new UnauthorizedError('You are not part of this game');
  }

  if (!game.turnUser) {
    game.turnUser = game.players[0]?.user ?? null;
  }

  if (!game.turnUser || game.turnUser.toString() !== input.userId) {
    throw new NotYourTurnError();
  }

  const board = [...game.board];
  if (board[input.cellIndex] !== '') {
    throw new InvalidMoveError('Cell already occupied');
  }

  board[input.cellIndex] = player.symbol;
  game.board = board;
  game.markModified('board');

  await MoveModel.create({
    game: game._id,
    user: player.user,
    cellIndex: input.cellIndex,
    symbol: player.symbol,
  });

  const winnerSymbol = detectWinner(board);
  if (winnerSymbol) {
    const winner = game.players.find((entry) => entry.symbol === winnerSymbol);
    game.winnerUser = winner?.user ?? null;
    game.status = GameStatus.FINISHED;
    game.turnUser = null;
    game.endedAt = new Date();
    room.status = RoomStatus.FINISHED;
  } else if (isBoardFull(board)) {
    game.status = GameStatus.DRAW;
    game.turnUser = null;
    game.winnerUser = null;
    game.endedAt = new Date();
    room.status = RoomStatus.FINISHED;
  } else {
    game.turnUser = getOpponentUserId(game, input.userId);
    room.status = RoomStatus.IN_PROGRESS;
  }

  await Promise.all([game.save(), room.save()]);
  return game;
}

