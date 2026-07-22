import {ColumnWithStickers} from "@/entities/column";
import type {EffectiveRole} from "@/shared/api";

export interface Board {
    id: string;
    title: string;
    ownerId: string;
    myRole: EffectiveRole;
    createdAt: string;
    updatedAt: string;
}

// The requester's per-board dot budget: spent + left = max (MAX_VOTES_COUNT).
export interface MyVotes {
    spent: number;
    left: number;
    max: number;
}

export interface BoardWithColumns extends Board {
    columns: ColumnWithStickers[];
    myVotes: MyVotes;
}
