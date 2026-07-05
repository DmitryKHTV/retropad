import type {EffectiveRole} from "@/shared/api";

// Mirrors backend BoardAccessService.assertCanTouchSticker:
// OWNER moderates any sticker; EDITOR may only touch their own.
// UX gating only — the backend enforces the real 403.
export const canTouchSticker = (myRole: EffectiveRole, userId: string, authorId: string): boolean =>
    myRole === 'OWNER' || (myRole === 'EDITOR' && authorId === userId);
