import { GraphQLContext, AuthenticatedContext } from '../types/context';
import { UnauthenticatedError, UnauthorizedError } from './errors';

/**
 * Ensures the user is authenticated
 * Throws UnauthenticatedError if not authenticated
 */
export function requireAuth(context: GraphQLContext): AuthenticatedContext {
  if (!context.user) {
    throw new UnauthenticatedError();
  }

  return context as AuthenticatedContext;
}

/**
 * Ensures the user is authenticated and matches the provided userId
 * Throws UnauthorizedError if user doesn't match
 */
export function requireUser(context: GraphQLContext, userId: string): AuthenticatedContext {
  const authContext = requireAuth(context);
  
  if (authContext.user.id !== userId) {
    throw new UnauthorizedError('You are not authorized to perform this action');
  }

  return authContext;
}

/**
 * Wrapper for resolvers that require authentication
 */
export function withAuth<TArgs, TReturn>(
  resolver: (parent: unknown, args: TArgs, context: AuthenticatedContext) => TReturn | Promise<TReturn>
) {
  return (parent: unknown, args: TArgs, context: GraphQLContext): TReturn | Promise<TReturn> => {
    const authContext = requireAuth(context);
    return resolver(parent, args, authContext);
  };
}

/**
 * Wrapper for resolvers that require specific user
 */
export function withUser<TArgs, TReturn>(
  userIdExtractor: (args: TArgs, context: GraphQLContext) => string,
  resolver: (parent: unknown, args: TArgs, context: AuthenticatedContext) => TReturn | Promise<TReturn>
) {
  return (parent: unknown, args: TArgs, context: GraphQLContext): TReturn | Promise<TReturn> => {
    const userId = userIdExtractor(args, context);
    const authContext = requireUser(context, userId);
    return resolver(parent, args, authContext);
  };
}

