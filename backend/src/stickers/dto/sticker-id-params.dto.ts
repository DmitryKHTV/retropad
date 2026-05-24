import {IsUUID} from "class-validator";

export class StickerIdParamsDto {
    @IsUUID()
    id: string;
}
