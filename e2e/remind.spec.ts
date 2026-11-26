import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const firstDay = new Date('2026-11-26T09:00:00Z');
const nextDay = new Date('2026-11-27T09:00:00Z');
const reflection = 'Điện thoại ở ngoài tầm tay giúp mình đọc trọn một đoạn.';

async function onboard(page: Page) {
  await page.clock.install({ time: firstDay });
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu hành trình', exact: true }).click();
  for (const input of await page.getByPlaceholder('Chưa biết', { exact: true }).all()) {
    await expect(input).toHaveValue('');
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.getByLabel('Ngày bắt đầu', { exact: true })).toHaveValue('2026-11-26');
  await page.getByRole('button', { name: 'Sẵn sàng, bắt đầu thôi', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hôm nay, dành chỗ cho điều quan trọng.' })).toBeVisible();
}

async function navigate(page: Page, label: string) {
  const navigation = page.viewportSize()!.width < 800 ? 'Điều hướng di động' : 'Điều hướng chính';
  await page.getByRole('navigation', { name: navigation }).getByRole('button', { name: label, exact: true }).click();
}

async function exportData(page: Page) {
  await navigate(page, 'Cài đặt');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất bản sao lưu JSON', exact: true }).click();
  const download = await downloadEvent;
  const filePath = await download.path();
  const text = await readFile(filePath!, 'utf8');
  return { text, backup: JSON.parse(text) };
}

async function createDailyLog(page: Page) {
  await page.getByRole('button', { name: 'Hoàn thành Ngủ đủ, nghỉ tốt', exact: true }).click();
  await page.getByLabel('Trạng thái Suy nghĩ trước khi hỏi AI', { exact: true }).selectOption('not_applicable');
  await page.getByPlaceholder('Có thể chỉ là một câu…').fill(reflection);
  await page.getByRole('heading', { name: 'Một điều đọng lại' }).click();
  await page.getByRole('button', { name: 'Khép lại hôm nay', exact: true }).click();
  await page.getByRole('button', { name: 'Đánh dấu chưa làm và khép lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hôm nay đủ rồi.' })).toBeVisible();
}

async function expectNoOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport + 1);
}

test('PWA manifest and same-origin app icons expose expected installation metadata and dimensions', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({ id: '/', short_name: 'ReMind', start_url: '/', scope: '/', display: 'standalone' });
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(true);
  for (const icon of manifest.icons) {
    expect(icon.src).toMatch(/^\//);
    const asset = await request.get(icon.src);
    expect(asset.ok()).toBe(true);
    expect(asset.headers()['content-type']).toContain('image/png');
    const png = await asset.body();
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
  }
  const appleIcon = await request.get('/apple-touch-icon.png');
  expect(appleIcon.ok()).toBe(true);
  const png = await appleIcon.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([180, 180]);
  const serviceWorker = await request.get('/sw.js');
  expect(serviceWorker.ok()).toBe(true);
  expect(serviceWorker.headers()['content-type']).toMatch(/javascript/);
});

test('unknown baseline remains unknown; fresh Today has no fabricated personal metrics', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await onboard(page);
  await expect(page.getByText('Chưa đặt giới hạn', { exact: true })).toBeVisible();
  const { backup } = await exportData(page);
  expect(Object.values(backup.data.runs[0].baseline).every(value => value === null)).toBe(true);
  expect(backup.data.logs).toHaveLength(0);
  expect(backup.data.sessions).toHaveLength(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hôm nay, dành chỗ cho điều quan trọng.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('submitted habits, N/A, and reflection survive reload and offline editing', async ({ page, context }) => {
  const writes: string[] = [];
  page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
  await onboard(page);
  await createDailyLog(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hôm nay đủ rồi.' })).toBeVisible();
  await expect(page.getByPlaceholder('Có thể chỉ là một câu…')).toHaveValue(reflection);
  await expect(page.getByLabel('Trạng thái Suy nghĩ trước khi hỏi AI', { exact: true })).toHaveValue('not_applicable');
  await expect(page.getByText('Đã làm 1/7 việc áp dụng.', { exact: false })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hôm nay đủ rồi.' })).toBeVisible();
  await expect(page.getByText('Offline', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mở lại ngày', exact: true }).click();
  await page.getByPlaceholder('Có thể chỉ là một câu…').fill(`${reflection} Đã ghi khi offline.`);
  await page.getByRole('button', { name: 'Hoàn thành Đọc chậm một chút', exact: true }).click();
  await page.getByRole('button', { name: 'Khép lại hôm nay', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hôm nay đủ rồi.' })).toBeVisible();
  await page.reload();
  await expect(page.getByPlaceholder('Có thể chỉ là một câu…')).toHaveValue(`${reflection} Đã ghi khi offline.`);
  await expect(page.getByText('Đã làm 2/7 việc áp dụng.', { exact: false })).toBeVisible();
  await context.setOffline(false);
  expect(writes).toEqual([]);
});

test('JSON export, confirmed reset, and import restore records; invalid import is non-mutating', async ({ page }) => {
  await onboard(page);
  await createDailyLog(page);
  const original = await exportData(page);
  expect(original.backup.format).toBe('remind-backup');
  expect(original.backup.data.logs[0].reflection).toBe(reflection);
  await page.getByRole('button', { name: 'Xóa dữ liệu trên thiết bị', exact: true }).click();
  const destructive = page.getByRole('button', { name: 'Xóa toàn bộ dữ liệu', exact: true });
  await expect(destructive).toBeDisabled();
  await page.getByLabel('Nhập XÓA để xác nhận', { exact: true }).fill('XOA');
  await expect(destructive).toBeDisabled();
  await page.getByLabel('Nhập XÓA để xác nhận', { exact: true }).fill('XÓA');
  await destructive.click();
  await expect(page.getByRole('button', { name: 'Bắt đầu hành trình', exact: true })).toBeVisible();
  // Restore is exposed in Settings; first complete the blank onboarding again.
  await page.getByRole('button', { name: 'Bắt đầu hành trình', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('button', { name: 'Sẵn sàng, bắt đầu thôi', exact: true }).click();
  await navigate(page, 'Cài đặt');
  await page.locator('input[type=file]').setInputFiles({ name: 'remind-backup.json', mimeType: 'application/json', buffer: Buffer.from(original.text) });
  await expect(page.getByRole('dialog', { name: 'Khôi phục bản sao lưu?' })).toBeVisible();
  await page.getByRole('button', { name: 'Xác nhận thay thế dữ liệu', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await navigate(page, 'Hôm nay');
  await expect(page.getByRole('heading', { name: 'Hôm nay đủ rồi.' })).toBeVisible();
  await expect(page.getByPlaceholder('Có thể chỉ là một câu…')).toHaveValue(reflection);
  await navigate(page, 'Cài đặt');
  await page.locator('input[type=file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"not-a-backup","schemaVersion":999}') });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible();
  const after = await exportData(page);
  expect(after.backup.data.runs).toEqual(original.backup.data.runs);
  expect(after.backup.data.logs).toEqual(original.backup.data.logs);
  expect(after.backup.data.activeRunId).toBe(original.backup.data.activeRunId);
});

test('a fresh browser can restore directly from onboarding without creating a new run', async ({ page, browser }) => {
  await onboard(page);
  await createDailyLog(page);
  const original = await exportData(page);
  const freshContext = await browser.newContext({ locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', viewport: { width: 1440, height: 1100 } });
  try {
    const freshPage = await freshContext.newPage();
    await freshPage.clock.install({ time: firstDay });
    await freshPage.goto(process.env.REMIND_TEST_URL || 'http://127.0.0.1:3000/');
    await expect(freshPage.getByRole('button', { name: 'Đã có dữ liệu? Khôi phục bản sao', exact: true })).toBeVisible();
    await freshPage.locator('input[type=file]').setInputFiles({ name: 'remind-backup.json', mimeType: 'application/json', buffer: Buffer.from(original.text) });
    await expect(freshPage.getByRole('dialog', { name: 'Khôi phục hành trình của bạn' })).toBeVisible();
    await freshPage.getByRole('button', { name: 'Xác nhận khôi phục', exact: true }).click();
    await expect(freshPage.getByRole('heading', { name: 'Hôm nay đủ rồi.' })).toBeVisible();
    await expect(freshPage.getByPlaceholder('Có thể chỉ là một câu…')).toHaveValue(reflection);
    const restored = await exportData(freshPage);
    expect(restored.backup.data.runs).toEqual(original.backup.data.runs);
    expect(restored.backup.data.logs).toEqual(original.backup.data.logs);
  } finally {
    await freshContext.close();
  }
});

test('invalid metrics retain entered form values and can be corrected before saving', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Ghi nhanh hôm nay', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Ghi nhanh hôm nay', exact: true });
  const complex = dialog.getByRole('spinbutton', { name: /^Việc phức tạp/ });
  const independent = dialog.getByRole('spinbutton', { name: /^Đã tự nghĩ trước khi hỏi AI/ });
  await complex.fill('1');
  await independent.fill('2');
  await dialog.getByRole('button', { name: 'Lưu ghi nhận', exact: true }).click();
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(complex).toHaveValue('1');
  await expect(independent).toHaveValue('2');
  await independent.fill('1');
  await dialog.getByRole('button', { name: 'Lưu ghi nhận', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const { backup } = await exportData(page);
  expect(backup.data.logs[0].metrics).toMatchObject({ complex: 1, independent: 1 });
});

test('manual focus session saves actual time once and survives reload', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: /Bắt đầu tập trung/ }).click();
  await page.getByRole('button', { name: 'Ghi một phiên đã làm', exact: true }).click();
  await page.getByLabel('Thời gian thực tế phút', { exact: true }).fill('12.5');
  await page.getByLabel('Đoạn liên tục dài nhất phút', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Lưu phiên', exact: true }).click();
  await expect(page.getByText('12.5 phút · 0 gián đoạn', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Bắt đầu tập trung/ }).click();
  await expect(page.getByText('12.5 phút · 0 gián đoạn', { exact: true })).toBeVisible();
  const { backup } = await exportData(page);
  expect(backup.data.sessions).toHaveLength(1);
  expect(backup.data.sessions[0].actualSeconds).toBe(750);
  expect(backup.data.sessions[0].longestSegmentSeconds).toBe(600);
});

test('active timer pause/resume and interruptions recover after reload before explicit confirmation', async ({ page, context }) => {
  await onboard(page);
  await page.getByRole('button', { name: /Bắt đầu tập trung/ }).click();
  await page.getByLabel('Mục tiêu phút', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Bắt đầu phiên', exact: true }).click();
  await page.clock.runFor(5_000);
  await page.getByRole('button', { name: 'Ghi gián đoạn', exact: true }).click();
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /Bắt đầu tập trung/ }).click();
  await expect(page.getByText('ĐANG TẠM DỪNG', { exact: true })).toBeVisible();
  await expect(page.getByText(/Phiên được khôi phục/)).toBeVisible();
  const secondTab = await context.newPage();
  await secondTab.clock.install({ time: new Date('2026-11-26T09:00:05Z') });
  await secondTab.goto('/');
  await secondTab.getByRole('button', { name: /Bắt đầu tập trung/ }).click();
  await expect(secondTab.getByRole('button', { name: 'Bắt đầu phiên', exact: true })).toHaveCount(0);
  await expect(secondTab.getByText('ĐANG TẠM DỪNG', { exact: true })).toBeVisible();
  await secondTab.close();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.clock.runFor(5_000);
  await page.getByRole('button', { name: 'Kết thúc', exact: true }).click();
  await page.getByLabel('Thời gian thực tế phút', { exact: true }).fill('0.2');
  await page.getByLabel('Đoạn liên tục dài nhất phút', { exact: true }).fill('0.1');
  await page.getByRole('button', { name: 'Lưu phiên', exact: true }).click();
  await expect(page.getByText('0.2 phút · 1 gián đoạn', { exact: true })).toBeVisible();
  const { backup } = await exportData(page);
  expect(backup.data.sessions).toHaveLength(1);
  expect(backup.data.sessions[0]).toMatchObject({ status: 'completed', actualSeconds: 12, longestSegmentSeconds: 6, interruptions: 1 });
});

test('recall hides reference ideas until reveal and saves the next-day self-assessment', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: /Cho kiến thức được ở lại/ }).click();
  await page.getByRole('button', { name: 'Tạo thẻ nhớ lại', exact: true }).click();
  await page.getByLabel('Tên tài liệu', { exact: true }).fill('Bài đọc kiểm thử');
  await page.getByLabel('1–5 ý tham chiếu · mỗi ý một dòng', { exact: true }).fill('Ý tham chiếu ẩn thứ nhất\nÝ tham chiếu ẩn thứ hai');
  await page.getByRole('button', { name: 'Lưu thẻ', exact: true }).click();
  await expect(page.getByText('Ý tham chiếu ẩn thứ nhất', { exact: true })).toHaveCount(0);
  await page.clock.setSystemTime(nextDay);
  await page.reload();
  await page.getByRole('button', { name: /1 lượt nhớ lại đang chờ/ }).click();
  await page.getByRole('button', { name: 'Thử nhớ lại', exact: true }).click();
  await expect(page.getByText('Ý tham chiếu ẩn thứ nhất', { exact: true })).toHaveCount(0);
  await page.getByLabel('Mình nhớ được những gì?', { exact: true }).fill('Mình nhớ được ý đầu tiên.');
  await page.getByRole('button', { name: 'Xem ý tham chiếu', exact: true }).click();
  await expect(page.getByText('Ý tham chiếu ẩn thứ nhất', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: /Số ý khớp · trên 2/ }).selectOption('1');
  await page.getByRole('button', { name: 'Lưu tự đánh giá', exact: true }).click();
  await expect(page.getByText('Lần gần nhất: 1/2 ý khớp', { exact: true })).toBeVisible();
  const { backup } = await exportData(page);
  expect(backup.data.recallReviews).toHaveLength(1);
  expect(backup.data.recallReviews[0]).toMatchObject({ matched: 1, total: 2, dueDate: '2026-11-27', actualDate: '2026-11-27' });
});

test('360px screens stay within the viewport; captures fresh desktop and mobile Today', async ({ page }) => {
  await mkdir('artifacts', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await onboard(page);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.clock.runFor(5_000);
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
  await expectNoOverflow(page);
  await page.screenshot({ path: 'artifacts/today-desktop.png', fullPage: true });
  await page.screenshot({ path: 'artifacts/today-desktop-preview.png' });
  await page.setViewportSize({ width: 360, height: 800 });
  await expectNoOverflow(page);
  await page.screenshot({ path: 'artifacts/today-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoOverflow(page);
  await page.screenshot({ path: 'artifacts/mobile-preview.png' });
  await page.setViewportSize({ width: 360, height: 800 });
  for (const label of ['Hành trình', 'Tiến triển', 'Thư viện', 'Cài đặt']) {
    await navigate(page, label);
    await expectNoOverflow(page);
  }
  await navigate(page, 'Hôm nay');
  await page.getByRole('button', { name: /Bắt đầu tập trung/ }).click();
  await expectNoOverflow(page);
});
