import {ColumnWithStickers} from "@/entities/column";

export interface Board {
    id: string;
    title: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface BoardWithColumns extends Board {
    columns: ColumnWithStickers[];
}
