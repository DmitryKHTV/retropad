'use client'

import {useBoard} from "@/entities/board";
import cls from "./BoardPage.module.css";
import {
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import {SortableContext, horizontalListSortingStrategy} from '@dnd-kit/sortable';
import {SortableColumn, useReorderColumn} from "@/features/column/reorder-column";

interface BoardPageProps {
    id: string;
}

export const BoardPage = (props: BoardPageProps) => {
    const {id} = props;
    const {data: boardData} = useBoard(id);
    const reorderMutation = useReorderColumn();

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
    );

    if (!boardData) return null;

    const columns = boardData.columns;
    const columnIds = columns.map((c) => c.id);

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;

        const oldIndex = columns.findIndex((c) => c.id === active.id);
        const newIndex = columns.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        reorderMutation.mutate({
            boardId: id,
            columnId: String(active.id),
            newOrder: newIndex,
        });
    };

    return (
        <main className={cls.wrapper}>
            <h1 className={cls.title}>{boardData.title}</h1>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                    <div className={cls.columnsWrapper}>
                        {columns.map((column) => (
                            <SortableColumn key={`column-${column.id}`} column={column} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </main>
    );
};
