# GraphQL Backend Setup

## ✅ Implemented Features

### 1. JWT Authentication (`src/utils/jwt.ts`)
- `signToken()` - Create JWT tokens
- `verifyToken()` - Verify and decode JWT tokens
- `extractTokenFromHeader()` - Extract token from Authorization header

### 2. Unified Error Handling (`src/utils/errors.ts`)
- Custom error classes for all error types
- `formatError()` - Apollo Server error formatter
- Error codes enum for consistent error handling
- Errors: Unauthenticated, Unauthorized, Validation, NotFound, Business Logic, etc.

### 3. Authentication Context (`src/utils/auth.ts`)
- `getAuthUser()` - Extract user from JWT token
- `createContext()` - Create GraphQL context with authentication
- `createSubscriptionContext()` - Create WebSocket subscription context

### 4. Protected Resolvers (`src/utils/guards.ts`)
- `requireAuth()` - Ensure user is authenticated
- `requireUser()` - Ensure user matches specific userId
- `withAuth()` - Wrapper for protected resolvers
- `withUser()` - Wrapper for user-specific resolvers

## 📝 Usage Examples

### Protected Query Resolver
```typescript
import { withAuth } from './utils/guards';

const resolvers = {
  Query: {
    me: withAuth((_parent, _args, context) => {
      // context.user is guaranteed to exist
      return context.user;
    }),
  },
};
```

### Manual Authentication Check
```typescript
import { requireAuth } from './utils/guards';

const resolvers = {
  Query: {
    myData: (_parent, _args, context) => {
      const authContext = requireAuth(context);
      // Use authContext.user
    },
  },
};
```

### Throwing Custom Errors
```typescript
import { UnauthenticatedError, RoomNotFoundError } from './utils/errors';

if (!user) {
  throw new UnauthenticatedError();
}

if (!room) {
  throw new RoomNotFoundError('Room with code ABC123 not found');
}
```

## 🔐 Authentication Flow

1. Client sends request with `Authorization: Bearer <token>` header
2. `createContext()` extracts token and verifies it
3. User is added to context (or null if not authenticated)
4. Protected resolvers use `withAuth()` or `requireAuth()` to ensure authentication

## 📡 WebSocket Subscriptions

Subscriptions support authentication via connection params:
```typescript
// Client connects with:
{
  authorization: 'Bearer <token>'
}
```

The subscription context includes the authenticated user.

