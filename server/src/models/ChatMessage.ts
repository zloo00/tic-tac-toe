import { Schema, model, Types, type Document } from 'mongoose';
import { ChatMessageType } from './enums';
import { softDeletePlugin, type SoftDeleteDocument } from './plugins/softDelete';

export interface ChatMessageDocument extends Document, SoftDeleteDocument {
  room: Types.ObjectId;
  author?: Types.ObjectId | null;
  text: string;
  type: ChatMessageType;
  createdAt: Date;
}

const chatMessageSchema = new Schema<ChatMessageDocument>(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    text: {
      type: String,
      required: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(ChatMessageType),
      default: ChatMessageType.USER,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

chatMessageSchema.pre('validate', function ensureAuthor(next) {
  if (this.type === ChatMessageType.USER && !this.author) {
    this.invalidate('author', 'User messages must have an author');
  }
  next();
});

chatMessageSchema.plugin(softDeletePlugin);
chatMessageSchema.index({ room: 1, createdAt: -1 });

export const ChatMessageModel = model<ChatMessageDocument>('ChatMessage', chatMessageSchema);

