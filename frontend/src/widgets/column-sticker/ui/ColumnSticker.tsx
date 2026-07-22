import {EditStickerCard} from "@/features/sticker/edit-sticker";
import {DeleteStickerButton} from "@/features/sticker/delete-sticker";
import {VoteControl} from "@/features/sticker/vote-sticker";
import {canTouchSticker, type StickerWithVotes, StickerCard} from "@/entities/sticker";
import type {EffectiveRole} from "@/shared/api";

type ColumnStickerProps = {
    sticker: StickerWithVotes;
    boardId: string;
    myRole: EffectiveRole;
    userId: string;
    votesLeft: number;
}

// Edit/delete slots are gated by canTouch (EDITOR touches only own, OWNER all);
// voting is NOT gated — any role incl. VIEWER may vote, so the vote control is
// always rendered. Without canTouch the edit/delete slots fall back to plain text.
export const ColumnSticker = ({sticker, boardId, myRole, userId, votesLeft}: ColumnStickerProps) => {
    const canTouch = canTouchSticker(myRole, userId, sticker.author.id);
    return (
        <StickerCard
            content={sticker.content}
            author={sticker.author}
            contentSlot={
                canTouch ? <EditStickerCard id={sticker.id} boardId={boardId} content={sticker.content} /> : undefined
            }
            actions={canTouch ? <DeleteStickerButton boardId={boardId} stickerId={sticker.id} /> : undefined}
            votesSlot={
                <VoteControl
                    stickerId={sticker.id}
                    boardId={boardId}
                    total={sticker.votes.total}
                    mine={sticker.votes.mine}
                    canAddMore={votesLeft > 0}
                />
            }
        />
    )
}
