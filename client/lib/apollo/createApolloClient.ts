import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  type NormalizedCacheObject,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient as createWSClient } from 'graphql-ws';
import { getAuthToken } from '../../store/authStore';

const httpUri = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';
const wsUri = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql';

function createHttpLink() {
  const httpLink = new HttpLink({
    uri: httpUri,
    credentials: 'include',
  });

  const authLink = setContext((_, { headers }) => {
    const token = getAuthToken();
    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  return authLink.concat(httpLink);
}

function createWsLink() {
  if (typeof window === 'undefined') {
    return null;
  }

  return new GraphQLWsLink(
    createWSClient({
      url: wsUri,
      connectionParams: () => {
        const token = getAuthToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
      retryAttempts: 3,
    })
  );
}

export function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  const httpLink = createHttpLink();
  const wsLink = createWsLink();

  const link =
    wsLink != null
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'subscription'
            );
          },
          wsLink,
          httpLink
        )
      : httpLink;

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link,
    cache: new InMemoryCache(),
  });
}

