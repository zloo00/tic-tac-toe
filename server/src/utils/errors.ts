import { GraphQLError } from 'graphql';

export enum ErrorCode {
  // Authentication errors
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Not found errors
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  
  // Business logic errors
  ROOM_FULL = 'ROOM_FULL',
  ROOM_ALREADY_STARTED = 'ROOM_ALREADY_STARTED',
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  INVALID_MOVE = 'INVALID_MOVE',
  GAME_ALREADY_FINISHED = 'GAME_ALREADY_FINISHED',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface ErrorExtensions {
  code: ErrorCode;
  [key: string]: unknown;
}

export class AppError extends GraphQLError {
  constructor(
    message: string,
    code: ErrorCode,
    extensions?: Omit<ErrorExtensions, 'code'>
  ) {
    super(message, {
      extensions: {
        code,
        ...extensions,
      },
    });
  }
}

// Authentication errors
export class UnauthenticatedError extends AppError {
  constructor(message = 'You must be authenticated to perform this action') {
    super(message, ErrorCode.UNAUTHENTICATED);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'You are not authorized to perform this action') {
    super(message, ErrorCode.UNAUTHORIZED);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = 'Invalid or expired token') {
    super(message, ErrorCode.INVALID_TOKEN);
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, ErrorCode.VALIDATION_ERROR, { fields });
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.INVALID_INPUT);
  }
}

// Not found errors
export class NotFoundError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.NOT_FOUND) {
    super(message, code);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(message = 'User not found') {
    super(message, ErrorCode.USER_NOT_FOUND);
  }
}

export class RoomNotFoundError extends NotFoundError {
  constructor(message = 'Room not found') {
    super(message, ErrorCode.ROOM_NOT_FOUND);
  }
}

export class GameNotFoundError extends NotFoundError {
  constructor(message = 'Game not found') {
    super(message, ErrorCode.GAME_NOT_FOUND);
  }
}

// Business logic errors
export class RoomFullError extends AppError {
  constructor(message = 'Room is full') {
    super(message, ErrorCode.ROOM_FULL);
  }
}

export class RoomAlreadyStartedError extends AppError {
  constructor(message = 'Room game has already started') {
    super(message, ErrorCode.ROOM_ALREADY_STARTED);
  }
}

export class NotYourTurnError extends AppError {
  constructor(message = 'It is not your turn') {
    super(message, ErrorCode.NOT_YOUR_TURN);
  }
}

export class InvalidMoveError extends AppError {
  constructor(message = 'Invalid move') {
    super(message, ErrorCode.INVALID_MOVE);
  }
}

export class GameAlreadyFinishedError extends AppError {
  constructor(message = 'Game has already finished') {
    super(message, ErrorCode.GAME_ALREADY_FINISHED);
  }
}

// Server errors
export class InternalError extends AppError {
  constructor(message = 'An internal error occurred') {
    super(message, ErrorCode.INTERNAL_ERROR);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error occurred') {
    super(message, ErrorCode.DATABASE_ERROR);
  }
}

// Error formatter for Apollo Server
export function formatError(error: GraphQLError): GraphQLError {
  // Log internal errors
  if (error.extensions?.code === ErrorCode.INTERNAL_ERROR || 
      error.extensions?.code === ErrorCode.DATABASE_ERROR) {
    console.error('Internal error:', error);
  }

  // Don't expose internal error details to clients
  if (error.extensions?.code === ErrorCode.INTERNAL_ERROR) {
    return new GraphQLError('An internal error occurred', {
      extensions: {
        code: ErrorCode.INTERNAL_ERROR,
      },
    });
  }

  // Return the error as-is for known errors
  return error;
}

