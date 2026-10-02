import { User, UserKind } from '@prisma/client';

// A guest past its expiry is treated as gone even before the sweep in
// DemoService deletes the row.
export function isExpiredGuest(user: Pick<User, 'kind' | 'expiresAt'>): boolean {
  return (
    user.kind === UserKind.GUEST &&
    (user.expiresAt === null || user.expiresAt.getTime() <= Date.now())
  );
}
