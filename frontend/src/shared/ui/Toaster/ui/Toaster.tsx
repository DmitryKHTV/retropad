'use client'

import type {CSSProperties} from "react";
import {Toaster as SonnerToaster} from "sonner";
import cls from "./Toaster.module.css";

const VISIBLE_TOASTS = 10;

const theme = {
    fontFamily: 'inherit',
    '--normal-bg': 'var(--surface-card)',
    '--normal-border': 'var(--border-card)',
    '--normal-text': 'var(--text-body)',
    '--error-bg': 'var(--surface-card)',
    '--error-border': 'var(--accent-danger-border)',
    '--error-text': 'var(--accent-danger-fg)',
    '--border-radius': 'var(--border-radius-m)',
} as CSSProperties;

/**
 * The app-wide toast region, themed through Sonner's CSS variables with the
 * design tokens. Toasts collapse into a stack of three layers; hovering expands it to
 * VISIBLE_TOASTS and pauses their timers, the rest wait in the stack until a
 * visible one is dismissed. Mounted once, in the app providers.
 */
export const Toaster = () => (
    <SonnerToaster
        theme="dark"
        position="bottom-right"
        visibleToasts={VISIBLE_TOASTS}
        closeButton
        richColors
        className={cls.toaster}
        style={theme}
    />
);
