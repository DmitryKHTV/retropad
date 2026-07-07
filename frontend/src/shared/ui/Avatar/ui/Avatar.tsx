import classNames from "classnames";
import {getInitials} from "@/shared/lib/get-initials";
import cls from "./Avatar.module.css";

export type AvatarSize = 's' | 'm' | 'l';

type AvatarProps = {
    user: {name?: string | null; email?: string} | null | undefined;
    size?: AvatarSize;
    className?: string;
    title?: string;
};

export const Avatar = (props: AvatarProps) => {
    const {user, size = 'm', className, title} = props;
    return (
        <span className={classNames(cls.avatar, cls[size], className)} title={title}>
            {getInitials(user)}
        </span>
    );
};
