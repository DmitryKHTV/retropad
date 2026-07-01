'use client'

import { useInlineEdit } from "@/shared/lib/use-inline-edit";
import { Input } from "@/shared/ui";
import { EditManager } from "@/shared/ui/EditManager";
import { useEditColumn } from "../api";
import cls from "./EditColumnTitle.module.css";

interface EditColumnTitleProps {
    id: string;
    boardId: string;
    title: string;
}

export const EditColumnTitle = (props: EditColumnTitleProps) => {
    const { id, boardId, title } = props;

    const { isEditing, value, toggle, close, onChange } = useInlineEdit(title);
    const { mutate: editColumn } = useEditColumn();

    const handleEdit = () => {
        editColumn({ title: value, id, boardId }, { onSuccess: close });
    };

    return (
        <div className={cls.root}>
            {isEditing
                ? <Input defaultValue={value} onChange={onChange} aria-label="Column title" />
                : <p>{title}</p>}
            <EditManager isEditing={isEditing} onEdit={handleEdit} onSwitchMode={toggle} />
        </div>
    );
};
