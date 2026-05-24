import {ColumnWithStickers} from "@/entities/column";
import cls from "./Column.module.css";
import {AddStickerButton} from "@/features/sticker/add-sticker";
import {Sticker, StickerCard} from "@/entities/sticker";

export const Column = (props: ColumnWithStickers) => {
    const {id, title, stickers, boardId} = props;

    return <div className={cls.wrapper}>
        <div>
            <h2 className={cls.title}>{title}</h2>

        </div>
        <AddStickerButton columnId={id} boardId={boardId} />
        <div className={cls.stickers}>
            {stickers.length > 0 ?
                stickers.map((sticker: Sticker) => <StickerCard key={`sticker-${sticker.id}`} boardId={boardId} {...sticker} />) :
                <p className={cls.noStickersText}>No stickers yet</p>}
        </div>
    </div>
}