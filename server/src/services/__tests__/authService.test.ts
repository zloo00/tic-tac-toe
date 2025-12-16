import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { registerUser, loginUser, normalizeEmail } from '../authService';
import { UserModel } from '../../models';

describe('authService', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  test('normalizeEmail lowercases and trims email', () => {
    expect(normalizeEmail('  USER@Example.com ')).toBe('user@example.com');
  });

  test('registerUser hashes password and returns auth payload', async () => {
    const result = await registerUser({
      email: 'test@example.com',
      username: 'tester',
      password: 'supersecure',
    });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe('test@example.com');

    const storedUser = await UserModel.findOne({ email: 'test@example.com' }).lean();
    expect(storedUser).not.toBeNull();
    expect(storedUser?.passwordHash).not.toBe('supersecure');
  });

  test('registerUser rejects duplicate email', async () => {
    await registerUser({
      email: 'duplicate@example.com',
      username: 'original',
      password: 'uniquepass',
    });

    await expect(
      registerUser({
        email: 'duplicate@example.com',
        username: 'second',
        password: 'anotherpass',
      })
    ).rejects.toThrow('Email already in use');
  });

  test('loginUser returns token for valid credentials', async () => {
    await registerUser({
      email: 'login@example.com',
      username: 'loginUser',
      password: 'validpassword',
    });

    const result = await loginUser({
      email: 'login@example.com',
      password: 'validpassword',
    });

    expect(result.token).toBeTruthy();
    expect(result.user.username).toBe('loginUser');
  });

  test('loginUser rejects invalid password', async () => {
    await registerUser({
      email: 'wrongpass@example.com',
      username: 'wrongpass',
      password: 'correctpass',
    });

    await expect(
      loginUser({
        email: 'wrongpass@example.com',
        password: 'incorrect',
      })
    ).rejects.toThrow('Invalid email or password');
  });
});
