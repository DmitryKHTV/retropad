import { HTMLProps } from 'react';
import styles from './Input.module.css';

export const Input = (props: HTMLProps<HTMLInputElement>) => {
  return <input className={styles.input} {...props} />;
};
