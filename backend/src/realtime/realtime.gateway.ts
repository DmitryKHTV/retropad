import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway, WebSocketServer
} from "@nestjs/websockets";
import {parseCookie} from "cookie";
import type {Socket, Server} from "socket.io";
import {ACCESS_TOKEN_COOKIE} from "../auth/cookie.options";
import {JwtService} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";
import {AccessPayload} from "../auth/auth.service";
import {BoardAccessService} from "../board-access/board-access.service";
import {OnEvent} from "@nestjs/event-emitter";
import {BOARD_CHANGED, type BoardChangedEvent, WS_BOARD_CHANGED} from "./events";


@WebSocketGateway({cors: {origin: 'http://localhost:3001', credentials: true}})
export class RealtimeGateway implements OnGatewayConnection {
    @WebSocketServer()
    private server: Server;

    private readonly accessSecret: string;

    constructor(
        private readonly jwtService: JwtService,
        config: ConfigService,
        private readonly boardAccess: BoardAccessService
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

    @SubscribeMessage('board:join')
    async handleJoinBoard(
        @MessageBody() body: { boardId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const user = client.data.user;
        if (!user || typeof body?.boardId !== 'string') return {ok: false};
        try {
            await this.boardAccess.assertCanView(body.boardId, user.id);
        } catch {
            return {ok: false};
        }
        await client.join(`board:${body.boardId}`);
        return {ok: true};
    }

    @OnEvent(BOARD_CHANGED)
    onBoardChanged({boardId, initiatorSocketId}: BoardChangedEvent) {
        this.server
            .to(`board:${boardId}`)
            .except(initiatorSocketId ?? [])
            .emit(WS_BOARD_CHANGED, {boardId});
    }
}
