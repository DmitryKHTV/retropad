import {ButtonHTMLAttributes, DetailedHTMLProps} from "react";
import cls from "./Button.module.css";
import classNames from "classnames";

export type ButtonIntent = 'neutral' | 'primary' | 'edit' | 'danger' | 'success';

type ButtonProps = {
    intent?: ButtonIntent;
    outline?: boolean;
} & DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export const Button = (props: ButtonProps) => {
    const {intent = 'neutral', outline = false, className, ...otherProps} = props;
    return (
        <button className={classNames(cls.button, cls[intent], outline && cls.outline, className)} {...otherProps}/>
    )
}
