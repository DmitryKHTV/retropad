import {IsInt, IsOptional, IsString, IsUUID, MaxLength, Min} from "class-validator";

export class UpdateColumnDto{
    @IsString()
    @IsOptional()
    @MaxLength(500)
    title?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;
}

export class UpdateColumnIdDto {
    @IsUUID()
    id: string;
}