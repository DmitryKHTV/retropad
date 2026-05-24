'use client'

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column } from '@/entities/column/ui/Column';
import type { ColumnWithStickers } from '@/entities/column';
import cls from './SortableColumn.module.css';

interface SortableColumnProps {
    column: ColumnWithStickers;
}

export const SortableColumn = ({ column }: SortableColumnProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={cls.wrapper} {...attributes} {...listeners}>
            <Column {...column} />
        </div>
    );
};
