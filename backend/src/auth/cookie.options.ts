import { CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const REFRESH_COOKIE_PATH = '/auth';

function baseCookieOptions(config: ConfigService): CookieOptions {
    const isProd = config.get<string>('NODE_ENV') === 'production';
    const domain = config.get<string>('COOKIE_DOMAIN');

    return {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        ...(domain ? { domain } : {}),
    };
}

export function accessCookieOptions(config: ConfigService, maxAgeMs: number): CookieOptions {
    return {
        ...baseCookieOptions(config),
        path: '/',
        maxAge: maxAgeMs,
    };
}

export function refreshCookieOptions(config: ConfigService, maxAgeMs: number): CookieOptions {
    return {
        ...baseCookieOptions(config),
        path: REFRESH_COOKIE_PATH,
        maxAge: maxAgeMs,
    };
}

export function clearAccessCookieOptions(config: ConfigService): CookieOptions {
    return {
        ...baseCookieOptions(config),
        path: '/',
    };
}

export function clearRefreshCookieOptions(config: ConfigService): CookieOptions {
    return {
        ...baseCookieOptions(config),
        path: REFRESH_COOKIE_PATH,
    };
}
