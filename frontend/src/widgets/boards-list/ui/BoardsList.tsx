'use client'

import {useBoards} from "@/entities/board/api";
import {BoardCard} from "@/entities/board/ui/BoardCard";
import cls from "./BoardsList.module.css";


export const BoardsList = () => {
    const {data, isPending} = useBoards();

    if (isPending) {
        return <h2>Loading...</h2>
    }

    return (
        <div className={cls.boardsList}>
            {data && data?.length > 0 ? data?.map((boardData) => <BoardCard key={`board-${boardData.id}`} {...boardData}/>) : <h2>No boards found</h2> }
        </div>
    )
}