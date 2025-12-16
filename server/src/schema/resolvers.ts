import { PubSub } from 'graphql-subscriptions';
import { withAuth } from '../utils/guards';
import type { GraphQLContext } from '../types/context';
import { ChatMessageModel, GameModel, RoomModel, UserModel } from '../models';
import { loginUser, registerUser } from '../services/authService';
import type { LoginInput, RegisterInput } from '../services/authService';
import { getRoomByCode, makeMove as makeGameMove } from '../services/gameService';
import { ChatMessageType } from '../models/enums';
import { InvalidInputError, RoomNotFoundError, UnauthenticatedError, UnauthorizedError } from '../utils/errors';
import { Types } from 'mongoose';

// PubSub instance for subscriptions
export const pubsub = new PubSub();

// Subscription event names
export const ROOM_UPDATED = 'ROOM_UPDATED';
export const GAME_UPDATED = 'GAME_UPDATED';
export const MESSAGE_ADDED = 'MESSAGE_ADDED';

type CreateRoomInput = {
  code?: string | null;
  isPrivate?: boolean | null;
  allowSpectators?: boolean | null;
  maxPlayers?: number | null;
  note?: string | null;
};

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

async function assertRoomParticipant(roomCode: string, userId: string) {
  const room = await getRoomByCode(roomCode);
  if (!room) throw new RoomNotFoundError();
  const inRoom = room.players.some((id) => id.toString() === userId);
  if (!inRoom) throw new UnauthorizedError('You are not a member of this room');
  return room;
}

export const resolvers = {
  ChatMessage: {
    room: async (msg: any) => {
      // msg.room may be ObjectId or populated Room document
      if (msg.room && typeof msg.room === 'object' && msg.room.code) return msg.room;
      return RoomModel.findOne({ _id: msg.room, isDeleted: false });
    },
    author: async (msg: any) => {
      // SYSTEM messages may have no author
      if (!msg.author) return null;
      if (typeof msg.author === 'object' && msg.author.email) return msg.author;
      return UserModel.findOne({ _id: msg.author, isDeleted: false });
    },
  },
  // ============================================
  // Queries
  // ============================================
  Query: {
    // Get current authenticated user
    me: withAuth((_parent, _args, context) => context.user),

    // Get all rooms in lobby (waiting for players)
    lobbyRooms: (_parent: unknown, _args: unknown, _context: GraphQLContext) => {
      // TODO: Fetch rooms with status WAITING from database
      return [];
    },

    // Get room by code
    roomByCode: (_parent: unknown, _args: { code: string }, _context: GraphQLContext) => {
      // TODO: Fetch room by code from database
      return null;
    },

    // Get active game in a room
    gameByRoom: async (_parent: unknown, args: { roomCode: string }) => {
      const room = await getRoomByCode(args.roomCode);
      if (!room) {
        return null;
      }
      return GameModel.findOne({ room: room._id, isDeleted: false });
    },

    // Get chat messages for a room
    chatMessages: (
      _parent: unknown,
      _args: { roomCode: string; limit?: number; offset?: number },
      _context: GraphQLContext
    ) => {
      // TODO: Fetch chat messages from database with pagination
      return [];
    },

    // Get leaderboard
    leaderboard: (_parent: unknown, _args: { limit?: number }, _context: GraphQLContext) => {
      // TODO: Fetch leaderboard from database
      return [];
    },
  },

  // ============================================
  // Mutations
  // ============================================
  Mutation: {
    // Register a new user
    register: async (_parent: unknown, args: { input: RegisterInput }) => {
      return registerUser(args.input);
    },

    // Login user
    login: async (_parent: unknown, args: { input: LoginInput }) => {
      return loginUser(args.input);
    },

    // Create a new room
    createRoom: withAuth(async (_parent, _args: { input?: CreateRoomInput }, _context) => {
      // TODO: Implement create room logic
      // - Generate unique room code
      // - Create room in database
      // - Set owner
      throw new Error('CreateRoom mutation not yet implemented');
    }),

    // Join an existing room
    joinRoom: withAuth(async (_parent, _args: { input: { code: string } }, _context) => {
      // TODO: Implement join room logic
      // - Find room by code
      // - Check if room is full
      // - Add user to room
      // - Publish ROOM_UPDATED event
      throw new Error('JoinRoom mutation not yet implemented');
    }),

    // Leave a room
    leaveRoom: withAuth(async (_parent, _args: { roomCode: string }, _context) => {
      // TODO: Implement leave room logic
      // - Remove user from room
      // - Update room status if needed
      // - Publish ROOM_UPDATED event
      throw new Error('LeaveRoom mutation not yet implemented');
    }),

    // Make a move in the game
    makeMove: withAuth(async (_parent, args: { input: { roomCode: string; cellIndex: number } }, context) => {
      const game = await makeGameMove({
        userId: context.user.id,
        roomCode: args.input.roomCode,
        cellIndex: args.input.cellIndex,
      });

      const channel = `${GAME_UPDATED}:${args.input.roomCode.trim().toUpperCase()}`;
      await pubsub.publish(channel, game);
      return game;
    }),

    // Send a chat message
    sendMessage: withAuth(async (_parent, args: { input: { roomCode: string; text: string } }, context) => {
      const roomCode = normalizeRoomCode(args.input.roomCode);
      const text = (args.input.text ?? '').trim();
      if (!text) throw new InvalidInputError('Message text cannot be empty');

      const room = await assertRoomParticipant(roomCode, context.user.id);

      const message = await ChatMessageModel.create({
        room: room._id,
        author: new Types.ObjectId(context.user.id),
        text,
        type: ChatMessageType.USER,
      });

      const channel = `${MESSAGE_ADDED}:${roomCode}`;
      await pubsub.publish(channel, message);
      return message;
    }),
  },

  // ============================================
  // Subscriptions
  // ============================================
  Subscription: {
    // Subscribe to room updates
    roomUpdated: {
      subscribe: (_parent: unknown, _args: { roomCode: string }) => {
        return pubsub.asyncIterator([ROOM_UPDATED]);
      },
      resolve: (payload: unknown) => payload,
    },

    // Subscribe to game updates
    gameUpdated: {
      subscribe: (_parent: unknown, args: { roomCode: string }) => {
        const channel = `${GAME_UPDATED}:${args.roomCode.trim().toUpperCase()}`;
        return pubsub.asyncIterator([channel]);
      },
      resolve: (payload: unknown) => payload,
    },

    // Subscribe to new chat messages
    messageAdded: {
      subscribe: async (_parent: unknown, args: { roomCode: string }, context: any) => {
        const roomCode = normalizeRoomCode(args.roomCode);
        const user = context?.user;
        if (!user) throw new UnauthenticatedError();
        await assertRoomParticipant(roomCode, user.id);
        const channel = `${MESSAGE_ADDED}:${roomCode}`;
        return pubsub.asyncIterator([channel]);
      },
      resolve: (payload: unknown) => payload,
    },
  },
};
