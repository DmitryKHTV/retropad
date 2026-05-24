import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, IssuedTokens } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import type { SafeUser } from './decorators';
import {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    accessCookieOptions,
    clearAccessCookieOptions,
    clearRefreshCookieOptions,
    refreshCookieOptions,
} from './cookie.options';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly config: ConfigService,
    ) {}

    @Post('register')
    async register(
        @Body() dto: RegisterDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ user: SafeUser }> {
        const { tokens, user } = await this.authService.register(
            dto.email,
            dto.password,
            dto.name,
            this.contextFromRequest(req),
        );
        this.setAuthCookies(res, tokens);
        const { passwordHash: _ph, ...safeUser } = user;
        return { user: safeUser };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ user: SafeUser }> {
        const { tokens, user } = await this.authService.login(
            dto.email,
            dto.password,
            this.contextFromRequest(req),
        );
        this.setAuthCookies(res, tokens);
        const { passwordHash: _ph, ...safeUser } = user;
        return { user: safeUser };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ ok: true }> {
        const raw = readRefreshCookie(req);
        const tokens = await this.authService.refresh(raw, this.contextFromRequest(req));
        this.setAuthCookies(res, tokens);
        return { ok: true };
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<void> {
        const raw = readRefreshCookie(req);
        await this.authService.logout(raw);
        res.clearCookie(ACCESS_TOKEN_COOKIE, clearAccessCookieOptions(this.config));
        res.clearCookie(REFRESH_TOKEN_COOKIE, clearRefreshCookieOptions(this.config));
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@CurrentUser() user: SafeUser): SafeUser {
        return user;
    }

    private setAuthCookies(res: Response, tokens: IssuedTokens): void {
        res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessCookieOptions(this.config, tokens.accessMaxAgeMs));
        res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions(this.config, tokens.refreshMaxAgeMs));
    }

    private contextFromRequest(req: Request): { userAgent?: string; ip?: string } {
        return {
            userAgent: req.headers['user-agent'],
            ip: req.ip,
        };
    }
}

function readRefreshCookie(req: Request): string | undefined {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.[REFRESH_TOKEN_COOKIE];
}
