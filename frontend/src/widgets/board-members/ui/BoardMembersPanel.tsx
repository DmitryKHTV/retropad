'use client'

import {useState} from "react";
import {Button} from "@/shared/ui";
import type {EffectiveRole} from "@/shared/api";
import {MemberRow, useBoardMembers} from "@/entities/member";
import {AddMemberForm, LeaveBoardButton, MemberControls} from "@/features/board/manage-members";
import cls from "./BoardMembersPanel.module.css";

interface BoardMembersPanelProps {
    boardId: string;
    myRole: EffectiveRole;
}

export const BoardMembersPanel = ({boardId, myRole}: BoardMembersPanelProps) => {
    const [open, setOpen] = useState(false);
    const {data: members, isPending} = useBoardMembers(boardId, open);
    const isOwner = myRole === 'OWNER';

    return (
        <div className={cls.wrapper}>
            <Button outline onClick={() => setOpen((v) => !v)}>Share</Button>
            {open && (
                <>
                    <div className={cls.backdrop} onClick={() => setOpen(false)}/>
                    <div className={cls.panel}>
                        <span className={cls.title}>Board members</span>
                        <div className={cls.list}>
                            {isPending && <span className={cls.hint}>Loading...</span>}
                            {members?.map((member) => (
                                <MemberRow
                                    key={`member-${member.user.id}`}
                                    {...member}
                                    actions={
                                        isOwner && member.role !== 'OWNER'
                                            ? <MemberControls boardId={boardId} userId={member.user.id} role={member.role}/>
                                            : undefined
                                    }
                                />
                            ))}
                        </div>
                        {isOwner
                            ? <AddMemberForm boardId={boardId}/>
                            : <LeaveBoardButton boardId={boardId}/>}
                    </div>
                </>
            )}
        </div>
    );
};
