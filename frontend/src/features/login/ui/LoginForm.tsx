'use client';

import React, {useState} from 'react';
import {AuthForm} from "@/features/login/ui/AuthForm";
import {RegisterForm} from "@/features/login/ui/RegisterForm";

export const LoginForm = () => {
    const [mode, setMode] = useState<"authorization" | "registration">("authorization");

    return mode === "authorization"
        ? <AuthForm onRegisterModeSwitch={() => setMode("registration")} />
        : <RegisterForm onAuthorizationModeChange={() => setMode("authorization")} />;
};
