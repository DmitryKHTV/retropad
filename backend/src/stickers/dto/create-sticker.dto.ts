import {IsString, IsNotEmpty, MaxLength, IsUUID, IsOptional, IsInt, Min} from 'class-validator';

export class CreateStickerDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    content: string;

    @IsUUID()
    columnId: string;

    @IsString()
    @IsOptional()
    color?: string;

}
