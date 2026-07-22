'use client'

import {ColumnCard, type ColumnWithStickers} from "@/entities/column";
import {EditColumnTitle} from "@/features/column/edit-column";
import {DeleteColumnButton} from "@/features/column/delete-column";
import {AddStickerButton} from "@/features/sticker/add-sticker";
import {ColumnSticker} from "@/widgets/column-sticker";
import {canEditBoard, canManageBoard} from "@/shared/lib/permissions";
import type {EffectiveRole} from "@/shared/api";

interface BoardColumnProps {
    column: ColumnWithStickers;
    myRole: EffectiveRole;
    userId: string;
    votesLeft: number;
}

// Column structure (rename/delete/add-sticker) is gated by role. Stickers are
// always rendered through ColumnSticker — even a VIEWER needs it, because voting
// is open to every role; edit/delete slots gate themselves inside it.
export const BoardColumn = ({column, myRole, userId, votesLeft}: BoardColumnProps) => {
    const canEdit = canEditBoard(myRole);
    const isOwner = canManageBoard(myRole);
    return (
        <ColumnCard
            {...column}
            titleSlot={isOwner ? (
                <>
                    <EditColumnTitle id={column.id} boardId={column.boardId} title={column.title} />
                    <DeleteColumnButton boardId={column.boardId} columnId={column.id} />
                </>
            ) : undefined}
            actions={canEdit ? <AddStickerButton columnId={column.id} boardId={column.boardId} /> : undefined}
            renderSticker={(sticker) => (
                <ColumnSticker
                    boardId={column.boardId}
                    sticker={sticker}
                    myRole={myRole}
                    userId={userId}
                    votesLeft={votesLeft}
                />
            )}
        />
    );
};
