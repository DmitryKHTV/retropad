import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import { refreshSession } from '../refresh';
import type { ClientToServerEvents, ServerToClientEvents } from './events';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | undefined;

let triedRefresh = false;

export function getSocket(): AppSocket {
  if (socket) return socket;

  const created: AppSocket = io(API_BASE_URL, {
    autoConnect: false,
    withCredentials: true,
  });

  created.on('connect', () => {
    triedRefresh = false;
  });

  created.on('connect_error', (error) => {
    if (error.message !== 'Unauthorized') return;
    if (triedRefresh) {
      created.disconnect();
      return;
    }
    triedRefresh = true;
    refreshSession()
      .then(() => created.connect())
      .catch(() => {
        created.disconnect();
      });
  });

  socket = created;
  return socket;
}

export function getSocketId(): string | undefined {
  return socket?.connected ? socket.id : undefined;
}
