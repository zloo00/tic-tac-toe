import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createContext, createSubscriptionContext } from './utils/auth';
import { formatError } from './utils/errors';
import { typeDefs, resolvers } from './schema';
import type { GraphQLContext, SubscriptionContext } from './types/context';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Apollo Server setup with authentication context
const apolloServer = new ApolloServer({
  schema,
  context: async ({ req }): Promise<GraphQLContext> => {
    return await createContext(req);
  },
  formatError,
  introspection: process.env.NODE_ENV !== 'production',
});

// WebSocket server for subscriptions with authentication
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer(
  {
    schema,
    context: async (ctx): Promise<SubscriptionContext> => {
      const connectionParams = ctx.connectionParams as { authorization?: string } | undefined;
      const { user } = await createSubscriptionContext(connectionParams || {});
      return {
        connectionParams,
        user,
      };
    },
  },
  wsServer
);

async function startServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app: app as any,
    path: '/graphql',
    cors: false,
  });

  // MongoDB connection
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set. Please provide a connection string.');
    process.exit(1);
  }
  
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
