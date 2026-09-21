import {ApiError} from "@/shared/api";

type Descriptions = {
    forbidden?: string;
    notFound?: string;
};

const FALLBACK = "Something went wrong. Please try again.";

// Backend messages are written for developers ("Board not found") and a dead
// server never produces an ApiError at all — ofetch throws its own FetchError
// before `onResponseError` can run. Both reach the user as-is unless they are
// translated here.
export const describeApiError = (error: unknown, descriptions: Descriptions = {}): string => {
    if (!(error instanceof ApiError)) {
        const unreachable = error instanceof Error && error.name === 'FetchError';
        return unreachable ? "Can't reach the server. Check your connection." : FALLBACK;
    }
    if (error.isForbidden) return descriptions.forbidden ?? "You don't have access to this.";
    if (error.isNotFound) return descriptions.notFound ?? "This is gone — it may have been deleted.";
    if (error.isServerError) return "The server is not responding. Please try again in a moment.";
    return error.message || FALLBACK;
};
