import {test, expect, type Page} from '@playwright/test';
import {setupBoard} from './helpers/board';

// Column width is flex: 1 0 clamp(280px, 85vw, 600px) on the SortableColumn
// wrapper: wide (~600px) on desktop, narrower and screen-fitting on a phone, and
// never shrinking below a readable floor on any viewport.
const READABLE_FLOOR = 240; // clamp min is 280px; allow for rounding
const WIDE_DESKTOP_MIN = 500; // desktop should approach the 600px clamp cap
const MOBILE_MAX = 500; // a phone column must stay well under the desktop width

async function columnWidth(page: Page) {
    const box = await page.getByTestId('board-column').first().boundingBox();
    expect(box).not.toBeNull();
    return box!.width;
}

// BoardPage renders null until the board + current-user queries resolve, so wait
// for the first column before measuring layout.
async function gotoBoard(page: Page, boardId: string) {
    await page.goto(`/board/${boardId}`);
    await expect(page.getByTestId('board-column').first()).toBeVisible();
}

test.describe('board layout', () => {
    test('all three columns render for any viewport', async ({page}) => {
        const {boardId} = await setupBoard(page);
        await gotoBoard(page, boardId);

        await expect(page.getByTestId('board-column')).toHaveCount(3);
    });

    test('mobile keeps columns readable and scrolls the board horizontally', async ({page}) => {
        test.skip(test.info().project.name !== 'mobile', 'mobile viewport only');

        const {boardId} = await setupBoard(page);
        await gotoBoard(page, boardId);

        // Columns adapt down to fit the phone, but never collapse into slivers
        // (the bug was a 600px column forced onto a 390px screen).
        const width = await columnWidth(page);
        expect(width).toBeGreaterThanOrEqual(READABLE_FLOOR);
        expect(width).toBeLessThan(MOBILE_MAX);

        // They overflow the wrapper and scroll horizontally instead of shrinking.
        const overflowsHorizontally = await page
            .getByTestId('board-scroll')
            .evaluate((el) => el.scrollWidth > el.clientWidth + 4);
        expect(overflowsHorizontally).toBe(true);
    });

    test('desktop renders wide, readable columns', async ({page}) => {
        test.skip(test.info().project.name !== 'desktop', 'desktop viewport only');

        const {boardId} = await setupBoard(page);
        await gotoBoard(page, boardId);

        // Desktop keeps the deliberate wide columns (clamp caps at 600px); with
        // three of them the board scrolls horizontally, kanban-style — that's the
        // intended desktop design, not a regression.
        const width = await columnWidth(page);
        expect(width).toBeGreaterThanOrEqual(WIDE_DESKTOP_MIN);
    });
});
