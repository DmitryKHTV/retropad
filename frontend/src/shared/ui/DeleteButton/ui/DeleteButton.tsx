'use client'

import { ComponentProps } from "react";
import { Button } from "@/shared/ui";
import IconDelete from "@/shared/assets/icons/icon-delete.svg";

type DeleteButtonProps = ComponentProps<typeof Button>;

export const DeleteButton = (props: DeleteButtonProps) => {
    return (
        <Button intent="danger" aria-label="Delete" {...props}>
            <IconDelete />
        </Button>
    )
}
