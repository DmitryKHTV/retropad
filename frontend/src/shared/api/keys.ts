// Shared so the global QueryCache error handler in `query-client.ts`
// and `useMe` agree on the cache slot for the current user.
export const ME_QUERY_KEY = ['me'] as const;
