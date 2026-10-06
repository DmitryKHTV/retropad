import type {Metadata, Viewport} from 'next';
import '@/shared/config/styles/index.css';
import {Providers} from '@/app/providers';
import {Navbar} from '@/widgets/navbar';
import {JetBrains_Mono} from "next/font/google";
import Script from "next/script";
import cls from './layout.module.css';

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin", "cyrillic"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const description = 'A collaborative board for Agile retrospectives: stickers, drag-and-drop, dot-voting and live updates.';

export const metadata: Metadata = {
    metadataBase: new URL('https://retropad.dkhomutov.dev'),
    title: 'Retropad',
    description,
    openGraph: {
        type: 'website',
        siteName: 'Retropad',
        title: 'Retropad',
        description,
    },
    twitter: {
        card: 'summary_large_image',
    },
    appleWebApp: {
        capable: true,
        title: 'Retropad',
        statusBarStyle: 'black',
    },
};

export const viewport: Viewport = {
    themeColor: '#060606',
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
        {process.env.NODE_ENV === 'production' && (
            <Script
                src="https://static.cloudflareinsights.com/beacon.min.js"
                data-cf-beacon='{"token": "b35f75c1f93b4a77be0fcd889a843664"}'
                strategy="afterInteractive"
            />
        )}
        </body>
        </html>
    );
}
