'use client'

import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import cls from './SortableColumn.module.css';

interface SortableColumnProps {
    id: string;
    children: ReactNode;
    disabled?: boolean;
}

export const SortableColumn = ({ id, children, disabled = false }: SortableColumnProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={cls.wrapper} {...attributes} {...listeners}>
            {children}
        </div>
    );
};
