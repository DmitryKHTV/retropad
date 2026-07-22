import cls from "./VotesBudget.module.css";

// The requester's remaining dot budget for the whole board (from board.myVotes).
type VotesBudgetProps = {
    left: number;
    max: number;
};

export const VotesBudget = ({left, max}: VotesBudgetProps) => (
    <div className={cls.pill} title="Your remaining votes on this board">
        <span className={cls.dot} aria-hidden />
        <span className={cls.label}>Votes left</span>
        <span className={cls.count}>{left}/{max}</span>
    </div>
);
