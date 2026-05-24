import { Module } from '@nestjs/common';
import { StickersService } from './stickers.service';
import { StickersController } from './stickers.controller';

@Module({
  providers: [StickersService],
  controllers: [StickersController]
})
export class StickersModule {}
