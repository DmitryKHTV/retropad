import { Module } from '@nestjs/common';
import {RealtimeGateway} from "./realtime.gateway";
import {JwtModule} from "@nestjs/jwt";
import {BoardAccessModule} from "../board-access/board-access.module";
import {BoardEventsService} from "./board-events.service";

@Module({
    providers: [RealtimeGateway, BoardEventsService],
    imports: [JwtModule.register({}), BoardAccessModule],
    exports: [BoardEventsService],
})
export class RealtimeModule {}
