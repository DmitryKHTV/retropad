import { Injectable, ConflictException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async create(data: { email: string; passwordHash: string; name?: string }): Promise<User> {
        const existing = await this.findByEmail(data.email);
        if (existing) {
            throw new ConflictException('User with this email already exists');
        }

        return this.prisma.user.create({ data });
    }
}