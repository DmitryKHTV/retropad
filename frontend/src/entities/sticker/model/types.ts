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
