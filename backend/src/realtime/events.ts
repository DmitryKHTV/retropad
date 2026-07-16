// Two independent contracts that must never be merged:
// - dot names = internal event bus (EventEmitter2), private to the backend
// - colon names (WS_*) = wire events sent to browsers, public contract with the frontend
export const BOARD_CHANGED = 'board.changed';

export const WS_BOARD_JOIN = 'board:join';
export const WS_BOARD_CHANGED = 'board:changed';


export interface BoardChangedEvent {
    boardId: string;
    initiatorSocketId?: string;
}