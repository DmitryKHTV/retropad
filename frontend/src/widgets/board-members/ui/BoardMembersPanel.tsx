'use client'

import {useState} from "react";
import {Button} from "@/shared/ui";
import {MemberRow, useBoardMembers} from "@/entities/member";
import cls from "./BoardMembersPanel.module.css";

interface BoardMembersPanelProps {
    boardId: string;
}

export const BoardMembersPanel = ({boardId}: BoardMembersPanelProps) => {
    const [open, setOpen] = useState(false);
    const {data: members, isPending} = useBoardMembers(boardId, open);

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
                                <MemberRow key={`member-${member.user.id}`} {...member} />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
