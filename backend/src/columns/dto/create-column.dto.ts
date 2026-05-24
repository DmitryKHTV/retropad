import {IsString, IsNotEmpty, MaxLength, IsUUID, IsInt, Min} from 'class-validator';

export class CreateColumnDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    title: string;

    @IsUUID()
    boardId: string;

    @IsInt()
    @Min(0)
    order: number;
}
