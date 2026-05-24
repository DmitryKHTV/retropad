import type {Board} from "@/entities/board/model";
import cls from "./Board.module.css";
import {DeleteBoardButton} from "@/features/board/delete-board/ui/DeleteBoardButton";
import Link from "next/link";

export const BoardCard = (props: Board) => {
    const {title, updatedAt, id} = props;

    return (
        <Link href={`/board/${id}`} className={cls.wrapper}>
            <div>
                <p>{title}</p>
                <p>{updatedAt}</p>
            </div>
            <DeleteBoardButton id={id}/>
        </Link>
    )
}
