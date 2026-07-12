import { Module } from '@nestjs/common';
import {RealtimeGateway} from "./realtime.gateway";
import {JwtModule} from "@nestjs/jwt";
import {BoardAccessModule} from "../board-access/board-access.module";

@Module({
    providers: [RealtimeGateway],
    imports: [JwtModule.register({}), BoardAccessModule],
})
export class RealtimeModule {}
