'use client'

import { useInlineEdit } from "@/shared/lib/use-inline-edit";
import { EditManager } from "@/shared/ui/EditManager";
import { useEditSticker } from "../api";
import cls from "./EditStickerCard.module.css";

interface EditStickerCardProps {
    id: string;
    boardId: string;
    content: string;
}

export const EditStickerCard = (props: EditStickerCardProps) => {
    const { id, boardId, content } = props;

    const { isEditing, value, toggle, close, onChange } = useInlineEdit(content);
    const { mutate: editSticker } = useEditSticker();

    const handleEdit = () => {
        // Skip the request when nothing changed — just leave edit mode.
        if (value === content) {
            close();
            return;
        }
        editSticker({ content: value, id, boardId }, { onSuccess: close });
    };

    return (
        <div className={cls.root}>
            {isEditing
                ? <textarea className={cls.content} defaultValue={value} onChange={onChange} aria-label="Sticker content" />
                : <p className={cls.content}>{content}</p>}
            <EditManager isEditing={isEditing} onEdit={handleEdit} onSwitchMode={toggle} />
        </div>
    );
};
