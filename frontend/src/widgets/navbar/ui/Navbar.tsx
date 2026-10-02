'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import classNames from 'classnames';
import {isGuest, useMe} from '@/entities/user';
import {LogoutButton} from '@/features/login';
import {formatDateTime} from '@/shared/lib/format-date';
import {Avatar} from '@/shared/ui';
import IconGrid from '@/shared/assets/icons/icon-grid.svg';
import cls from './Navbar.module.css';


const NAV_ITEMS = [
    {href: '/', label: 'Boards'},
    {href: '/profile', label: 'Profile'},
] as const;

const HIDDEN_ROUTES = ['/login'];

/**
 * Top bar: brand, section links, a badge for a demo guest with the moment the
 * account is deleted, the logout button and the avatar. Under 640px the brand
 * text and the demo badge are hidden so everything fits on a phone.
 */
export const Navbar = () => {
    const pathname = usePathname();
    const {data: user} = useMe();

    if (HIDDEN_ROUTES.includes(pathname)) return null;

    return (
        <nav className={cls.navbar}>
            <Link href="/" className={cls.brand}>
                <span className={cls.logo}>
                    <IconGrid className={cls.icon}/>
                </span>
                <span className={cls.brandText}>RETRO</span>
            </Link>

            <div className={cls.links}>
                {NAV_ITEMS.map(({href, label}) => (
                    <Link
                        key={href}
                        href={href}
                        className={classNames(cls.navLink, pathname === href && cls.navLinkActive)}
                    >
                        {label}
                    </Link>
                ))}
            </div>

            <div className={cls.spacer}/>

            {user && isGuest(user) && (
                <span className={cls.demoBadge} data-testid="demo-badge">
                    Demo account{user.expiresAt && ` · deleted ${formatDateTime(user.expiresAt)}`}
                </span>
            )}

            <LogoutButton/>

            <Link href="/profile" title="Profile" className={cls.avatarLink}>
                <Avatar user={user} size="l" className={cls.avatar}/>
            </Link>
        </nav>
    );
};
