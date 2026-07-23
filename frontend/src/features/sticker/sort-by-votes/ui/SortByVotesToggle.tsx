import {Button} from "@/shared/ui";

// Controlled toggle for ranking stickers by vote total. The board page owns the
// state (via useSortByVotes) and applies the re-rank at composition time.
type SortByVotesToggleProps = {
    active: boolean;
    onToggle: () => void;
};

export const SortByVotesToggle = ({active, onToggle}: SortByVotesToggleProps) => (
    <Button
        type="button"
        intent={active ? "primary" : "neutral"}
        outline={!active}
        aria-pressed={active}
        onClick={onToggle}
        title="Rank stickers by number of votes"
    >
        Sort by votes
    </Button>
);
