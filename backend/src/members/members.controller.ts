import {Body, Controller, Delete, Get, Param, Patch, Post, UseGuards} from '@nestjs/common';
import {MembersService} from "./members.service";
import {AddMemberDto, BoardMembersParamsDto, MemberParamsDto, UpdateMemberDto} from "./dto";
import {JwtAuthGuard} from "../auth/guards";
import {CurrentUser, type SafeUser} from "../auth/decorators";

@UseGuards(JwtAuthGuard)
@Controller('boards/:boardId/members')
export class MembersController {
    constructor(private readonly membersService: MembersService) {}

    @Get()
    findAll(@CurrentUser() user: SafeUser, @Param() params: BoardMembersParamsDto) {
        return this.membersService.findAll(params.boardId, user.id);
    }

    @Post()
    add(@CurrentUser() user: SafeUser, @Param() params: BoardMembersParamsDto, @Body() dto: AddMemberDto) {
        return this.membersService.add(params.boardId, user.id, dto);
    }

    @Patch(':userId')
    updateRole(@CurrentUser() user: SafeUser, @Param() params: MemberParamsDto, @Body() dto: UpdateMemberDto) {
        return this.membersService.updateRole(params.boardId, params.userId, user.id, dto);
    }

    @Delete(':userId')
    remove(@CurrentUser() user: SafeUser, @Param() params: MemberParamsDto) {
        return this.membersService.remove(params.boardId, params.userId, user.id);
    }
}
