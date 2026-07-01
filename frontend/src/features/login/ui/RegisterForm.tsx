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
    <form className={cls.loginForm} onSubmit={onSubmit}>
      <h1 className={cls.header}>Registration</h1>
      <Input name="name" type="text" placeholder="Name" autoComplete="name" />
      <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
      <Input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <Input
        name="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      {message && (
        <p role="alert" className={cls.error}>
          {message}
        </p>
      )}
      <div className={cls.options}>
        <Button intent="primary" type="submit" disabled={isPending}>
          {isPending ? 'Registering…' : 'Register'}
        </Button>
        <Button
          onClick={onAuthorizationModeChange}
          type="button"
          disabled={isPending}
        >
          Authorize
        </Button>
      </div>
    </form>
  );
};
