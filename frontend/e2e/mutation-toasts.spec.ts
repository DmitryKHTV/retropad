import {test, expect, type Page} from '@playwright/test';
import {setupBoard} from './helpers/board';

const SERVER_ERROR_TEXT = 'The server is not responding. Please try again in a moment.';

/**
 * Makes every vote fail with a 500, so each click on Vote produces one toast.
 * Only POST is intercepted: the board refetch that follows still hits the API.
 */
async function failVotes(page: Page) {
    await page.route('**/stickers/*/votes', (route) =>
        route.request().method() === 'POST'
            ? route.fulfill({status: 500, json: {statusCode: 500, message: 'Internal server error'}})
            : route.fallback(),
    );
}

async function gotoBoard(page: Page, boardId: string) {
    await page.goto(`/board/${boardId}`);
    await expect(page.getByTestId('board-column').first()).toBeVisible();
}

const toasts = (page: Page) => page.locator('[data-sonner-toast]');

/**
 * Failed mutations surface as toasts from the global MutationCache handler;
 * forms that show their error inline opt out, so nothing is reported twice.
 */
test.describe('mutation error toasts', () => {
    test('a failed vote shows a toast', async ({page}) => {
        const {boardId} = await setupBoard(page);
        await failVotes(page);
        await gotoBoard(page, boardId);

        await page.getByTestId('vote-sticker').first().click();

        await expect(toasts(page)).toHaveCount(1);
        await expect(toasts(page)).toContainText(SERVER_ERROR_TEXT);
    });

    test('hovering the stack expands it to ten toasts, the rest stay stacked', async ({page}) => {
        test.skip(test.info().project.name !== 'desktop', 'hover needs a pointer');

        const {boardId} = await setupBoard(page);
        await failVotes(page);
        await gotoBoard(page, boardId);

        const vote = page.getByTestId('vote-sticker').first();
        for (let i = 1; i <= 12; i++) {
            await vote.click();
            await expect(toasts(page)).toHaveCount(i);
        }

        await toasts(page).first().hover();

        await expect(page.locator('[data-sonner-toast][data-expanded="true"]')).toHaveCount(12);
        await expect(page.locator('[data-sonner-toast][data-visible="true"]')).toHaveCount(10);
        await expect(page.locator('[data-sonner-toast][data-visible="false"]')).toHaveCount(2);
    });

    test('a failed login is shown in the form, not as a toast', async ({page}) => {
        await page.goto('/login');
        await page.getByTestId('login-email').fill(`nobody_${Date.now()}@example.com`);
        await page.getByTestId('login-password').fill('wrong-password');
        await page.getByTestId('login-submit').click();

        await expect(page.getByTestId('login-error')).toBeVisible();
        await expect(toasts(page)).toHaveCount(0);
    });
});
