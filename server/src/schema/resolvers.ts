import { PubSub } from 'graphql-subscriptions';
import { withAuth } from '../utils/guards';
import type { GraphQLContext } from '../types/context';
import { ChatMessageModel, GameModel, MoveModel, RoomModel, UserModel } from '../models';
import { loginUser, registerUser } from '../services/authService';
import type { LoginInput, RegisterInput } from '../services/authService';
import { getRoomByCode, makeMove as makeGameMove } from '../services/gameService';
import { ChatMessageType } from '../models/enums';
import {
  InvalidInputError,
  RoomFullError,
  RoomNotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
  UserNotFoundError,
} from '../utils/errors';
import { Types } from 'mongoose';
import { RoomStatus, GameStatus, MoveSymbol } from '../models/enums';

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
  Room: {
    name: (room: any) => room.name ?? 'Tic-Tac-Toe Room',
    owner: async (room: any) => {
      if (room.owner && typeof room.owner === 'object' && room.owner.username) return room.owner;
      return UserModel.findOne({ _id: room.owner, isDeleted: false });
    },
    players: async (room: any) => {
      const ids = (room.players ?? []).map((id: any) => id.toString());
      if (ids.length === 0) return [];
      return UserModel.find({ _id: { $in: ids }, isDeleted: false });
    },
    activeGame: async (room: any) => {
      if (!room.activeGame) return null;
      return GameModel.findOne({ _id: room.activeGame, isDeleted: false });
    },
  },
  GamePlayer: {
    user: async (player: any) => {
      if (player.user && typeof player.user === 'object' && player.user.username) return player.user;
      return UserModel.findOne({ _id: player.user, isDeleted: false });
    },
  },
  Game: {
    room: async (game: any) => {
      if (game.room && typeof game.room === 'object' && game.room.code) return game.room;
      return RoomModel.findOne({ _id: game.room, isDeleted: false });
    },
    turn: async (game: any) => {
      if (!game.turnUser) return null;
      return UserModel.findOne({ _id: game.turnUser, isDeleted: false });
    },
    winner: async (game: any) => {
      if (!game.winnerUser) return null;
      return UserModel.findOne({ _id: game.winnerUser, isDeleted: false });
    },
    moves: async (game: any) => {
      return MoveModel.find({ game: game._id, isDeleted: false }).sort({ createdAt: 1 });
    },
  },
  Move: {
    game: async (move: any) => {
      if (move.game && typeof move.game === 'object' && Array.isArray(move.game.board)) return move.game;
      return GameModel.findOne({ _id: move.game, isDeleted: false });
    },
    user: async (move: any) => {
      if (move.user && typeof move.user === 'object' && move.user.username) return move.user;
      return UserModel.findOne({ _id: move.user, isDeleted: false });
    },
  },
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
    lobbyRooms: async () => {
      return RoomModel.find({
        status: { $in: [RoomStatus.WAITING, RoomStatus.IN_PROGRESS] },
        isDeleted: false,
      }).sort({ createdAt: -1 });
    },

    // Get room by code
    roomByCode: async (_parent: unknown, args: { code: string }) => {
      return getRoomByCode(args.code);
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
      args: { roomCode: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) =>
      withAuth(async () => {
        const roomCode = normalizeRoomCode(args.roomCode);
        await assertRoomParticipant(roomCode, context.user!.id);
        const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
        const offset = Math.max(args.offset ?? 0, 0);
        const room = await getRoomByCode(roomCode);
        if (!room) throw new RoomNotFoundError();
        return ChatMessageModel.find({ room: room._id, isDeleted: false })
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit);
      })(_parent, args as any, context),

    // Get leaderboard
    leaderboard: async (_parent: unknown, args: { limit?: number }) => {
      const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
      const users = await UserModel.find({ isDeleted: false }).sort({ rating: -1 }).limit(limit);
      return users.map((user: any, idx: number) => ({
        user,
        rank: idx + 1,
        rating: user.rating,
        gamesPlayed: user.gamesPlayed,
        winRate: user.gamesPlayed > 0 ? 0 : 0,
      }));
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
    createRoom: withAuth(async (_parent, args: { input?: CreateRoomInput }, context) => {
      const name = args.input?.name?.trim();
      const opponentUsername = args.input?.opponentUsername?.trim();
      if (!name) throw new InvalidInputError('Room name is required');
      if (!opponentUsername) throw new InvalidInputError('Opponent username is required');

      const desired = args.input?.code ? normalizeRoomCode(args.input.code) : null;
      const gen = () =>
        Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase();

      let code = desired ?? gen();
      for (let i = 0; i < 5; i++) {
        // eslint-disable-next-line no-await-in-loop
        const exists = await RoomModel.exists({ code, isDeleted: false });
        if (!exists) break;
        code = gen();
      }

      const ownerId = new Types.ObjectId(context.user.id);
      const opponent = await UserModel.findOne({
        username: opponentUsername,
        isDeleted: false,
      });
      if (!opponent) throw new UserNotFoundError('Opponent not found');
      if (opponent.id === context.user.id) {
        throw new InvalidInputError('You cannot select yourself as opponent');
      }

      const room = await RoomModel.create({
        code,
        name,
        owner: ownerId,
        players: [ownerId, opponent._id],
        status: RoomStatus.IN_PROGRESS,
      });

      const game = await GameModel.create({
        room: room._id,
        players: [
          { user: ownerId, symbol: MoveSymbol.X },
          { user: opponent._id, symbol: MoveSymbol.O },
        ],
        board: Array(9).fill(''),
        turnUser: ownerId,
        winnerUser: null,
        status: GameStatus.RUNNING,
        startedAt: new Date(),
        endedAt: null,
      });

      room.activeGame = game._id;
      await room.save();

      const channel = `${ROOM_UPDATED}:${code}`;
      await pubsub.publish(channel, room);
      const gch = `${GAME_UPDATED}:${code}`;
      await pubsub.publish(gch, game);
      return room;
    }),

    // Join an existing room
    joinRoom: withAuth(async (_parent, args: { input: { code: string } }, context) => {
      const code = normalizeRoomCode(args.input.code);
      const room = await getRoomByCode(code);
      if (!room) throw new RoomNotFoundError();

      const userId = new Types.ObjectId(context.user.id);
      const already = room.players.some((p) => p.toString() === context.user.id);
      if (!already) {
        if (room.players.length >= 2) throw new RoomFullError();
        room.players.push(userId);
      }

      // Start a game once we have 2 players (minimal)
      if (room.players.length === 2 && !room.activeGame) {
        const [p1, p2] = room.players;
        const game = await GameModel.create({
          room: room._id,
          players: [
            { user: p1, symbol: MoveSymbol.X },
            { user: p2, symbol: MoveSymbol.O },
          ],
          board: Array(9).fill(''),
          turnUser: p1,
          winnerUser: null,
          status: GameStatus.RUNNING,
          startedAt: new Date(),
          endedAt: null,
        });
        room.activeGame = game._id;
        room.status = RoomStatus.IN_PROGRESS;
        const gch = `${GAME_UPDATED}:${code}`;
        await pubsub.publish(gch, game);
      }

      await room.save();
      const channel = `${ROOM_UPDATED}:${code}`;
      await pubsub.publish(channel, room);
      return room;
    }),

    // Leave a room
    leaveRoom: withAuth(async (_parent, args: { roomCode: string }, context) => {
      const code = normalizeRoomCode(args.roomCode);
      const room = await getRoomByCode(code);
      if (!room) throw new RoomNotFoundError();

      room.players = room.players.filter((p) => p.toString() !== context.user.id);
      if (room.players.length === 0) {
        room.isDeleted = true;
        room.deletedAt = new Date();
      } else {
        room.status = RoomStatus.WAITING;
        // If owner left, reassign owner to remaining player
        if (room.owner.toString() === context.user.id) {
          room.owner = room.players[0]!;
        }
      }

      await room.save();
      const channel = `${ROOM_UPDATED}:${code}`;
      await pubsub.publish(channel, room);
      return true;
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
      subscribe: async (_parent: unknown, args: { roomCode: string }, context: any) => {
        const roomCode = normalizeRoomCode(args.roomCode);
        const user = context?.user;
        if (!user) throw new UnauthenticatedError();
        await assertRoomParticipant(roomCode, user.id);
        const channel = `${ROOM_UPDATED}:${roomCode}`;
        return pubsub.asyncIterator([channel]);
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
