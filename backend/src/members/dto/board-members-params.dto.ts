import {IsUUID} from "class-validator";

export class BoardMembersParamsDto {
    @IsUUID()
    boardId: string;
}
