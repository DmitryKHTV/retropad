import type {StickerWithVotes} from "@/entities/sticker";

// View-only ranking for the "sort by votes" toggle: most-voted first, ties
// broken by the persisted `order` so the result is stable and matches the
// default layout when vote totals are equal. Pure — returns a new array.
export const sortStickersByVotes = (stickers: StickerWithVotes[]): StickerWithVotes[] =>
    [...stickers].sort((a, b) => b.votes.total - a.votes.total || a.order - b.order);
