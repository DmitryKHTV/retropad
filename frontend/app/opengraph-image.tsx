import {ImageResponse} from 'next/og';

export const alt = 'Retropad, a collaborative board for Agile retrospectives';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

const COLUMNS = [
    {title: 'Went Well', stickers: [3, 1]},
    {title: 'To Improve', stickers: [2, 0, 1]},
    {title: 'Action Items', stickers: [4]},
];

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 72,
                    background: '#060606',
                    color: '#f4f4f4',
                }}
            >
                <div style={{fontSize: 84, fontWeight: 700, letterSpacing: -2}}>Retropad</div>
                <div style={{fontSize: 34, color: '#9a9a9a', marginTop: 12}}>
                    Retrospective board with live updates and dot-voting
                </div>

                <div style={{display: 'flex', gap: 24, marginTop: 64}}>
                    {COLUMNS.map(({title, stickers}) => (
                        <div
                            key={title}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14,
                                padding: 20,
                                background: '#1c1c1c',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: 14,
                            }}
                        >
                            <div style={{fontSize: 24, color: '#cfcfcf'}}>{title}</div>
                            {stickers.map((votes, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        height: 44,
                                        padding: '0 14px',
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        borderRadius: 10,
                                    }}
                                >
                                    <div style={{width: 120, height: 8, borderRadius: 4, background: 'rgba(255, 255, 255, 0.2)'}}/>
                                    <div style={{display: 'flex', gap: 6}}>
                                        {Array.from({length: votes}, (_, dot) => (
                                            <div key={dot} style={{width: 12, height: 12, borderRadius: 6, background: '#4a86ff'}}/>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        ),
        size,
    );
}
