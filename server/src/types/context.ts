export interface User {
  id: string;
  email: string;
  username: string;
}

export interface GraphQLContext {
  req: any; // Using any to avoid type conflicts between express versions
  user: User | null;
}

export interface AuthenticatedContext extends GraphQLContext {
  user: User;
}

export interface SubscriptionContext {
  connectionParams?: {
    authorization?: string;
  };
  user?: User | null;
}

