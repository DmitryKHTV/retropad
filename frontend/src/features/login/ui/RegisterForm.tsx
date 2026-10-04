'use client';

import React, { useState } from 'react';
import cls from '@/features/login/ui/LoginForm.module.css';
import { Button, Input } from '@/shared/ui';
import { useRegister } from '@/features/login/api';
import { RegisterDto } from '@/features/login/model/types';

type RegisterFormProps = {
  onAuthorizationModeChange: () => void;
};

export const RegisterForm = ({ onAuthorizationModeChange }: RegisterFormProps) => {
  const { mutate, isPending, error } = useRegister();
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const password = formData.get('password')?.toString() ?? '';
    const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);

    const dto: RegisterDto = {
      email: formData.get('email')?.toString() ?? '',
      password,
      name: formData.get('name')?.toString().trim() || undefined,
    };
    mutate(dto);
  };

  const message = passwordMismatch
    ? "Passwords don't match"
    : error?.message ?? null;

  return (
    <>
      <form className={cls.loginForm} onSubmit={onSubmit} data-testid="register-form">
        <h1 className={cls.header}>Create your account</h1>
        <Input
          label="Name (optional)"
          name="name"
          type="text"
          placeholder="How your team sees you"
          autoComplete="name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {message && (
          <p role="alert" className={cls.error}>
            {message}
          </p>
        )}
        <Button
          intent="primary"
          type="submit"
          disabled={isPending}
          className={cls.submit}
          data-testid="register-submit"
        >
          {isPending ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
      <p className={cls.switchMode}>
        Already have an account?{' '}
        <button
          type="button"
          className={cls.switchLink}
          onClick={onAuthorizationModeChange}
          disabled={isPending}
          data-testid="login-mode"
        >
          Log in
        </button>
      </p>
    </>
  );
};
