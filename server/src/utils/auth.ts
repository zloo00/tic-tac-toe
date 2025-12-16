import { verifyToken, extractTokenFromHeader } from './jwt';
import { GraphQLContext, AuthUser } from '../types/context';
import { UserModel } from '../models';
import { mapUserDocument } from '../services/authService';

// Using any for Request to avoid type conflicts between express versions
type ExpressRequest = any;

/**
 * Extracts and verifies JWT token from request headers
 */
export async function getAuthUser(req: ExpressRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await UserModel.findOne({
    _id: payload.userId,
    isDeleted: false,
  });

  if (!user) {
    return null;
  }

  return mapUserDocument(user);
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
): Promise<{ user: AuthUser | null }> {
  const authHeader = connectionParams?.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return { user: null };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { user: null };
  }

  const user = await UserModel.findOne({
    _id: payload.userId,
    isDeleted: false,
  });

  return {
    user: user ? mapUserDocument(user) : null,
  };
}
