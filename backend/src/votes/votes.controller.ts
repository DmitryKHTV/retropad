import {Controller, Delete, Param, Post, UseGuards} from '@nestjs/common';
import {VotesService} from "./votes.service";
import {Vote} from "@prisma/client";
import {JwtAuthGuard} from "../auth/guards";
import {CurrentUser, type SafeUser} from "../auth/decorators";
import {SocketId} from "../realtime/socket-id.decorator";
import {VoteDto} from "./dto";

@UseGuards(JwtAuthGuard)
@Controller('stickers/:stickerId/votes')
export class VotesController {
    constructor(private readonly votesService: VotesService) {}

    @Post()
    create(@Param() params: VoteDto, @CurrentUser() user: SafeUser, @SocketId() socket?: string): Promise<Vote> {
        return this.votesService.addVote(params.stickerId, user.id, socket);
    }

    @Delete()
    remove(@Param() params: VoteDto, @CurrentUser() user: SafeUser, @SocketId() socket?: string): Promise<Vote> {
        return this.votesService.removeVote(params.stickerId, user.id, socket);
    }
}

