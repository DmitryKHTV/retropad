'use client'

import {useBoards} from "@/entities/board/api";
import {BoardCard} from "@/entities/board/ui/BoardCard";
import {describeApiError} from "@/shared/lib/describe-api-error";
import {Button, StatusMessage} from "@/shared/ui";
import cls from "./BoardsList.module.css";


export const BoardsList = () => {
    const {data, isPending, isError, error, refetch, isFetching} = useBoards();

    if (isError) {
        return (
            <StatusMessage
                tone="error"
                title={describeApiError(error)}
                hint="Your boards are still there — this is only the list that failed to load."
                actions={
                    <Button intent="primary" onClick={() => void refetch()} disabled={isFetching}>
                        {isFetching ? 'Retrying…' : 'Try again'}
                    </Button>
                }
            />
        );
    }

    if (isPending) {
        return <StatusMessage title="Loading your boards…"/>
    }

    return (
        <div className={cls.boardsList}>
            {data && data?.length > 0 ? data?.map((boardData) => <BoardCard key={`board-${boardData.id}`} {...boardData}/>) : <h2>No boards found</h2> }
        </div>
    )
}
