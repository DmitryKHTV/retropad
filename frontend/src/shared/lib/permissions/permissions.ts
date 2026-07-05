import type {EffectiveRole} from "@/shared/api";

// Mirrors backend BoardAccessService.assertCanManage: only OWNER manages
// the board itself (rename/delete, members).
export const canManageBoard = (role: EffectiveRole): boolean => role === 'OWNER';

// Mirrors backend BoardAccessService.assertCanEdit: OWNER and EDITOR
// modify board content (columns, stickers).
export const canEditBoard = (role: EffectiveRole): boolean => role !== 'VIEWER';
