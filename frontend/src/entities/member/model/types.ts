import type {EffectiveRole} from "@/shared/api";

export interface MemberUser {
    id: string;
    email: string;
    name: string | null;
}

// GET /boards/:boardId/members — owner comes synthesized as the first
// entry with role 'OWNER', then EDITOR/VIEWER membership rows.
export interface BoardMember {
    role: EffectiveRole;
    createdAt: string;
    user: MemberUser;
}
