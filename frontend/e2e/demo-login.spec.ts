import {test, expect} from '@playwright/test';

/**
 * The demo path end to end: a guest lands on the boards list, opens the seeded
 * board shared with the demo teammates, and "End demo" returns them to /login.
 */
test('a guest tries the demo and ends it', async ({page}) => {
    await page.goto('/login');
    await page.getByTestId('demo-login').click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', {name: 'End demo'})).toBeVisible();

    await page.getByRole('link', {name: /Sprint retro \(demo\)/}).click();
    await expect(page.getByTestId('board-column')).toHaveCount(3);
    await expect(page.getByText('Flaky e2e tests block merges')).toBeVisible();

    await page.getByTestId('logout').click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('demo-login')).toBeVisible();
});
