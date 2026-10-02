import type { User } from '@/shared/api';

/** A demo guest: deleted on logout or once `expiresAt` passes. */
export const isGuest = (user: Pick<User, 'kind'>): boolean => user.kind === 'GUEST';
