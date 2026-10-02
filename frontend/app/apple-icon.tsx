import {renderAppIcon} from './_pwa/app-icon';

export const size = {width: 180, height: 180};
export const contentType = 'image/png';

/** The icon iOS uses for "Add to Home Screen"; it ignores the manifest icons. */
export default function AppleIcon() {
    return renderAppIcon(size.width, 0.16);
}
