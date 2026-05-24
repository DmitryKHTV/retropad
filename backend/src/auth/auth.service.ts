import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_SALT_ROUNDS = 10;

export interface AccessPayload {
    sub: string;
    email: string;
}

export interface RefreshPayload {
    sub: string;
    jti: string;
}

export interface IssuedTokens {
    accessToken: string;
    accessMaxAgeMs: number;
    refreshToken: string;
    refreshMaxAgeMs: number;
}

export interface TokenContext {
    userAgent?: string;
    ip?: string;
}

@Injectable()
export class AuthService {
    private readonly accessSecret: string;
    private readonly accessExpiresIn: string;
    private readonly refreshSecret: string;
    private readonly refreshExpiresIn: string;

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        config: ConfigService,
    ) {
        this.accessSecret = config.getOrThrow<string>('JWT_SECRET');
        this.accessExpiresIn = config.getOrThrow<string>('JWT_EXPIRES_IN');
        this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
        this.refreshExpiresIn = config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
    }

    async register(email: string, password: string, name: string | undefined, ctx: TokenContext): Promise<{ tokens: IssuedTokens; user: User }> {
        const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        const user = await this.usersService.create({ email, passwordHash, name });
        const tokens = await this.issueTokens(user, ctx);
        return { tokens, user };
    }

    async login(email: string, password: string, ctx: TokenContext): Promise<{ tokens: IssuedTokens; user: User }> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.issueTokens(user, ctx);
        return { tokens, user };
    }

    async refresh(rawRefreshToken: string | undefined, ctx: TokenContext): Promise<IssuedTokens> {
        if (!rawRefreshToken) {
            throw new UnauthorizedException('Missing refresh token');
        }

        let payload: RefreshPayload;
        try {
            payload = await this.jwtService.verifyAsync<RefreshPayload>(rawRefreshToken, {
                secret: this.refreshSecret,
            });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
        if (!stored || stored.userId !== payload.sub) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (stored.expiresAt.getTime() < Date.now()) {
            throw new UnauthorizedException('Refresh token expired');
        }

        const presentedHash = sha256(rawRefreshToken);

        if (stored.revokedAt) {
            await this.prisma.refreshToken.updateMany({
                where: { userId: stored.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
            throw new UnauthorizedException('Refresh token reuse detected');
        }

        if (stored.tokenHash !== presentedHash) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = await this.usersService.findById(stored.userId);
        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }

        const newJti = randomUUID();
        const refreshToken = await this.signRefresh(user.id, newJti);
        const refreshExp = this.expFromJwt(refreshToken);
        const refreshMaxAgeMs = refreshExp - Date.now();

        await this.prisma.$transaction([
            this.prisma.refreshToken.update({
                where: { id: stored.id },
                data: { revokedAt: new Date(), replacedById: newJti },
            }),
            this.prisma.refreshToken.create({
                data: {
                    id: newJti,
                    userId: user.id,
                    tokenHash: sha256(refreshToken),
                    expiresAt: new Date(refreshExp),
                    userAgent: ctx.userAgent ?? null,
                    ip: ctx.ip ?? null,
                },
            }),
        ]);

        const accessToken = await this.signAccess(user);
        const accessMaxAgeMs = this.expFromJwt(accessToken) - Date.now();

        return { accessToken, accessMaxAgeMs, refreshToken, refreshMaxAgeMs };
    }

    async logout(rawRefreshToken: string | undefined): Promise<void> {
        if (!rawRefreshToken) {
            return;
        }
        let payload: RefreshPayload;
        try {
            payload = await this.jwtService.verifyAsync<RefreshPayload>(rawRefreshToken, {
                secret: this.refreshSecret,
            });
        } catch {
            return;
        }
        await this.prisma.refreshToken.updateMany({
            where: { id: payload.jti, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    private async issueTokens(user: User, ctx: TokenContext): Promise<IssuedTokens> {
        const jti = randomUUID();
        const refreshToken = await this.signRefresh(user.id, jti);
        const refreshExp = this.expFromJwt(refreshToken);

        await this.prisma.refreshToken.create({
            data: {
                id: jti,
                userId: user.id,
                tokenHash: sha256(refreshToken),
                expiresAt: new Date(refreshExp),
                userAgent: ctx.userAgent ?? null,
                ip: ctx.ip ?? null,
            },
        });

        const accessToken = await this.signAccess(user);

        return {
            accessToken,
            accessMaxAgeMs: this.expFromJwt(accessToken) - Date.now(),
            refreshToken,
            refreshMaxAgeMs: refreshExp - Date.now(),
        };
    }

    private signAccess(user: User): Promise<string> {
        const payload: AccessPayload = { sub: user.id, email: user.email };
        return this.jwtService.signAsync(payload, {
            secret: this.accessSecret,
            expiresIn: this.accessExpiresIn as unknown as number,
        });
    }

    private signRefresh(userId: string, jti: string): Promise<string> {
        const payload: RefreshPayload = { sub: userId, jti };
        return this.jwtService.signAsync(payload, {
            secret: this.refreshSecret,
            expiresIn: this.refreshExpiresIn as unknown as number,
        });
    }

    private expFromJwt(token: string): number {
        const decoded = this.jwtService.decode(token) as { exp?: number } | null;
        if (!decoded?.exp) {
            throw new Error('Signed JWT missing exp claim');
        }
        return decoded.exp * 1000;
    }
}

function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}
