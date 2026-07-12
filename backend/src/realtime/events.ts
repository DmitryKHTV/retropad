export const BOARD_CHANGED = 'board.changed';
export const WS_BOARD_CHANGED = 'board.changed';


export interface BoardChangedEvent {
    boardId: string;
    initiatorSocketId?: string;
}