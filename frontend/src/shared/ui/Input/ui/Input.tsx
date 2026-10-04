import { HTMLProps } from 'react';
import styles from './Input.module.css';

type InputProps = HTMLProps<HTMLInputElement> & {
  label?: string;
};

/**
 * Text input. With `label`, it renders a visible label above the field and
 * wraps both in <label>, which ties them together without an id.
 */
export const Input = ({ label, ...props }: InputProps) => {
  const input = <input className={styles.input} {...props} />;
  if (!label) return input;

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {input}
    </label>
  );
};
