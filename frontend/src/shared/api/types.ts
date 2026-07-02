export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
}

// Roles a user can have on a board. OWNER is synthesized by the backend
// from Board.ownerId — only EDITOR/VIEWER are stored as memberships.
export type BoardRole = 'EDITOR' | 'VIEWER';
export type EffectiveRole = 'OWNER' | BoardRole;
