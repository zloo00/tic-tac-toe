import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { GameModel, RoomModel, UserModel } from '../../models';
import { makeMove } from '../gameService';
import { GameStatus, MoveSymbol } from '../../models/enums';

describe('gameService.makeMove', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(async () => {
    await Promise.all([
      GameModel.deleteMany({}),
      RoomModel.deleteMany({}),
      UserModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  async function createUsers() {
    const passwordHash = 'x'.repeat(60);
    const [alice, bob] = await UserModel.create([
      { email: 'alice@example.com', username: 'alice', passwordHash },
      { email: 'bob@example.com', username: 'bob', passwordHash },
    ]);
    return { alice, bob };
  }

  async function seedGame() {
    const { alice, bob } = await createUsers();
    const room = await RoomModel.create({
      code: 'ROOM',
      owner: alice._id,
      players: [alice._id, bob._id],
    });

    const game = await GameModel.create({
      room: room._id,
      players: [
        { user: alice._id, symbol: MoveSymbol.X },
        { user: bob._id, symbol: MoveSymbol.O },
      ],
      board: Array(9).fill(''),
      turnUser: alice._id,
    });

    room.activeGame = game._id;
    await room.save();

    return { room, game, alice, bob };
  }

  test('records a move and switches turns', async () => {
    const { room, alice, bob } = await seedGame();

    const updated = await makeMove({
      userId: alice.id,
      roomCode: room.code,
      cellIndex: 0,
    });

    expect(updated.board[0]).toBe(MoveSymbol.X);
    expect(updated.turnUser?.toString()).toBe(bob.id);
    expect(updated.status).toBe(GameStatus.RUNNING);
  });

  test('detects a winner and finishes the game', async () => {
    const { room, alice, bob } = await seedGame();

    await makeMove({ userId: alice.id, roomCode: room.code, cellIndex: 0 });
    await makeMove({ userId: bob.id, roomCode: room.code, cellIndex: 3 });
    await makeMove({ userId: alice.id, roomCode: room.code, cellIndex: 1 });
    await makeMove({ userId: bob.id, roomCode: room.code, cellIndex: 4 });
    const finalState = await makeMove({
      userId: alice.id,
      roomCode: room.code,
      cellIndex: 2,
    });

    expect(finalState.status).toBe(GameStatus.FINISHED);
    expect(finalState.winnerUser?.toString()).toBe(alice.id);
    expect(finalState.turnUser).toBeNull();
    expect(finalState.endedAt).toBeInstanceOf(Date);
  });
});
