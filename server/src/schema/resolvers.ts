import { PubSub } from 'graphql-subscriptions';
import { withAuth } from '../utils/guards';
import type { GraphQLContext } from '../types/context';
import { GameModel } from '../models';
import { loginUser, registerUser } from '../services/authService';
import type { LoginInput, RegisterInput } from '../services/authService';
import { getRoomByCode, makeMove as makeGameMove } from '../services/gameService';

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

export const resolvers = {
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
    sendMessage: withAuth(async (_parent, _args: { input: { roomCode: string; text: string } }, _context) => {
      // TODO: Implement send message logic
      // - Create chat message in database
      // - Publish MESSAGE_ADDED event
      throw new Error('SendMessage mutation not yet implemented');
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
      subscribe: (_parent: unknown, _args: { roomCode: string }) => {
        return pubsub.asyncIterator([MESSAGE_ADDED]);
      },
      resolve: (payload: unknown) => payload,
    },
  },
};
