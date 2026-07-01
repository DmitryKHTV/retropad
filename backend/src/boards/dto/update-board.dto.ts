import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBoardDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @IsOptional()
    title?: string;
}
