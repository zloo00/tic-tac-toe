import type { UserStatus } from '../models';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  rating: number;
  gamesPlayed: number;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphQLContext {
  req: any; // Using any to avoid type conflicts between express versions
  user: AuthUser | null;
}

export interface AuthenticatedContext extends GraphQLContext {
  user: AuthUser;
}

export interface SubscriptionContext {
  connectionParams?: {
    authorization?: string;
  };
  user?: AuthUser | null;
}
