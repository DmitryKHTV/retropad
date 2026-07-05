import type {Board} from "@/entities/board/model";
import cls from "./Board.module.css";
import {DeleteBoardButton} from "@/features/board/delete-board/ui/DeleteBoardButton";
import {canManageBoard} from "@/shared/lib/permissions";
import Link from "next/link";

export const BoardCard = (props: Board) => {
    const {title, updatedAt, id, myRole} = props;

    return (
        <Link href={`/board/${id}`} className={cls.wrapper}>
            <div>
                <p>{title}</p>
                <p>{updatedAt}</p>
            </div>
            {canManageBoard(myRole)
                ? <DeleteBoardButton id={id}/>
                : <span className={cls.roleBadge}>{myRole}</span>}
        </Link>
    )
}
