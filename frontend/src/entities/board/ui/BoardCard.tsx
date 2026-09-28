import type {BoardSummary} from "@/entities/board/model";
import cls from "./Board.module.css";
import {DeleteBoardButton} from "@/features/board/delete-board/ui/DeleteBoardButton";
import {canManageBoard} from "@/shared/lib/permissions";
import {formatDateTime} from "@/shared/lib/format-date";
import Link from "next/link";

const MAX_COLUMNS = 5;

export const BoardCard = (props: BoardSummary) => {
    const {title, updatedAt, id, myRole, columnsCount, stickersCount} = props;

    return (
        <Link href={`/board/${id}`} className={cls.wrapper}>
            <div className={cls.title}>
                <p>{title}</p>
                {canManageBoard(myRole)
                    ? <DeleteBoardButton id={id}/>
                    : <span className={cls.roleBadge}>{myRole}</span>}
            </div>
            <div className={cls.columns}>
                {
                    Array.from({length: Math.min(columnsCount, MAX_COLUMNS)}).map((_, i) => <div key={`column-${i}`}
                                                                                                 className={cls.columnLine}/>)}
                {columnsCount > MAX_COLUMNS ? `+${columnsCount - MAX_COLUMNS}` : null}
            </div>
            <div className={cls.boardSummary}>
                <p>columns: {columnsCount}</p>
                <p>stickers: {stickersCount}</p>
            </div>
            <time className={cls.date} dateTime={updatedAt}>{formatDateTime(updatedAt)}</time>
        </Link>
    )
}
