import {Fragment, ReactNode} from "react";
import {ColumnWithStickers} from "@/entities/column/model";
import {StickerWithVotes, StickerCard} from "@/entities/sticker";
import cls from "./ColumnCard.module.css";

type ColumnCardProps = ColumnWithStickers & {
    titleSlot?: ReactNode;
    actions?: ReactNode;
    renderSticker?: (sticker: StickerWithVotes) => ReactNode;
};

export const ColumnCard = (props: ColumnCardProps) => {
    const {title, stickers, titleSlot, actions, renderSticker} = props;

    return (
        <div className={cls.wrapper}>
            <div className={cls.title}>
                {titleSlot ?? <p>{title}</p>}
            </div>
            <div className={cls.actions}>
                {actions}
            </div>
            <div className={cls.stickers}>
                {stickers.length > 0
                    ? stickers.map((sticker: StickerWithVotes) => (
                        <Fragment key={`sticker-${sticker.id}`}>
                            {renderSticker
                                ? renderSticker(sticker)
                                : <StickerCard content={sticker.content} author={sticker.author} />}
                        </Fragment>
                    ))
                    : <p className={cls.noStickersText}>No stickers yet</p>}
            </div>
        </div>
    );
};
