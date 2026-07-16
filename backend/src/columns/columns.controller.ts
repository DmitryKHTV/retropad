import {Body, Controller, Delete, Get, Param, Patch, Post, UseGuards} from '@nestjs/common';
import {ColumnsService} from "./columns.service";
import {Column} from "@prisma/client";
import {CreateColumnDto, FindAllByBoardDto, UpdateColumnDto, UpdateColumnIdDto} from "./dto";
import {JwtAuthGuard} from "../auth/guards";
import {CurrentUser, type SafeUser} from "../auth/decorators";
import {SocketId} from "../realtime/socket-id.decorator";

@UseGuards(JwtAuthGuard)
@Controller('columns')
export class ColumnsController {
    constructor(private readonly columnsService: ColumnsService) {}

    @Post()
    create(@CurrentUser() user: SafeUser, @Body() createColumnDto: CreateColumnDto, @SocketId() socketId?: string): Promise<Column> {
        return this.columnsService.create(createColumnDto, user.id, socketId);
    }

    @Get('board/:boardId')
    findAllByBoard(@CurrentUser() user: SafeUser, @Param() dto: FindAllByBoardDto): Promise<Column[]> {
        return this.columnsService.findAllByBoard(dto.boardId, user.id);
    }

    @Patch(':id')
    update(@CurrentUser() user: SafeUser, @Body() dto: UpdateColumnDto, @Param() idDto: UpdateColumnIdDto, @SocketId() socketId?: string): Promise<Column> {
        return this.columnsService.update(dto, user.id, idDto.id, socketId);
    }

    @Delete(':id')
    remove(@CurrentUser() user: SafeUser, @Param() idDto: UpdateColumnIdDto, @SocketId() socketId?: string): Promise<Column> {
        return this.columnsService.remove(idDto.id, user.id, socketId);
    }
}
