interface InitialsSource {
    name?: string | null;
    email?: string;
}

export const getInitials = (source: InitialsSource | null | undefined): string => {
    const text = source?.name?.trim() || source?.email;
    if (!text) return '·';
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return text.slice(0, 2).toUpperCase();
};
