import { Schema, model, Types, type Document } from 'mongoose';
import { MoveSymbol } from './enums';
import { softDeletePlugin, type SoftDeleteDocument } from './plugins/softDelete';

export interface MoveDocument extends Document, SoftDeleteDocument {
  game: Types.ObjectId;
  user: Types.ObjectId;
  cellIndex: number;
  symbol: MoveSymbol;
  createdAt: Date;
}

const moveSchema = new Schema<MoveDocument>(
  {
    game: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cellIndex: {
      type: Number,
      required: true,
      min: [0, 'Cell index must be between 0 and 8'],
      max: [8, 'Cell index must be between 0 and 8'],
    },
    symbol: {
      type: String,
      enum: Object.values(MoveSymbol),
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

moveSchema.plugin(softDeletePlugin);
moveSchema.index({ game: 1, cellIndex: 1 }, { unique: true });

export const MoveModel = model<MoveDocument>('Move', moveSchema);

