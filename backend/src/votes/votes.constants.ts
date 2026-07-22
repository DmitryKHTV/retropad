// Dot-voting budget: how many votes one user may spend across a single board.
// Lives outside the service because the board payload reports it to the client.
export const MAX_VOTES_COUNT = 5;

// How many times a Serializable transaction is replayed after a serialization
// failure before the request is answered with 409.
export const SERIALIZATION_MAX_ATTEMPTS = 3;
