import {IsUUID} from "class-validator";

export class VoteDto {
    @IsUUID()
    stickerId: string;
}