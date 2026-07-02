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

export interface BoardWithColumns extends Board {
    columns: ColumnWithStickers[];
}
