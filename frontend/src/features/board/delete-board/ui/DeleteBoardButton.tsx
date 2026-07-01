import IconDelete from "@/shared/assets/icons/icon-delete.svg";
import cls from "@/entities/board/ui/Board.module.css";
import {Button} from "@/shared/ui";
import {useDeleteBoard} from "@/features/board/delete-board/api";
import {DeleteBoardDto} from "@/features/board/delete-board/model";
import React from "react";

export const DeleteBoardButton = (props: DeleteBoardDto) => {
    const {mutate: deleteBoard} = useDeleteBoard();

    const onDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        deleteBoard(props);
    }

    return (
        <Button intent="danger" onClick={onDelete} aria-label="Delete board">
            <IconDelete className={cls.deleteIcon}/>
        </Button>
    )
}