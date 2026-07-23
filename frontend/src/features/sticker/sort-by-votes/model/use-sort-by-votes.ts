import {useState} from "react";

// Owns the view-only toggle state so the board page just wires it up: `active`
// drives the re-rank, `toggle` flips it. No persistence — resets on remount.
export const useSortByVotes = () => {
    const [active, setActive] = useState(false);
    const toggle = () => setActive((v) => !v);
    return {active, toggle};
};
