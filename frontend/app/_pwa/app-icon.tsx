import {ImageResponse} from 'next/og';

export const APP_BACKGROUND = '#060606';

/**
 * The four-square logo from `app/icon.svg`, rendered as a PNG for home-screen
 * icons. `inset` is the share of the side left empty around the logo: maskable
 * Android icons are cropped to a circle, so they need a wider margin than the
 * regular ones.
 */
export function renderAppIcon(size: number, inset = 0.18) {
    const pad = Math.round(size * inset);
    const gap = Math.round(size * 0.07);
    const cell = Math.floor((size - pad * 2 - gap) / 2);
    const stroke = Math.max(2, Math.round(cell * 0.19));
    const radius = Math.round(cell * 0.18);

    const square = (
        <div
            style={{
                width: cell,
                height: cell,
                border: `${stroke}px solid #f4f4f4`,
                borderRadius: radius,
            }}
        />
    );

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: APP_BACKGROUND,
                }}
            >
                <div style={{display: 'flex', flexDirection: 'column', gap}}>
                    <div style={{display: 'flex', gap}}>{square}{square}</div>
                    <div style={{display: 'flex', gap}}>{square}{square}</div>
                </div>
            </div>
        ),
        {width: size, height: size},
    );
}
