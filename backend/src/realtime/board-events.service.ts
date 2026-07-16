import {Injectable} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import {BOARD_CHANGED, BoardChangedEvent} from './events';

// The only place allowed to emit bus events — EventEmitter2.emit(string, ...any[])
// is untyped, so every emitter goes through this typed facade instead.
@Injectable()
export class BoardEventsService {
    constructor(private readonly eventEmitter: EventEmitter2) {}

    boardChanged(boardId: string, initiatorSocketId?: string): void {
        const event: BoardChangedEvent = {boardId, initiatorSocketId};
        this.eventEmitter.emit(BOARD_CHANGED, event);
    }
}
