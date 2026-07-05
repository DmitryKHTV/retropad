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
}

// Empty slots make the entity cards fall back to their plain read-only
// rendering. Column structure (rename/delete) is OWNER-only; sticker slots
// go to anyone who can edit, with per-sticker gating inside ColumnSticker.
export const BoardColumn = ({column, myRole, userId}: BoardColumnProps) => {
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
            renderSticker={canEdit ? (sticker) => (
                <ColumnSticker boardId={column.boardId} sticker={sticker} myRole={myRole} userId={userId} />
            ) : undefined}
        />
    );
};
