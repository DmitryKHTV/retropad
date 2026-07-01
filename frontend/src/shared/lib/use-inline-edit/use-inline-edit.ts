import { ChangeEvent, useState } from 'react';

/**
 * Local state machine for an inline "click to edit" field.
 *
 * Owns the toggle between view/edit mode and the draft value.
 * It is transport-agnostic: persisting is the caller's job (e.g. a mutation),
 * which calls `close` from its `onSuccess`.
 */
export const useInlineEdit = (initialValue: string) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);

    // Toggling resets the draft to the latest source value, so re-opening
    // after a cancel never shows a stale edit.
    const toggle = () => {
        setValue(initialValue);
        setIsEditing((prev) => !prev);
    };

    const close = () => setIsEditing(false);

    const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value);

    return { isEditing, value, toggle, close, onChange };
};
