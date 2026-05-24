'use client'

import {Button, Input} from "@/shared/ui";
import {useCreateBoard} from "@/features/board/create-board/api";
import React, {useEffect, useState} from "react";
import cls from "./CreateBoardForm.module.css";

export const CreateBoardForm = () => {

    const [title, setTitle] = useState<string>("");
    const {mutate: create, isSuccess} = useCreateBoard();

    const createBoard = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title) return;
        create({title});
    }

    const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    }

    useEffect(() => {
        setTitle("");
    }, [isSuccess]);

    return (
        <form className={cls.wrapper} onSubmit={createBoard}>
            <Input placeholder={"New board name"} value={title} onChange={onTitleChange} />
            <Button>Create</Button>
        </form>
    )
}