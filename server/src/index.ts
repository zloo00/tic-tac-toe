import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Placeholder GraphQL schema
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello from Tic-Tac-Toe Server!',
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Apollo Server setup
const apolloServer = new ApolloServer({
  schema,
  context: ({ req }) => {
    // TODO: Add authentication context
    return { req };
  },
});

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer({ schema }, wsServer);

async function startServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  // MongoDB connection
  const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/tictactoe?authSource=admin';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }

  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`📡 WebSocket server ready at ws://localhost:${PORT}/graphql`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    serverCleanup.dispose();
    await apolloServer.stop();
    await mongoose.connection.close();
    httpServer.close();
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

