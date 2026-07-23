import {type Page, expect} from '@playwright/test';

const API = 'http://localhost:3000';

// Seeds a fresh authenticated board straight through the API (fast, no UI
// clicking) and leaves the auth cookies in the page's browser context, so a
// following page.goto() renders as a logged-in user. Creating a board
// auto-seeds three default columns on the backend.
export async function setupBoard(page: Page, {withStickers = true} = {}) {
    const email = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
    const password = 'password123';
    const req = page.context().request;

    const register = await req.post(`${API}/auth/register`, {
        data: {email, password, name: 'E2E User'},
    });
    expect(register.ok(), 'register failed — is the backend on :3000 running?').toBeTruthy();

    const login = await req.post(`${API}/auth/login`, {data: {email, password}});
    expect(login.ok()).toBeTruthy();

    const created = await req.post(`${API}/boards`, {data: {title: 'E2E Retro'}});
    expect(created.ok()).toBeTruthy();
    const board = await created.json();

    if (withStickers) {
        const full = await (await req.get(`${API}/boards/${board.id}`)).json();
        const columns = full.columns as Array<{id: string}>;
        await req.post(`${API}/stickers`, {
            data: {columnId: columns[0].id, content: 'Deploys were smooth this sprint'},
        });
        await req.post(`${API}/stickers`, {
            data: {columnId: columns[1].id, content: 'CI is flaky on Windows runners'},
        });
    }

    return {boardId: board.id as string, email};
}
