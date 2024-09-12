import { GraphQLError, GraphQLFormattedError } from 'graphql';

export const formatError = (error: GraphQLError) => {
  const standardError: GraphQLFormattedError = {
    message: error.extensions?.message || error.message,
    ...error,
    extensions: undefined,
  };
  return standardError;
};
