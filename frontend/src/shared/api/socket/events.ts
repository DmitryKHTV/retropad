import type { Socket } from 'socket.io-client';

export interface BoardChangedPayload {
  boardId: string;
}

export interface JoinBoardPayload {
  boardId: string;
}

export interface JoinBoardAck {
  ok: boolean;
}

export interface ServerToClientEvents {
  'board:changed': (payload: BoardChangedPayload) => void;
}

export interface ClientToServerEvents {
  'board:join': (payload: JoinBoardPayload, ack: (res: JoinBoardAck) => void) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
