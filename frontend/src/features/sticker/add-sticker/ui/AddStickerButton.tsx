'use client'

import {Button} from "@/shared/ui";
import {ChangeEvent, useState} from "react";
import {useAddSticker} from "@/features/sticker/add-sticker/api";

type AddStickerButtonProps = {
    columnId: string;
    boardId: string;
}

export const AddStickerButton = (props: AddStickerButtonProps) => {
    const {columnId, boardId} = props;

    const [isAddingNewSticker, setIsAddingNewSticker] = useState(false);
    const [stickerText, setStickerText] = useState("");
    const {mutate: addSticker, isPending} = useAddSticker();

    const onSwitchToCreate = () => {
        setIsAddingNewSticker(true);
    }

    const onCreate = () => {
        addSticker({content: stickerText, columnId, boardId }, {
            onSuccess: () => {
                setStickerText("");
                setIsAddingNewSticker(false);
            }
        })
    }

    const onStickerTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setStickerText(e.target.value);
    }


    return (
        <>
            {isAddingNewSticker ?<Button intent="success" onClick={onCreate} disabled={!stickerText  || isPending}>Create</Button> : <Button intent="success" outline onClick={onSwitchToCreate}>+ Add Sticker</Button>}
            {isAddingNewSticker && <textarea placeholder={"Enter sticker text"} value={stickerText} onChange={onStickerTextChange}/>}
        </>
    )
}