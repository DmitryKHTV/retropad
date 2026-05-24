import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BoardsModule } from './boards/boards.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import {validateEnv} from "./config/env.validation";
import { StickersModule } from './stickers/stickers.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import {ColumnsModule} from "./columns/columns.module";

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    validate: validateEnv
  }), BoardsModule, PrismaModule, StickersModule, AuthModule, UsersModule, ColumnsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
