import {notFound} from 'next/navigation';
import {renderAppIcon} from '../../_pwa/app-icon';

const ICONS: Record<string, {size: number; inset?: number}> = {
    'icon-192.png': {size: 192},
    'icon-512.png': {size: 512},
    'maskable-512.png': {size: 512, inset: 0.28},
};

export const dynamic = 'force-static';

export function generateStaticParams() {
    return Object.keys(ICONS).map((name) => ({name}));
}

/** Home-screen icons listed in the web app manifest, generated at build time. */
export async function GET(_request: Request, {params}: {params: Promise<{name: string}>}) {
    const icon = ICONS[(await params).name];
    if (!icon) notFound();
    return renderAppIcon(icon.size, icon.inset);
}
