import { Module } from '@nestjs/common';
import { StickersService } from './stickers.service';
import { StickersController } from './stickers.controller';
import { BoardAccessModule } from '../board-access/board-access.module';

@Module({
  imports: [BoardAccessModule],
  providers: [StickersService],
  controllers: [StickersController]
})
export class StickersModule {}
