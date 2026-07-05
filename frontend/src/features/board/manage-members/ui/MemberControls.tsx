'use client'

import {DeleteButton} from "@/shared/ui";
import type {BoardRole} from "@/shared/api";
import {useChangeMemberRole, useRemoveMember} from "../api";
import cls from "./ManageMembers.module.css";

interface MemberControlsProps {
    boardId: string;
    userId: string;
    role: BoardRole;
}

export const MemberControls = ({boardId, userId, role}: MemberControlsProps) => {
    const changeRole = useChangeMemberRole();
    const removeMember = useRemoveMember();
    const isPending = changeRole.isPending || removeMember.isPending;

    return (
        <div className={cls.controls}>
            <select
                className={cls.roleSelect}
                value={role}
                onChange={(e) => changeRole.mutate({boardId, userId, role: e.target.value as BoardRole})}
                disabled={isPending}
                aria-label="Member role"
            >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
            </select>
            <DeleteButton
                aria-label="Remove member"
                disabled={isPending}
                onClick={() => removeMember.mutate({boardId, userId})}
            />
        </div>
    );
};
