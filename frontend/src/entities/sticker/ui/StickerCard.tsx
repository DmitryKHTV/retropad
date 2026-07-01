import {ReactNode} from "react";
import cls from "./StickerCard.module.css";

type StickerCardProps = {
    content: string;
    contentSlot?: ReactNode;
    actions?: ReactNode;
};

export const StickerCard = (props: StickerCardProps) => {
    const {content, contentSlot, actions} = props;

    return (
        <div className={cls.wrapper}>
            {contentSlot ?? <p className={cls.content}>{content}</p>}
            {actions}
        </div>
    );
};
