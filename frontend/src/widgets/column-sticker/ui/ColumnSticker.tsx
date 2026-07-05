import {EditStickerCard} from "@/features/sticker/edit-sticker";
import {DeleteStickerButton} from "@/features/sticker/delete-sticker";
import {canTouchSticker, type Sticker, StickerCard} from "@/entities/sticker";
import type {EffectiveRole} from "@/shared/api";

type ColumnStickerProps = {
    sticker: Sticker;
    boardId: string;
    myRole: EffectiveRole;
    userId: string;
}

// Without canTouch both slots stay empty and StickerCard falls back
// to its plain read-only rendering (EDITOR looking at someone else's sticker).
export const ColumnSticker = ({sticker, boardId, myRole, userId}: ColumnStickerProps) => {
    const canTouch = canTouchSticker(myRole, userId, sticker.author.id);
    return (
        <StickerCard
            content={sticker.content}
            contentSlot={
                canTouch ? <EditStickerCard id={sticker.id} boardId={boardId} content={sticker.content} /> : undefined
            }
            actions={canTouch ? <DeleteStickerButton boardId={boardId} stickerId={sticker.id} /> : undefined}
        />
    )
}
