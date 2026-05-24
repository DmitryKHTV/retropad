'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/entities/user';

const PUBLIC_ROUTES = ['/login'] as const;

const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export const AuthGate = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending } = useMe();
  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (isPending) return;
    if (!user && !publicRoute) {
      router.replace('/login');
    } else if (user && publicRoute) {
      router.replace('/');
    }
  }, [user, isPending, publicRoute, router]);

  if (publicRoute) {
    if (user) return null;
    return <>{children}</>;
  }

  if (isPending || !user) return null;
  return <>{children}</>;
};
