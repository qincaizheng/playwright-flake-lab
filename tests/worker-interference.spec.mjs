import { expect, test } from '@playwright/test';

async function put(request, url) {
  expect((await request.put(url)).status(), `PUT ${url}`).toBe(204);
}

async function waitForWorker(request, prefix, signal) {
  let worker;
  await expect.poll(async () => {
    const response = await request.get(`${prefix}/signals/${signal}`);
    if (response.status() === 404) return false;
    expect(response.status(), `GET signal ${signal}`).toBe(200);
    ({ worker } = await response.json());
    return Number.isInteger(worker);
  }, { message: `waiting for another worker: ${signal}`, timeout: 10_000 }).toBe(true);
  return worker;
}

test('reader keeps its record after cleanup', async ({ page, request }, testInfo) => {
  const prefix = `/${testInfo.project.name}`;
  const record = `${prefix}/records/reader`;
  await put(request, record);
  expect((await page.goto(record)).status()).toBe(200);

  if (testInfo.project.name !== 'solo') {
    await put(request, `${prefix}/signals/reader-ready/${testInfo.parallelIndex}`);
    const cleanupWorker = await waitForWorker(request, prefix, 'cleanup-done');
    expect(cleanupWorker).not.toBe(testInfo.parallelIndex);
  }

  const response = await page.reload();
  expect(response.status(), 'reader record was removed by the cleanup worker').toBe(200);
  await expect(page.getByRole('heading', { name: 'Seeded test record' })).toBeVisible();
});

test('cleanup deletes only its own record', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name === 'solo', 'the solo run deliberately has no cleanup worker');
  const prefix = `/${testInfo.project.name}`;
  const readerWorker = await waitForWorker(request, prefix, 'reader-ready');
  expect(readerWorker).not.toBe(testInfo.parallelIndex);

  const record = `${prefix}/records/cleanup`;
  await put(request, record);
  expect((await request.delete(record)).status()).toBe(204);
  expect((await request.get(record)).status()).toBe(404);
  await put(request, `${prefix}/signals/cleanup-done/${testInfo.parallelIndex}`);
});
