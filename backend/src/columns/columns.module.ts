import { Module } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';
import { BoardAccessModule } from '../board-access/board-access.module';

@Module({
  imports: [BoardAccessModule],
  providers: [ColumnsService],
  controllers: [ColumnsController]
})
export class ColumnsModule {}
