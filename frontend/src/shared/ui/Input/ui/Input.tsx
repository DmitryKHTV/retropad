import { HTMLProps } from 'react';
import styles from './Input.module.css';

type InputProps = HTMLProps<HTMLInputElement> & {
  label?: string;
};

/**
 * Underlined text input. With `label`, the label sits in the field while it is
 * empty and unfocused, and floats above it, scaled down, on focus or once there
 * is a value. Floating is CSS only: `:placeholder-shown` tells an empty field,
 * so the input always gets a placeholder (a blank one if none is passed), and
 * the placeholder itself shows only on focus, as a hint under the floated label.
 * The <label> wrapper ties label and input together without an id.
 */
export const Input = ({ label, placeholder, ...props }: InputProps) => {
  if (!label) return <input className={styles.input} placeholder={placeholder} {...props} />;

  return (
    <label className={styles.field}>
      <input className={styles.input} placeholder={placeholder ?? ' '} {...props} />
      <span className={styles.label}>{label}</span>
    </label>
  );
};
