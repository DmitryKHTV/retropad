'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import classNames from 'classnames';
import {useMe} from '@/entities/user/api';
import {getInitials} from '@/shared/lib/get-initials';
import IconGrid from '@/shared/assets/icons/icon-grid.svg';
import cls from './Navbar.module.css';


const NAV_ITEMS = [
    {href: '/', label: 'Boards'},
    {href: '/profile', label: 'Profile'},
] as const;

const HIDDEN_ROUTES = ['/login'];

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
