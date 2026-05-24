'use client';

import React from 'react';
import cls from '@/features/login/ui/LoginForm.module.css';
import { Button, Input } from '@/shared/ui';
import { useLogin } from '@/features/login/api';
import { LoginDto } from '@/features/login/model/types';

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
    <form className={cls.loginForm} onSubmit={onLogin}>
      <h1 className={cls.header}>Authorize</h1>
      <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
      <Input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
      />
      {error && (
        <p role="alert" className={cls.error}>
          {error.message}
        </p>
      )}
      <div className={cls.options}>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting…' : 'Submit'}
        </Button>
        <Button
          onClick={onRegisterModeSwitch}
          type="button"
          mode="secondary"
          disabled={isPending}
        >
          Register
        </Button>
      </div>
    </form>
  );
};
