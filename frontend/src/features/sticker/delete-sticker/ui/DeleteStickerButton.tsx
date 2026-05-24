'use client'

import {Button} from "@/shared/ui";
import CaiIcon from "@/shared/assets/icons/icon-delete.svg";
import {useDeleteSticker} from "@/features/sticker/delete-sticker/api";

type AddStickerButtonProps = {
    boardId: string;
    stickerId: string;
}

export const DeleteStickerButton = (props: AddStickerButtonProps) => {
    const {boardId, stickerId} = props;

    const {mutate: deleteSticker, isPending} = useDeleteSticker();

    const onDelete = () => {
        deleteSticker({id: stickerId, boardId: boardId});
    }


    return (
            <Button onClick={onDelete} disabled={isPending}><CaiIcon/></Button>
    )
}