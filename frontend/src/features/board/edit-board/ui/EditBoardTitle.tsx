'use client'

import { useInlineEdit } from '@/shared/lib/use-inline-edit';
import { Input } from '@/shared/ui';
import { EditManager } from '@/shared/ui/EditManager';
import { useEditBoard } from '../api';
import cls from './EditBoardTitle.module.css';

interface EditBoardTitleProps {
    id: string;
    title: string;
}

export const EditBoardTitle = (props: EditBoardTitleProps) => {
    const { id, title } = props;

    const { isEditing, value, toggle, close, onChange } = useInlineEdit(title);
    const { mutate: editBoard } = useEditBoard();

    const handleSave = () => {
        editBoard({ id, title: value }, { onSuccess: close });
    };

    return (
        <div className={cls.root}>
            {isEditing
                ? <Input defaultValue={value} onChange={onChange} aria-label="Board title" />
                : <h1 className={cls.title}>{title}</h1>}
            <EditManager isEditing={isEditing} onEdit={handleSave} onSwitchMode={toggle} />
        </div>
    );
};
