import {IsUUID} from "class-validator";
import {BoardMembersParamsDto} from "./board-members-params.dto";

export class MemberParamsDto extends BoardMembersParamsDto {
    @IsUUID()
    userId: string;
}
