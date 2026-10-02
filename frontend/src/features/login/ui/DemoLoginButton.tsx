'use client';

import { Button } from '@/shared/ui';
import { ApiError } from '@/shared/api';
import { describeApiError } from '@/shared/lib/describe-api-error';
import { useDemoLogin } from '@/features/login/api';
import cls from './LoginForm.module.css';

/**
 * "Try without signing up": opens a demo session as a guest. A 429 means the
 * per-address limit on demo sessions is spent, which the generic error
 * description would show as the throttler's raw message.
 */
export const DemoLoginButton = () => {
  const { mutate, isPending, error } = useDemoLogin();
  const message =
    error instanceof ApiError && error.status === 429
      ? 'Too many demo sessions from your network. Try again in a few minutes.'
      : error && describeApiError(error);

  return (
    <div className={cls.demo}>
      <Button
        type="button"
        outline
        intent="primary"
        onClick={() => mutate()}
        disabled={isPending}
        data-testid="demo-login"
      >
        {isPending ? 'Preparing a demo board…' : 'Try without signing up'}
      </Button>
      {message && (
        <p role="alert" className={cls.error}>
          {message}
        </p>
      )}
    </div>
  );
};
