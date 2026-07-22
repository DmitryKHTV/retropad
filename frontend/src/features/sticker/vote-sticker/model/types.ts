// boardId isn't sent to the server (the sticker's board is derived there) — it's
// carried so the mutation knows which board query to invalidate on settle.
export interface VoteStickerDto {
    stickerId: string;
    boardId: string;
}
