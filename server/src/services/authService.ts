import bcrypt from 'bcryptjs';
import { UserModel, type UserDocument } from '../models';
import { signToken } from '../utils/jwt';
import { InvalidInputError, ValidationError } from '../utils/errors';

const SALT_ROUNDS = 10;

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: ReturnType<typeof mapUserDocument>;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function mapUserDocument(user: UserDocument) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    rating: user.rating,
    gamesPlayed: user.gamesPlayed,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function ensureUniqueUser(email: string, username: string): Promise<void> {
  const existing = await UserModel.findOne({
    $or: [{ email }, { username }],
    isDeleted: false,
  }).lean();

  if (!existing) {
    return;
  }

  if (existing.email === email) {
    throw new ValidationError('Email already in use', { email: 'Email already in use' });
  }

  if (existing.username === username) {
    throw new ValidationError('Username already in use', { username: 'Username already in use' });
  }
}

function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long', {
      password: 'Password must be at least 8 characters long',
    });
  }
}

function buildAuthResult(user: UserDocument): AuthResult {
  const payload = {
    userId: user.id,
    email: user.email,
  };

  return {
    token: signToken(payload),
    user: mapUserDocument(user),
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const username = input.username.trim();
  const password = input.password;

  validatePasswordStrength(password);
  await ensureUniqueUser(email, username);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await UserModel.create({
    email,
    username,
    passwordHash,
  });

  return buildAuthResult(user);
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const user = await UserModel.findOne({
    email,
    isDeleted: false,
  });

  if (!user) {
    throw new InvalidInputError('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new InvalidInputError('Invalid email or password');
  }

  return buildAuthResult(user);
}

