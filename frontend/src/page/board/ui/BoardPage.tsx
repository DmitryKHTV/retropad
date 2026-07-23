'use client'

import {useState} from "react";
import {useBoard, useBoardChangesWs} from "@/entities/board";
import cls from "./BoardPage.module.css";
import {
    DndContext,
    DragOverlay,
    type DragEndEvent,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import {SortableContext, horizontalListSortingStrategy} from '@dnd-kit/sortable';
import {SortableColumn, useReorderColumn} from "@/features/column/reorder-column";
import {AddColumnButton} from "@/features/column/add-column";
import {EditBoardTitle} from "@/features/board/edit-board";
import {BoardColumn} from "@/widgets/board-column";
import {BoardMembersPanel} from "@/widgets/board-members";
import {VotesBudget} from "@/features/sticker/vote-sticker";
import {SortByVotesToggle, useSortByVotes, sortStickersByVotes} from "@/features/sticker/sort-by-votes";
import {useMe} from "@/entities/user";
import {canManageBoard} from "@/shared/lib/permissions";

interface BoardPageProps {
    id: string;
}

export const BoardPage = (props: BoardPageProps) => {
    const {id} = props;
    const {data: boardData} = useBoard(id);
    const {data: me} = useMe();
    useBoardChangesWs(id);
    const reorderMutation = useReorderColumn();

    const [activeId, setActiveId] = useState<string | null>(null);
    const sortByVotes = useSortByVotes();

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
    );

    if (!boardData || !me) return null;

    const isOwner = canManageBoard(boardData.myRole);
    // View-only re-rank; the persisted sticker `order` is never touched.
    const columns = sortByVotes.active
        ? boardData.columns.map((c) => ({...c, stickers: sortStickersByVotes(c.stickers)}))
        : boardData.columns;
    const columnIds = columns.map((c) => c.id);
    const activeColumn = columns.find((c) => c.id === activeId) ?? null;

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
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
            <div className={cls.header}>
                {isOwner
                    ? <EditBoardTitle id={boardData.id} title={boardData.title} />
                    : <h1 className={cls.plainTitle}>{boardData.title}</h1>}
                <VotesBudget left={boardData.myVotes.left} max={boardData.myVotes.max} />
                <SortByVotesToggle active={sortByVotes.active} onToggle={sortByVotes.toggle} />
                <BoardMembersPanel boardId={id} myRole={boardData.myRole} />
            </div>
            {isOwner && <AddColumnButton boardId={id} order={columns.length} />}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                    <div className={cls.columnsWrapper}>
                        {columns.map((column) => (
                            <SortableColumn key={`column-${column.id}`} id={column.id} disabled={!isOwner}>
                                <BoardColumn column={column} myRole={boardData.myRole} userId={me.id} votesLeft={boardData.myVotes.left} />
                            </SortableColumn>
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                    {activeColumn ? <BoardColumn column={activeColumn} myRole={boardData.myRole} userId={me.id} votesLeft={boardData.myVotes.left} /> : null}
                </DragOverlay>
            </DndContext>
        </main>
    );
};
