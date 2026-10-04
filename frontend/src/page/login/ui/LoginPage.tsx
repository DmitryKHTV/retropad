import { LoginForm } from '@/features/login';
import IconGrid from '@/shared/assets/icons/icon-grid.svg';
import cls from './LoginPage.module.css';

/**
 * The entry screen: brand mark, name and tagline above the login or
 * registration form, centred on a soft glow.
 */
export const LoginPage = () => {
  return (
    <main className={cls.page}>
      <div className={cls.brand}>
        <span className={cls.logo}>
          <IconGrid className={cls.icon} />
        </span>
        <span className={cls.name}>Retropad</span>
        <span className={cls.tagline}>Collaborative retrospectives for your team</span>
      </div>
      <LoginForm />
    </main>
  );
};
