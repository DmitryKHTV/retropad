import {IsUUID} from "class-validator";

export class FindBoardParamsDto {
    @IsUUID()
    id: string;
}