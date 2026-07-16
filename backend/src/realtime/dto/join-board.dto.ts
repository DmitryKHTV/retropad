import {IsUUID} from 'class-validator';

// A class (not an inline type) so the gateway's ValidationPipe actually runs —
// an inline object type erases to metatype Object and the pipe silently skips it.
export class JoinBoardDto {
    @IsUUID()
    boardId: string;
}
