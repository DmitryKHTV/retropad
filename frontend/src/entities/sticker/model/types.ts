import type {User} from "@/shared/api";

// GET /boards/:id returns the author as a safe subset — never the full User.
export type StickerAuthor = Pick<User, 'id' | 'name' | 'email'>;

export interface Sticker {
    id: string;
    content: string;
    color: string;
    order: number;
    columnId: string;
    createdAt: string;
    updatedAt: string;
    author: StickerAuthor;
}

// Aggregates only — `total` across everyone, `mine` is the requester's own dots.
// Individual voters never leave the server (dot-voting stays anonymous).
export interface StickerVotes {
    total: number;
    mine: number;
}

// GET /boards/:id nests stickers WITH vote aggregates. The bare `Sticker` is the
// shape mutation endpoints return (POST/PATCH/DELETE /stickers — no votes there).
export interface StickerWithVotes extends Sticker {
    votes: StickerVotes;
}
