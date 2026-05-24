import {Sticker} from "@/entities/sticker";

export interface Column {
    id: string;
    title: string;
    order: number;
    boardId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ColumnWithStickers extends Column {
    stickers: Sticker[];
}
