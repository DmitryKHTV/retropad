import {ButtonHTMLAttributes, DetailedHTMLProps} from "react";
import cls from "./Button.module.css";
import classNames from "classnames";


type ButtonProps = {
    mode?: 'main' | 'secondary'
} & DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export const Button = (props: ButtonProps) => {
    const {mode='main', ...otherProps} = props;
    return (
        <button className={classNames(cls.button, cls[mode])} {...otherProps}/>
    )
}