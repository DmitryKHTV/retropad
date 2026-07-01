'use client'

import {Button, Input} from "@/shared/ui";
import {ChangeEvent, useState} from "react";
import {useAddColumn} from "@/features/column/add-column/api";
import cls from "./AddColumnButton.module.css";

type AddColumnButtonProps = {
    boardId: string;
    order: number;
}

export const AddColumnButton = (props: AddColumnButtonProps) => {
    const {boardId, order} = props;

    const [isAddingNewColumn, setIsAddingNewColumn] = useState(false);
    const [title, setTitle] = useState("");
    const {mutate: addColumn, isPending} = useAddColumn();

    const onSwitchToCreate = () => {
        setIsAddingNewColumn(true);
    }

    const onCreate = () => {
        addColumn({title, boardId, order}, {
            onSuccess: () => {
                setTitle("");
                setIsAddingNewColumn(false);
            }
        })
    }

    const onTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    }

    return (
        <div className={cls.root}>
            {isAddingNewColumn ? <Button intent="success" onClick={onCreate} disabled={!title || isPending}>Create</Button> : <Button intent="success" outline onClick={onSwitchToCreate}>+ Add Column</Button>}
            {isAddingNewColumn && <Input placeholder={"Enter column title"} value={title} onChange={onTitleChange}/>}
        </div>
    )
}
