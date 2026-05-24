import {Sticker} from "@/entities/sticker";
import cls from "./StickerCard.module.css";
import {DeleteStickerButton} from "@/features/sticker/delete-sticker";
import {Button} from "@/shared/ui";
import {ChangeEvent, useState} from "react";
import {useEditSticker} from "@/features/sticker/edit-sticker/api";

type StickerCardProps = Sticker & {boardId: string};

export const StickerCard = (props: StickerCardProps) => {
    const { content, id, boardId } = props;
    const [mode, setMode] = useState<'edit' | 'default'>('default');
    const [currentContent, setCurrentContent] = useState(content);
    const {mutate: updateSticker} = useEditSticker();

    const handleEditMode = () => {
        setMode('edit');
    }

    const handleEditContent = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setCurrentContent(e.currentTarget.value);
    }

    const handleUpdateSticker = () => {
        if (currentContent === content) {
            setMode('default');
            return;
        }

        updateSticker({content: currentContent, id, boardId}, {
            onSuccess: () => {
                setMode('default');
            }
        });
    }

    const handleCancel = () => {
        setCurrentContent(content);
        setMode('default');
    }

    if (mode === 'edit') {
        return (
            <div className={cls.wrapper}>
                <textarea className={cls.content} onChange={handleEditContent} defaultValue={currentContent}/>
                <Button onClick={handleUpdateSticker}>Save</Button>
                <Button onClick={handleCancel}>Cancel</Button>
            </div>
        )
    }

    return (
        <div className={cls.wrapper}>
            <p className={cls.content}>{content}</p>
            <Button onClick={handleEditMode}>Edit</Button>
            <DeleteStickerButton boardId={boardId} stickerId={id} />
        </div>
    )
}