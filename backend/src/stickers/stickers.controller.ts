import {Body, Controller, Delete, Param, Patch, Post, UseGuards} from '@nestjs/common';
import {StickersService} from "./stickers.service";
import {Sticker} from "@prisma/client";
import {CreateStickerDto, StickerIdParamsDto, UpdateStickerDto} from "./dto";
import {JwtAuthGuard} from "../auth/guards";
import {CurrentUser, type SafeUser} from "../auth/decorators";

@UseGuards(JwtAuthGuard)
@Controller('stickers')
export class StickersController {
    constructor(private readonly stickerService: StickersService) {}

    @Post()
    create(@CurrentUser() user: SafeUser, @Body() createStickerDto: CreateStickerDto): Promise<Sticker> {
        return this.stickerService.create(createStickerDto, user.id);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: SafeUser,
        @Param() params: StickerIdParamsDto,
        @Body() updateStickerDto: UpdateStickerDto,
    ): Promise<Sticker> {
        return this.stickerService.update(params.id, updateStickerDto, user.id);
    }

    @Delete(':id')
    remove(@CurrentUser() user: SafeUser, @Param() params: StickerIdParamsDto): Promise<Sticker> {
        return this.stickerService.remove(params.id, user.id);
    }
}
