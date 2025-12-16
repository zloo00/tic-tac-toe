# GraphQL Schema Documentation

## 📋 Overview

Complete GraphQL SDL schema for Tic-Tac-Toe Online with:
- **6 Queries**
- **7 Mutations**
- **3 Subscriptions**
- **5 Enums**
- **6 Input Types**
- **8 Object Types**

## 🔍 Queries (6)

1. **`me`** - Get current authenticated user
2. **`lobbyRooms`** - Get all rooms waiting for players
3. **`roomByCode(code: String!)`** - Get room by unique code
4. **`gameByRoom(roomCode: String!)`** - Get active game in a room
5. **`chatMessages(roomCode: String!, limit: Int, offset: Int)`** - Get chat messages with pagination
6. **`leaderboard(limit: Int)`** - Get top players by rating

## ✏️ Mutations (7)

1. **`register(input: RegisterInput!)`** - Register new user
2. **`login(input: LoginInput!)`** - Login user and get JWT token
3. **`createRoom(input: CreateRoomInput)`** - Create a new game room
4. **`joinRoom(input: JoinRoomInput!)`** - Join an existing room
5. **`leaveRoom(roomCode: String!)`** - Leave a room
6. **`makeMove(input: MakeMoveInput!)`** - Make a move in the game
7. **`sendMessage(input: SendMessageInput!)`** - Send a chat message

## 📡 Subscriptions (3)

1. **`roomUpdated(roomCode: String!)`** - Subscribe to room status/player changes
2. **`gameUpdated(roomCode: String!)`** - Subscribe to game moves and status
3. **`messageAdded(roomCode: String!)`** - Subscribe to new chat messages

## 🎯 Enums (5)

- **`UserStatus`**: `ONLINE`, `IN_GAME`, `OFFLINE`
- **`RoomStatus`**: `WAITING`, `IN_PROGRESS`, `FINISHED`
- **`GameStatus`**: `RUNNING`, `FINISHED`, `DRAW`
- **`Symbol`**: `X`, `O`
- **`MessageType`**: `USER`, `SYSTEM`

## 📥 Input Types (6)

- **`RegisterInput`**: email, username, password
- **`LoginInput`**: email, password
- **`CreateRoomInput`**: (empty, extensible)
- **`JoinRoomInput`**: code
- **`MakeMoveInput`**: roomCode, cellIndex (0-8)
- **`SendMessageInput`**: roomCode, text

## 📦 Object Types (8)

- **`User`**: id, email, username, rating, gamesPlayed, status, timestamps
- **`Room`**: id, code, status, owner, players, activeGame, timestamps
- **`Game`**: id, room, players, board (9 cells), turn, winner, status, moves, timestamps
- **`GamePlayer`**: user, symbol
- **`Move`**: id, game, user, cellIndex, symbol, createdAt
- **`ChatMessage`**: id, room, author, text, type, createdAt
- **`LeaderboardEntry`**: user, rank, rating, gamesPlayed, winRate
- **`AuthPayload`**: token, user

## 🔧 Custom Scalars

- **`DateTime`**: ISO 8601 date-time string

## 🔐 Authentication

- Queries `me`, `lobbyRooms`, `roomByCode`, `gameByRoom`, `chatMessages`, `leaderboard` - Public (some may require auth)
- Mutations `register`, `login` - Public
- Mutations `createRoom`, `joinRoom`, `leaveRoom`, `makeMove`, `sendMessage` - **Protected** (require authentication)
- All Subscriptions - **Protected** (require authentication via connection params)

## 📝 Usage Example

```graphql
# Query
query GetMe {
  me {
    id
    username
    rating
  }
}

# Mutation
mutation CreateRoom {
  createRoom {
    id
    code
    status
  }
}

# Subscription
subscription GameUpdates($roomCode: String!) {
  gameUpdated(roomCode: $roomCode) {
    id
    board
    status
    turn {
      id
      username
    }
  }
}
```

## 🚀 Next Steps

Resolvers are currently stubs with TODO comments. Implement:
1. Database models (Mongoose schemas)
2. Business logic for each resolver
3. Validation and error handling
4. Subscription filtering by roomCode
5. ELO rating calculation

