import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardAccessModule } from '../board-access/board-access.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [BoardAccessModule, RealtimeModule],
  controllers: [BoardsController],
  providers: [BoardsService]
})
export class BoardsModule {}
