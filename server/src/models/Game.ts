import { Schema, model, Types, type Document } from 'mongoose';
import { GameStatus, MoveSymbol } from './enums';
import { softDeletePlugin, type SoftDeleteDocument } from './plugins/softDelete';

export interface GamePlayer {
  user: Types.ObjectId;
  symbol: MoveSymbol;
}

export interface GameDocument extends Document, SoftDeleteDocument {
  room: Types.ObjectId;
  players: GamePlayer[];
  board: string[];
  turnUser?: Types.ObjectId | null;
  winnerUser?: Types.ObjectId | null;
  status: GameStatus;
  startedAt: Date;
  endedAt?: Date | null;
}

const gamePlayerSchema = new Schema<GamePlayer>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      enum: Object.values(MoveSymbol),
      required: true,
    },
  },
  { _id: false }
);

const gameSchema = new Schema<GameDocument>(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      unique: true,
    },
    players: {
      type: [gamePlayerSchema],
      default: [],
      validate: [
        {
          validator: (players: GamePlayer[]) => players.length <= 2,
          msg: 'Game can only contain two players',
        },
        {
          validator: (players: GamePlayer[]) => {
            const symbols = new Set(players.map((player) => player.symbol));
            return symbols.size === players.length;
          },
          msg: 'Symbols must be unique across players',
        },
      ],
    },
    board: {
      type: [String],
      default: () => Array(9).fill(''),
      validate: [
        {
          validator: (cells: string[]) => cells.length === 9,
          msg: 'Board must contain exactly 9 cells',
        },
        {
          validator: (cells: string[]) =>
            cells.every((cell) => cell === '' || cell === MoveSymbol.X || cell === MoveSymbol.O),
          msg: 'Board cells must be empty, X, or O',
        },
      ],
    },
    turnUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    winnerUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(GameStatus),
      default: GameStatus.RUNNING,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

gameSchema.plugin(softDeletePlugin);
export const GameModel = model<GameDocument>('Game', gameSchema);
