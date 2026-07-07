import {OnGatewayConnection, WebSocketGateway} from "@nestjs/websockets";
import {parseCookie} from "cookie";
import type {Socket} from "socket.io";
import {ACCESS_TOKEN_COOKIE} from "../auth/cookie.options";
import {JwtService} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";
import {AccessPayload} from "../auth/auth.service";
@WebSocketGateway({cors: {origin: 'http://localhost:3001', credentials: true}})
export class RealtimeGateway implements OnGatewayConnection {
    private readonly accessSecret: string;

    constructor(
        private readonly jwtService: JwtService,
        config: ConfigService,
    ) {
        this.accessSecret = config.getOrThrow<string>('JWT_SECRET');
    }

    async handleConnection(client: Socket) {
        const cookiesStore = parseCookie(client.handshake.headers.cookie ?? '');
        const access_token = cookiesStore[ACCESS_TOKEN_COOKIE];
        if (!access_token) {
            client.disconnect(true);
            return;
        }

        try {
            const payload = await this.jwtService.verifyAsync<AccessPayload>(access_token, {
                secret: this.accessSecret,
            });
            client.data.user = {id: payload.sub, email: payload.email};
        } catch {
            client.disconnect(true);
        }
    }
}