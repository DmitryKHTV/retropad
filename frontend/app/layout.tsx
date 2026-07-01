import type {Metadata} from 'next';
import '@/shared/config/styles/index.css';
import {Providers} from '@/app/providers';
import {Navbar} from '@/widgets/navbar';
import {JetBrains_Mono} from "next/font/google";
import cls from './layout.module.css';

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin", "cyrillic"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: 'Stagehand',
    description: '',
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
        <body className={jetbrainsMono.className}>
        <Providers>
            <Navbar/>
            <div className={cls.content}>
                {children}
            </div>
        </Providers>
        </body>
        </html>
    );
}
