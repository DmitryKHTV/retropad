export const boardsQueryKey = ['boards'] as const;

export const boardQueryKey = (id: string) => [...boardsQueryKey, id] as const;
