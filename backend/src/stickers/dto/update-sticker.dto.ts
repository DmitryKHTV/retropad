import {IsString, IsNotEmpty, MaxLength, IsUUID, IsOptional, IsInt, Min} from 'class-validator';

export class UpdateStickerDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    content?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsUUID()
    columnId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;
}
