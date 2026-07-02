'use client'

import React, {useState} from "react";
import {Button, Input} from "@/shared/ui";
import {ApiError, type BoardRole} from "@/shared/api";
import {useAddMember} from "../api";
import cls from "./ManageMembers.module.css";

interface AddMemberFormProps {
    boardId: string;
}

export const AddMemberForm = ({boardId}: AddMemberFormProps) => {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<BoardRole>("EDITOR");
    const {mutate: addMember, isPending, error, reset} = useAddMember();

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email) return;
        addMember({boardId, email, role}, {onSuccess: () => setEmail("")});
    };

    const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (error) reset();
    };

    return (
        <form className={cls.addForm} onSubmit={onSubmit}>
            <div className={cls.addRow}>
                <Input
                    type="email"
                    placeholder="Invite by email"
                    value={email}
                    onChange={onEmailChange}
                    disabled={isPending}
                />
                <select
                    className={cls.roleSelect}
                    value={role}
                    onChange={(e) => setRole(e.target.value as BoardRole)}
                    disabled={isPending}
                    aria-label="Role for new member"
                >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                </select>
                <Button intent="success" disabled={isPending}>Add</Button>
            </div>
            {error instanceof ApiError && <span className={cls.error}>{error.message}</span>}
        </form>
    );
};
