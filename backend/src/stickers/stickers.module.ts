import { Module } from '@nestjs/common';
import { StickersService } from './stickers.service';
import { StickersController } from './stickers.controller';
import { BoardAccessModule } from '../board-access/board-access.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [BoardAccessModule, RealtimeModule],
  providers: [StickersService],
  controllers: [StickersController]
})
export class StickersModule {}
