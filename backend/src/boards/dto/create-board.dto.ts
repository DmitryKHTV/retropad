import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateBoardDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title: string;
}