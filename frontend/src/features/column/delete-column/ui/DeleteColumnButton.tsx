'use client'

import {Button} from "@/shared/ui";
import CaiIcon from "@/shared/assets/icons/icon-delete.svg";
import {useDeleteColumn} from "@/features/column/delete-column/api";

type DeleteColumnButtonProps = {
    boardId: string;
    columnId: string;
}

export const DeleteColumnButton = (props: DeleteColumnButtonProps) => {
    const {boardId, columnId} = props;

    const {mutate: deleteColumn, isPending} = useDeleteColumn();

    const onDelete = () => {
        deleteColumn({id: columnId, boardId: boardId});
    }

    return (
            <Button intent="danger" onClick={onDelete} disabled={isPending} aria-label="Delete column"><CaiIcon/></Button>
    )
}
