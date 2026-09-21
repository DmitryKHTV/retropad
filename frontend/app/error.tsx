'use client'

import {Button, StatusMessage} from "@/shared/ui";

const RootError = ({reset}: {error: Error & {digest?: string}; reset: () => void}) => {
    return (
        <StatusMessage
            tone="error"
            title="This page ran into an unexpected error."
            hint="Reloading usually fixes it. If it keeps happening, the board is safe on the server."
            actions={<Button intent="primary" onClick={reset}>Try again</Button>}
        />
    );
};

export default RootError;
