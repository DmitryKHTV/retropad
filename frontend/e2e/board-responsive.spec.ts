import {test, expect, type Page} from '@playwright/test';
import {setupBoard} from './helpers/board';

const READABLE_COLUMN_MIN_WIDTH = 240; // matches the 260px flex-basis, minus rounding

// Navigate to a board and wait until it has actually rendered — BoardPage returns
// null until both the board query and the current-user query resolve, so measuring
// layout before that races against a null render.
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

        // Columns must not be squeezed into slivers — the bug was flex:1 1 0
        // collapsing them to a few px each on a narrow screen.
        const box = await page.getByTestId('board-column').first().boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(READABLE_COLUMN_MIN_WIDTH);

        // Instead of shrinking, the board overflows and scrolls horizontally.
        const overflowsHorizontally = await page
            .getByTestId('board-scroll')
            .evaluate((el) => el.scrollWidth > el.clientWidth + 4);
        expect(overflowsHorizontally).toBe(true);
    });

    test('desktop fits all columns without horizontal scroll', async ({page}) => {
        test.skip(test.info().project.name !== 'desktop', 'desktop viewport only');

        const {boardId} = await setupBoard(page);
        await gotoBoard(page, boardId);

        const fits = await page
            .getByTestId('board-scroll')
            .evaluate((el) => el.scrollWidth <= el.clientWidth + 4);
        expect(fits).toBe(true);
    });
});
