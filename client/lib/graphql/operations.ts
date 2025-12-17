import { gql } from '@apollo/client';

const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    email
    username
    rating
    gamesPlayed
    status
  }
`;

const ROOM_FIELDS = gql`
  fragment RoomFields on Room {
    id
    code
    name
    status
    owner {
      ...UserFields
    }
    players {
      ...UserFields
    }
    activeGame {
      id
      status
    }
    createdAt
    updatedAt
  }
  ${USER_FIELDS}
`;

const GAME_FIELDS = gql`
  fragment GameFields on Game {
    id
    status
    board
    turn {
      ...UserFields
    }
    winner {
      ...UserFields
    }
    players {
      symbol
      user {
        ...UserFields
      }
    }
    moves {
      id
      cellIndex
      symbol
      user {
        ...UserFields
      }
      createdAt
    }
    startedAt
    endedAt
  }
  ${USER_FIELDS}
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const LOBBY_ROOMS_QUERY = gql`
  query LobbyRooms {
    lobbyRooms {
      ...RoomFields
    }
  }
  ${ROOM_FIELDS}
`;

export const ROOM_BY_CODE_QUERY = gql`
  query RoomByCode($code: String!) {
    roomByCode(code: $code) {
      ...RoomFields
    }
  }
  ${ROOM_FIELDS}
`;

export const GAME_BY_ROOM_QUERY = gql`
  query GameByRoom($roomCode: String!) {
    gameByRoom(roomCode: $roomCode) {
      ...GameFields
    }
  }
  ${GAME_FIELDS}
`;

export const LEADERBOARD_QUERY = gql`
  query Leaderboard($limit: Int) {
    leaderboard(limit: $limit) {
      rank
      rating
      gamesPlayed
      winRate
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

export const ROOM_UPDATED_SUBSCRIPTION = gql`
  subscription RoomUpdated($roomCode: String!) {
    roomUpdated(roomCode: $roomCode) {
      ...RoomFields
    }
  }
  ${ROOM_FIELDS}
`;

export const GAME_UPDATED_SUBSCRIPTION = gql`
  subscription GameUpdated($roomCode: String!) {
    gameUpdated(roomCode: $roomCode) {
      ...GameFields
    }
  }
  ${GAME_FIELDS}
`;

export const MAKE_MOVE_MUTATION = gql`
  mutation MakeMove($input: MakeMoveInput!) {
    makeMove(input: $input) {
      ...GameFields
    }
  }
  ${GAME_FIELDS}
`;

export const CREATE_ROOM_MUTATION = gql`
  mutation CreateRoom($input: CreateRoomInput) {
    createRoom(input: $input) {
      ...RoomFields
    }
  }
  ${ROOM_FIELDS}
`;
