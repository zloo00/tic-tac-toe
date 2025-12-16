import { Schema, model, Types, type Document } from 'mongoose';
import { RoomStatus } from './enums';
import { softDeletePlugin, type SoftDeleteDocument } from './plugins/softDelete';

export interface RoomDocument extends Document, SoftDeleteDocument {
  code: string;
  status: RoomStatus;
  owner: Types.ObjectId;
  players: Types.ObjectId[];
  activeGame?: Types.ObjectId | null;
}

const roomSchema = new Schema<RoomDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [4, 'Room code must be at least 4 characters'],
      maxlength: [8, 'Room code must be at most 8 characters'],
    },
    status: {
      type: String,
      enum: Object.values(RoomStatus),
      default: RoomStatus.WAITING,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    players: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
      validate: [
        {
          validator: (value: Types.ObjectId[]) => value.length <= 2,
          msg: 'Room can have at most two players',
        },
      ],
    },
    activeGame: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.plugin(softDeletePlugin);
roomSchema.index({ owner: 1 });

export const RoomModel = model<RoomDocument>('Room', roomSchema);
