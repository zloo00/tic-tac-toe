'use client';

import { ReactNode, useMemo } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '../lib/apollo/createApolloClient';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const client = useMemo(() => createApolloClient(), []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

