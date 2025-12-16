import { verifyToken, extractTokenFromHeader } from './jwt';
import { GraphQLContext, User } from '../types/context';

// Using any for Request to avoid type conflicts between express versions
type ExpressRequest = any;

/**
 * Extracts and verifies JWT token from request headers
 */
export async function getAuthUser(req: ExpressRequest): Promise<User | null> {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  // In a real app, you would fetch the user from the database here
  // For now, we'll return the payload as the user
  // TODO: Fetch user from database to ensure they still exist and are active
  return {
    id: payload.userId,
    email: payload.email,
    username: payload.email.split('@')[0], // Placeholder
  };
}

/**
 * Creates GraphQL context with authentication
 */
export async function createContext(req: ExpressRequest): Promise<GraphQLContext> {
  const user = await getAuthUser(req);
  
  return {
    req,
    user,
  };
}

/**
 * Creates subscription context with authentication
 */
export async function createSubscriptionContext(
  connectionParams: { authorization?: string }
): Promise<{ user: User | null }> {
  const authHeader = connectionParams?.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return { user: null };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { user: null };
  }

  // TODO: Fetch user from database
  return {
    user: {
      id: payload.userId,
      email: payload.email,
      username: payload.email.split('@')[0],
    },
  };
}

