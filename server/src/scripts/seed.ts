import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  UserModel,
  RoomModel,
  GameModel,
  MoveModel,
} from '../models';
import { UserStatus, RoomStatus, GameStatus, MoveSymbol } from '../models/enums';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

async function seed() {
  const mongoUri =
    process.env.MONGODB_URI ||
    'mongodb://admin:change-me@localhost:27017/tictactoe?authSource=admin';

  console.log(`Connecting to ${mongoUri}`);
  await mongoose.connect(mongoUri);

  await Promise.all([
    UserModel.deleteMany({}),
    RoomModel.deleteMany({}),
    GameModel.deleteMany({}),
    MoveModel.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);

  const [alice, bob, carol] = await UserModel.create([
    {
      email: 'alice@example.com',
      username: 'alice',
      passwordHash,
      rating: 1210,
      gamesPlayed: 32,
      status: UserStatus.ONLINE,
    },
    {
      email: 'bob@example.com',
      username: 'bob',
      passwordHash,
      rating: 1190,
      gamesPlayed: 28,
      status: UserStatus.IN_GAME,
    },
    {
      email: 'carol@example.com',
      username: 'carol',
      passwordHash,
      rating: 1250,
      gamesPlayed: 40,
      status: UserStatus.ONLINE,
    },
  ]);

  await RoomModel.create({
    code: 'ALPHA1',
    owner: alice._id,
    players: [alice._id],
    status: RoomStatus.WAITING,
  });

  const duelRoom = await RoomModel.create({
    code: 'BETA2',
    owner: bob._id,
    players: [bob._id, carol._id],
    status: RoomStatus.IN_PROGRESS,
  });

  const duelGame = await GameModel.create({
    room: duelRoom._id,
    players: [
      { user: bob._id, symbol: MoveSymbol.X },
      { user: carol._id, symbol: MoveSymbol.O },
    ],
    board: ['X', 'O', 'X', '', '', '', 'O', '', ''],
    turnUser: bob._id,
    status: GameStatus.RUNNING,
    startedAt: new Date(Date.now() - 1000 * 60 * 5),
  });

  duelRoom.activeGame = duelGame._id;
  await duelRoom.save();

  await MoveModel.insertMany([
    {
      game: duelGame._id,
      user: bob._id,
      cellIndex: 0,
      symbol: MoveSymbol.X,
    },
    {
      game: duelGame._id,
      user: carol._id,
      cellIndex: 1,
      symbol: MoveSymbol.O,
    },
    {
      game: duelGame._id,
      user: bob._id,
      cellIndex: 2,
      symbol: MoveSymbol.X,
    },
    {
      game: duelGame._id,
      user: carol._id,
      cellIndex: 6,
      symbol: MoveSymbol.O,
    },
  ]);

  const finishedRoom = await RoomModel.create({
    code: 'OMEGA3',
    owner: carol._id,
    players: [alice._id, carol._id],
    status: RoomStatus.FINISHED,
  });

  const finishedGame = await GameModel.create({
    room: finishedRoom._id,
    players: [
      { user: alice._id, symbol: MoveSymbol.X },
      { user: carol._id, symbol: MoveSymbol.O },
    ],
    board: ['O', 'O', 'O', 'X', 'X', '', '', '', 'X'],
    turnUser: null,
    winnerUser: carol._id,
    status: GameStatus.FINISHED,
    startedAt: new Date(Date.now() - 1000 * 60 * 10),
    endedAt: new Date(Date.now() - 1000 * 60 * 2),
  });

  finishedRoom.activeGame = finishedGame._id;
  await finishedRoom.save();

  console.log('Seed complete.');
  console.log('Accounts:');
  console.log('- alice@example.com / password123');
  console.log('- bob@example.com / password123');
  console.log('- carol@example.com / password123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});
