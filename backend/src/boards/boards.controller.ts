import {Body, Controller, Delete, Get, Param, Patch, Post, UseGuards} from '@nestjs/common';
import {BoardsService} from "./boards.service";
import {CreateBoardDto, FindBoardParamsDto, UpdateBoardDto} from "./dto";
import {JwtAuthGuard} from "../auth/guards";
import {CurrentUser, type SafeUser} from "../auth/decorators";

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
    constructor(private readonly boardsService: BoardsService) {}

    @Get()
    findAll(@CurrentUser() user: SafeUser) {
        return this.boardsService.findAllByOwner(user.id);
    }

    @Get(':id')
    findOne(@CurrentUser() user: SafeUser, @Param() params: FindBoardParamsDto) {
        return this.boardsService.findOne(params.id, user.id);
    }

    @Post()
    create(@CurrentUser() user: SafeUser, @Body() dto: CreateBoardDto) {
        return this.boardsService.create(dto.title, user.id);
    }

    @Patch(':id')
    update(@CurrentUser() user: SafeUser, @Param() params: FindBoardParamsDto, @Body() dto: UpdateBoardDto) {
        return this.boardsService.update(params.id, user.id, dto);
    }

    @Delete(':id')
    remove(@CurrentUser() user: SafeUser, @Param() params: FindBoardParamsDto) {
        return this.boardsService.remove(params.id, user.id);
    }
}
