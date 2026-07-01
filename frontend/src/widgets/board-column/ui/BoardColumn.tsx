'use client'

import {ColumnCard, type ColumnWithStickers} from "@/entities/column";
import {StickerCard} from "@/entities/sticker";
import {EditColumnTitle} from "@/features/column/edit-column";
import {DeleteColumnButton} from "@/features/column/delete-column";
import {AddStickerButton} from "@/features/sticker/add-sticker";
import {EditStickerCard} from "@/features/sticker/edit-sticker";
import {DeleteStickerButton} from "@/features/sticker/delete-sticker";

interface BoardColumnProps {
    column: ColumnWithStickers;
}

export const BoardColumn = ({column}: BoardColumnProps) => {
    return (
        <ColumnCard
            {...column}
            titleSlot={
                <>
                    <EditColumnTitle id={column.id} boardId={column.boardId} title={column.title} />
                    <DeleteColumnButton boardId={column.boardId} columnId={column.id} />
                </>
            }
            actions={<AddStickerButton columnId={column.id} boardId={column.boardId} />}
            renderSticker={(sticker) => (
                <StickerCard
                    content={sticker.content}
                    contentSlot={
                        <EditStickerCard id={sticker.id} boardId={column.boardId} content={sticker.content} />
                    }
                    actions={<DeleteStickerButton boardId={column.boardId} stickerId={sticker.id} />}
                />
            )}
        />
    );
};
