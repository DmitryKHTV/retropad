'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import classNames from 'classnames';
import type {User} from '@/shared/api';
import {useMe} from '@/entities/user/api';
import IconGrid from '@/shared/assets/icons/icon-grid.svg';
import cls from './Navbar.module.css';


const NAV_ITEMS = [
    {href: '/', label: 'Boards'},
    {href: '/profile', label: 'Profile'},
] as const;

const HIDDEN_ROUTES = ['/login'];

const getInitials = (user: User | null | undefined): string => {
    const source = user?.name?.trim() || user?.email;
    if (!source) return '·';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
};

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

            <Link href="/profile" title="Profile" className={cls.avatar}>
                {getInitials(user)}
            </Link>
        </nav>
    );
};
