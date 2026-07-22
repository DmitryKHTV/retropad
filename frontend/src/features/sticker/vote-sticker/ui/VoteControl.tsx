'use client'

import {Button} from "@/shared/ui";
import {useVoteSticker, useUnvoteSticker} from "../api";
import cls from "./VoteControl.module.css";

const MAX_DOTS = 7;

type VoteControlProps = {
    stickerId: string;
    boardId: string;
    total: number;
    mine: number;
    canAddMore: boolean;
};

export const VoteControl = ({stickerId, boardId, total, mine, canAddMore}: VoteControlProps) => {
    const {mutate: vote, isPending: voting} = useVoteSticker();
    const {mutate: unvote, isPending: unvoting} = useUnvoteSticker();
    const pending = voting || unvoting;

    const shown = Math.min(total, MAX_DOTS);
    const overflow = total - shown;

    return (
        <div className={cls.wrapper}>
            <div className={cls.dots} aria-label={`${total} votes, ${mine} of them yours`}>
                {total === 0 && <span className={cls.empty}>No votes</span>}
                {Array.from({length: shown}, (_, i) => (
                    <span key={i} className={i < mine ? cls.dotMine : cls.dot} aria-hidden />
                ))}
                {overflow > 0 && <span className={cls.overflow}>+{overflow}</span>}
            </div>
            <div className={cls.buttons}>
                {mine > 0 && (
                    <Button
                        onClick={() => unvote({stickerId, boardId})}
                        disabled={pending}
                        aria-label="Remove your vote"
                    >
                        −
                    </Button>
                )}
                <Button
                    intent="success"
                    onClick={() => vote({stickerId, boardId})}
                    disabled={pending || !canAddMore}
                    aria-label="Vote"
                >
                    Vote
                </Button>
            </div>
        </div>
    );
};
