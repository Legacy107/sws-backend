import { GraphQLError, GraphQLFormattedError } from 'graphql';

export const formatError = (error: GraphQLError) => {
  console.error('error%%%%');
  const standardError: GraphQLFormattedError = {
    message: error.extensions?.message || error.message,
    ...error,
    extensions: undefined,
  };
  return standardError;
};
