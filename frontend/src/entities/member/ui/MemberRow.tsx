import {type ReactNode} from "react";
import classNames from "classnames";
import {Avatar} from "@/shared/ui";
import type {BoardMember} from "../model/types";
import cls from "./MemberRow.module.css";

interface MemberRowProps extends BoardMember {
    actions?: ReactNode;
}

export const MemberRow = (props: MemberRowProps) => {
    const {user, role, actions} = props;

    return (
        <div className={cls.row}>
            <Avatar user={user}/>
            <div className={cls.info}>
                <span className={cls.name}>{user.name ?? user.email}</span>
                {user.name && <span className={cls.email}>{user.email}</span>}
            </div>
            <span className={classNames(cls.role, cls[role.toLowerCase()])}>{role}</span>
            {actions}
        </div>
    );
};
