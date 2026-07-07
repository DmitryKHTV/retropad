import { Module } from '@nestjs/common';
import {RealtimeGateway} from "./realtime.gateway";
import {JwtModule} from "@nestjs/jwt";

@Module({
    providers: [RealtimeGateway],
    imports: [JwtModule.register({})],
})
export class RealtimeModule {}
