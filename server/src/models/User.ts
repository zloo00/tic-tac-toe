import { Schema, model, type Document } from 'mongoose';
import { UserStatus } from './enums';
import { softDeletePlugin, type SoftDeleteDocument } from './plugins/softDelete';

export interface UserDocument extends Document, SoftDeleteDocument {
  email: string;
  username: string;
  passwordHash: string;
  rating: number;
  gamesPlayed: number;
  status: UserStatus;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Invalid email format',
      },
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be at most 20 characters'],
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: [60, 'Password hash must be at least 60 characters'],
    },
    rating: {
      type: Number,
      default: 1000,
      min: [0, 'Rating cannot be negative'],
    },
    gamesPlayed: {
      type: Number,
      default: 0,
      min: [0, 'Games played cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.OFFLINE,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(softDeletePlugin);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

export const UserModel = model<UserDocument>('User', userSchema);

