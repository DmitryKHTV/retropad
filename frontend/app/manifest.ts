import type {MetadataRoute} from 'next';
import {APP_BACKGROUND} from './_pwa/app-icon';

/** Lets the site be installed to a phone's home screen and open without browser chrome. */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Retropad',
        short_name: 'Retropad',
        description: 'A collaborative board for Agile retrospectives.',
        start_url: '/',
        display: 'standalone',
        background_color: APP_BACKGROUND,
        theme_color: APP_BACKGROUND,
        icons: [
            {src: '/pwa-icon/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
            {src: '/pwa-icon/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
            {src: '/pwa-icon/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
        ],
    };
}
