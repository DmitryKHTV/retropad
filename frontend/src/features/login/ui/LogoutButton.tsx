'use client';

import classNames from 'classnames';
import { Button } from '@/shared/ui';
import { isGuest, useMe } from '@/entities/user';
import { useLogout } from '@/features/login/api';
import IconLogout from '@/shared/assets/icons/icon-logout.svg';
import cls from './LogoutButton.module.css';

/**
 * Ends the session. For a guest this also deletes the demo account on the
 * server, so the label says so. On narrow screens only the icon is shown and
 * the label moves to aria-label and the tooltip.
 */
export const LogoutButton = ({ className }: { className?: string }) => {
  const { data: user } = useMe();
  const { mutate, isPending } = useLogout();

  if (!user) return null;

  const label = isGuest(user) ? 'End demo' : 'Log out';

  return (
    <Button
      type="button"
      outline
      className={classNames(cls.button, className)}
      onClick={() => mutate()}
      disabled={isPending}
      aria-label={label}
      title={label}
      data-testid="logout"
    >
      <IconLogout className={cls.icon} />
      <span className={cls.label}>{label}</span>
    </Button>
  );
};
