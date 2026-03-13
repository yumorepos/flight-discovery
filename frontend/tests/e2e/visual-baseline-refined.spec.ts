import { expect, test, type Locator, type Page } from '@playwright/test';
import { inflateSync } from 'zlib';

const BASELINE_HASHES = {
  heroDesktop: '634dcf03273b33de',
  curatedDesktop: '00000000204546a6',
  featuredDesktop: '0ef2c2ce01818282',
  gridDesktop: '8a88282a292ee0a0',
  heroMobile: '2307454541292d7d',
} as const;

const waitForDealsLoaded = async (page: Page) => {
  await page.goto('/');
  await page.waitForResponse(
    (response) => response.url().includes('/api/search') && response.status() === 200,
    { timeout: 15000 },
  );
  await page.locator('section.animate-pulse').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await expect(page.locator('a:has-text("See deal")').first()).toBeVisible({ timeout: 15000 });
};

type PngData = { width: number; height: number; data: Uint8Array };

const paeth = (a: number, b: number, c: number) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
};

const decodePngRgba = (pngBuffer: Buffer): PngData => {
  const signature = '89504e470d0a1a0a';
  if (pngBuffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('Invalid PNG signature');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  const idatParts: Buffer[] = [];

  while (offset < pngBuffer.length) {
    const length = pngBuffer.readUInt32BE(offset);
    offset += 4;
    const type = pngBuffer.subarray(offset, offset + 4).toString('ascii');
    offset += 4;
    const data = pngBuffer.subarray(offset, offset + length);
    offset += length;
    offset += 4; // crc

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      const colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
        throw new Error('Unsupported PNG format');
      }
    } else if (type === 'IDAT') {
      idatParts.push(Buffer.from(data));
    } else if (type === 'IEND') {
      break;
    }
  }

  const inflated = inflateSync(Buffer.concat(idatParts));
  const stride = width * 4;
  const output = new Uint8Array(width * height * 4);

  let inOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inOffset];
    inOffset += 1;

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[inOffset++];
      const outIndex = y * stride + x;
      const left = x >= 4 ? output[outIndex - 4] : 0;
      const up = y > 0 ? output[outIndex - stride] : 0;
      const upLeft = y > 0 && x >= 4 ? output[outIndex - stride - 4] : 0;

      let value = raw;
      if (filter === 1) value = (raw + left) & 0xff;
      else if (filter === 2) value = (raw + up) & 0xff;
      else if (filter === 3) value = (raw + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) value = (raw + paeth(left, up, upLeft)) & 0xff;

      output[outIndex] = value;
    }
  }

  return { width, height, data: output };
};

const grayscaleAt = (img: PngData, x: number, y: number) => {
  const clampedX = Math.max(0, Math.min(img.width - 1, x));
  const clampedY = Math.max(0, Math.min(img.height - 1, y));
  const idx = (clampedY * img.width + clampedX) * 4;
  return img.data[idx] * 0.299 + img.data[idx + 1] * 0.587 + img.data[idx + 2] * 0.114;
};

const computeDHash = (pngBuffer: Buffer, size = 8) => {
  const img = decodePngRgba(pngBuffer);
  const bits: string[] = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const left = grayscaleAt(img, Math.floor((x / (size + 1)) * img.width), Math.floor((y / size) * img.height));
      const right = grayscaleAt(img, Math.floor(((x + 1) / (size + 1)) * img.width), Math.floor((y / size) * img.height));
      bits.push(left > right ? '1' : '0');
    }
  }

  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = bits.slice(i, i + 4).join('').padEnd(4, '0');
    hex += Number.parseInt(nibble, 2).toString(16);
  }

  return hex.padStart(16, '0');
};

const hexToBitString = (value: string) =>
  value
    .toLowerCase()
    .split('')
    .map((char) => Number.parseInt(char, 16).toString(2).padStart(4, '0'))
    .join('');

const hammingDistance = (a: string, b: string) => {
  const bitsA = hexToBitString(a);
  const bitsB = hexToBitString(b);
  const length = Math.max(bitsA.length, bitsB.length);
  let distance = 0;

  for (let i = 0; i < length; i += 1) {
    if ((bitsA[i] ?? '0') !== (bitsB[i] ?? '0')) distance += 1;
  }

  return distance;
};

const expectVisualHashWithin = async (locator: Locator, expectedHash: string, threshold: number) => {
  const png = await locator.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css' });
  const hash = computeDHash(png);
  expect(hammingDistance(hash, expectedHash)).toBeLessThanOrEqual(threshold);
};

test.describe('Visual Regression - Refined Discovery UI', () => {
  test.beforeEach(async ({ page }) => {
    await waitForDealsLoaded(page);
  });

  test('STRUCTURE: curated sections and featured card are visible', async ({ page }) => {
    await expect(page.getByText('Curated discovery')).toBeVisible();
    await expect(page.getByText('Featured deal').first()).toBeVisible();

    const sectionCards = page
      .locator('#results article')
      .filter({ hasText: /Best value this month|Weekend escapes|Warm-weather picks|Under/i });
    await expect(sectionCards.first()).toBeVisible();
    expect(await sectionCards.count()).toBeGreaterThanOrEqual(2);
  });

  test('VISUAL: hero + search section (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await waitForDealsLoaded(page);
    await expectVisualHashWithin(page.locator('section').first(), BASELINE_HASHES.heroDesktop, 8);
  });

  test('VISUAL: curated discovery section area (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1500 });
    await waitForDealsLoaded(page);

    const curatedSection = page.getByText('Curated discovery').first().locator('xpath=ancestor::div[1]').locator('xpath=ancestor::div[1]');
    await curatedSection.scrollIntoViewIfNeeded();
    await expectVisualHashWithin(curatedSection, BASELINE_HASHES.curatedDesktop, 10);
  });

  test('VISUAL: featured route card section (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1400 });
    await waitForDealsLoaded(page);

    const featured = page.locator('#results').getByText('Featured deal').first().locator('xpath=ancestor::div[1]');
    await featured.scrollIntoViewIfNeeded();
    await expectVisualHashWithin(featured, BASELINE_HASHES.featuredDesktop, 10);
  });

  test('VISUAL: standard result-card grid view (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1800 });
    await waitForDealsLoaded(page);

    const grid = page.locator('#results').locator('div.grid.grid-cols-1.gap-5.md\\:grid-cols-2').first();
    await grid.scrollIntoViewIfNeeded();
    await expectVisualHashWithin(grid, BASELINE_HASHES.gridDesktop, 10);
  });

  test('VISUAL: mobile homepage hero + search state', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForDealsLoaded(page);
    await expectVisualHashWithin(page.locator('section').first(), BASELINE_HASHES.heroMobile, 10);
  });
});
