'use client'

import {useRouter} from "next/navigation";
import {Button} from "@/shared/ui";
import {useMe} from "@/entities/user";
import {useLeaveBoard} from "../api";

interface LeaveBoardButtonProps {
    boardId: string;
}

export const LeaveBoardButton = ({boardId}: LeaveBoardButtonProps) => {
    const router = useRouter();
    const {data: me} = useMe();
    const {mutate: leave, isPending} = useLeaveBoard();

    const onLeave = () => {
        if (!me) return;
        leave({boardId, userId: me.id}, {onSuccess: () => router.push('/')});
    };

    return (
        <Button intent="danger" outline disabled={isPending || !me} onClick={onLeave}>
            Leave board
        </Button>
    );
};
