import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import {VotesController} from "./votes.controller";
import {BoardAccessModule} from "../board-access/board-access.module";
import {RealtimeModule} from "../realtime/realtime.module";

@Module({
  imports: [BoardAccessModule, RealtimeModule],
  providers: [VotesService],
  controllers: [VotesController],
})
export class VotesModule {}
