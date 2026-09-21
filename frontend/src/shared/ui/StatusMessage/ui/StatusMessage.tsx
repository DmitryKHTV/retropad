import type {ReactNode} from "react";
import classNames from "classnames";
import cls from "./StatusMessage.module.css";

export type StatusMessageTone = 'neutral' | 'error';

type StatusMessageProps = {
    title: string;
    hint?: string;
    tone?: StatusMessageTone;
    actions?: ReactNode;
    className?: string;
};

export const StatusMessage = (props: StatusMessageProps) => {
    const {title, hint, tone = 'neutral', actions, className} = props;
    return (
        <div
            className={classNames(cls.wrapper, tone === 'error' && cls.error, className)}
            role={tone === 'error' ? 'alert' : 'status'}
            data-testid="status-message"
            data-tone={tone}
        >
            <p className={cls.title}>{title}</p>
            {hint && <span className={cls.hint}>{hint}</span>}
            {actions && <div className={cls.actions}>{actions}</div>}
        </div>
    );
};
