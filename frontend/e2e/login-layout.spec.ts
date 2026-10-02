import {test, expect, type Page} from '@playwright/test';

/** Fails when anything makes the page wider than the viewport. */
async function expectNoHorizontalScroll(page: Page) {
    const {scrollWidth, clientWidth} = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

/**
 * The login and register forms fill the width on a phone; their padding and
 * border must stay inside that width, not add to it.
 */
test('login and register forms fit the viewport', async ({page}) => {
    await page.goto('/login');
    await expect(page.getByTestId('demo-login')).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('button', {name: 'Register'}).click();
    await expect(page.getByRole('heading')).toBeVisible();
    await expectNoHorizontalScroll(page);
});
