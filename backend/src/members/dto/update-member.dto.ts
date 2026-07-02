import {IsEnum} from "class-validator";
import {BoardRole} from "@prisma/client";

export class UpdateMemberDto {
    @IsEnum(BoardRole)
    role: BoardRole;
}
