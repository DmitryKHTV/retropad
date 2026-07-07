import {ReactNode} from "react";
import {Avatar} from "@/shared/ui";
import type {StickerAuthor} from "../model/types";
import cls from "./StickerCard.module.css";

type StickerCardProps = {
    content: string;
    author: StickerAuthor;
    contentSlot?: ReactNode;
    actions?: ReactNode;
};

export const StickerCard = (props: StickerCardProps) => {
    const {content, author, contentSlot, actions} = props;

    return (
        <div className={cls.wrapper}>
            <div className={cls.body}>
                {contentSlot ?? <p className={cls.content}>{content}</p>}
                {actions}
            </div>
            <div className={cls.author} title={author.email}>
                <Avatar user={author} size="s"/>
                <span className={cls.authorName}>{author.name ?? author.email}</span>
            </div>
        </div>
    );
};
