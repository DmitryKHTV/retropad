'use client';

import React from 'react';
import cls from '@/features/login/ui/LoginForm.module.css';
import { Button, Input } from '@/shared/ui';
import { useLogin } from '@/features/login/api';
import { LoginDto } from '@/features/login/model/types';
import { DemoLoginButton } from './DemoLoginButton';

type AuthFormProps = {
  onRegisterModeSwitch: () => void;
};

export const AuthForm = ({ onRegisterModeSwitch }: AuthFormProps) => {
  const { mutate, isPending, error } = useLogin();

  const onLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loginInfo: LoginDto = {
      email: formData.get('email')?.toString() ?? '',
      password: formData.get('password')?.toString() ?? '',
    };
    mutate(loginInfo);
  };

  return (
    <>
      <form className={cls.loginForm} onSubmit={onLogin} data-testid="login-form">
        <h1 className={cls.header}>Log in to Retropad</h1>
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          required
          data-testid="login-email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          data-testid="login-password"
        />
        {error && (
          <p role="alert" className={cls.error} data-testid="login-error">
            {error.message}
          </p>
        )}
        <Button
          intent="primary"
          type="submit"
          disabled={isPending}
          className={cls.submit}
          data-testid="login-submit"
        >
          {isPending ? 'Logging in…' : 'Log in'}
        </Button>
        <div className={cls.divider}>or</div>
        <DemoLoginButton />
      </form>
      <p className={cls.switchMode}>
        Don't have an account?{' '}
        <button
          type="button"
          className={cls.switchLink}
          onClick={onRegisterModeSwitch}
          disabled={isPending}
          data-testid="register-mode"
        >
          Sign up
        </button>
      </p>
    </>
  );
};
