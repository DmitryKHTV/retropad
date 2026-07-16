import {UsePipes, ValidationPipe} from "@nestjs/common";
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway, WebSocketServer,
    WsException
} from "@nestjs/websockets";
import {parseCookie} from "cookie";
import type {Socket, Server} from "socket.io";
import {ACCESS_TOKEN_COOKIE} from "../auth/cookie.options";
import {JwtService} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";
import {AccessPayload} from "../auth/auth.service";
import {BoardAccessService} from "../board-access/board-access.service";
import {OnEvent} from "@nestjs/event-emitter";
import {BOARD_CHANGED, type BoardChangedEvent, WS_BOARD_CHANGED, WS_BOARD_JOIN} from "./events";
import {JoinBoardDto} from "./dto";

export interface SocketUser {
    id: string;
    email: string;
}

// Global pipes from app.useGlobalPipes() never reach gateways — SocketModule
// constructs its PipesContextCreator without the ApplicationConfig, so the
// global list resolves to []. Every gateway must therefore declare its own pipe.
// exceptionFactory throws WsException instead of BadRequestException: HTTP
// exceptions are "unknown" to the WS filter and would reach the client as an
// opaque 'Internal server error'.
@UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: () => new WsException('Validation failed'),
}))
@WebSocketGateway({cors: {origin: 'http://localhost:3001', credentials: true}})
export class RealtimeGateway implements OnGatewayInit {
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

    // Auth lives in a socket.io middleware, not handleConnection: middlewares run
    // to completion BEFORE the connection is accepted and any client packet is
    // processed, so message handlers may rely on client.data.user being set.
    // handleConnection fires after the connection is already live — the moment it
    // awaits real I/O, a fast client packet can race past it.
    afterInit(server: Server) {
        server.use(async (socket, next) => {
            const cookies = parseCookie(socket.handshake.headers.cookie ?? '');
            const accessToken = cookies[ACCESS_TOKEN_COOKIE];
            if (!accessToken) {
                return next(new Error('Unauthorized'));
            }
            try {
                const payload = await this.jwtService.verifyAsync<AccessPayload>(accessToken, {
                    secret: this.accessSecret,
                });
                const user: SocketUser = {id: payload.sub, email: payload.email};
                socket.data.user = user;
                next();
            } catch {
                next(new Error('Unauthorized'));
            }
        });
    }

    @SubscribeMessage(WS_BOARD_JOIN)
    async handleJoinBoard(
        @MessageBody() dto: JoinBoardDto,
        @ConnectedSocket() client: Socket,
    ) {
        const user = client.data.user as SocketUser;
        try {
            await this.boardAccess.assertCanView(dto.boardId, user.id);
        } catch {
            return {ok: false};
        }
        await client.join(`board:${dto.boardId}`);
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
