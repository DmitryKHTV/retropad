import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import type {Request} from 'express';

export const SOCKET_ID_HEADER = 'x-socket-id';

// The client's own socket.io id, sent with HTTP mutations so the gateway can
// skip echoing the change back to its initiator. Echo suppression only —
// never use it for authorization: the client can put anything here.
export const SocketId = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string | undefined => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const value = request.headers[SOCKET_ID_HEADER];
        return typeof value === 'string' && value !== '' ? value : undefined;
    },
);
