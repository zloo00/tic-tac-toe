import { readFileSync } from 'fs';
import { join } from 'path';
import { DateTimeScalar } from './scalars';
import { resolvers as appResolvers } from './resolvers';

export const typeDefs = readFileSync(
  join(__dirname, 'schema.graphql'),
  'utf-8'
);

export const resolvers = {
  DateTime: DateTimeScalar,
  ...appResolvers,
};

