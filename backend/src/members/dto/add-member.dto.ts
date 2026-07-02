import {IsEmail, IsEnum, IsOptional} from "class-validator";
import {BoardRole} from "@prisma/client";

export class AddMemberDto {
    @IsEmail()
    email: string;

    @IsEnum(BoardRole)
    @IsOptional()
    role?: BoardRole;
}
