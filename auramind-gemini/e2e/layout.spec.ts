import { test, expect } from '@playwright/test';

test.describe('Layout regression tests', () => {
  test.describe('Landing page hero', () => {
    test('hero section has max-width constraint and centered content', async ({ page }) => {
      await page.goto('/');
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 15_000 });

      const heroSection = heading.locator('xpath=ancestor::section');
      await expect(heroSection).toBeVisible();

      const box = await heroSection.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(300);

      const viewport = page.viewportSize()!;
      expect(box!.width).toBeLessThanOrEqual(viewport.width);

      const sectionCenter = box!.x + box!.width / 2;
      const viewportCenter = viewport.width / 2;
      expect(Math.abs(sectionCenter - viewportCenter)).toBeLessThan(20);
    });

    test('hero heading and CTA button are visible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const cta = page.locator('text=Start for free').first();
      await expect(cta).toBeVisible();
    });
  });

  test.describe('Auth page form', () => {
    test('auth page renders a centered card layout', async ({ page }) => {
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');

      const formCard = page.locator('.max-w-sm').first();
      await expect(formCard).toBeVisible({ timeout: 10_000 });

      const box = await formCard.boundingBox();
      expect(box).not.toBeNull();

      const viewport = page.viewportSize()!;
      const centerX = viewport.width / 2;
      const elementCenter = box!.x + box!.width / 2;
      expect(Math.abs(elementCenter - centerX)).toBeLessThan(40);
    });

    test('auth page has email and password fields', async ({ page }) => {
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
      await expect(page.locator('button:has-text("Start learning")').first()).toBeVisible();
    });
  });

  test.describe('Landing page navigation', () => {
    test('nav bar is visible and contains key links', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();

      await expect(nav.locator('text=AuraMind').first()).toBeVisible();
      await expect(nav.locator('text=Features').first()).toBeVisible();
      await expect(nav.locator('text=Pricing').first()).toBeVisible();
      await expect(nav.locator('text=About').first()).toBeVisible();
      await expect(nav.locator('text=Sign in').first()).toBeVisible();
    });

    test('nav stays fixed at top after scroll', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();

      const boxBefore = await nav.boundingBox();
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(300);
      const boxAfter = await nav.boundingBox();

      expect(boxBefore).not.toBeNull();
      expect(boxAfter).not.toBeNull();
      expect(boxAfter!.y).toBe(0);
    });
  });

  test.describe('Pricing cards responsive layout', () => {
    test('pricing cards stack vertically on mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/#pricing');
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(500);

      const pricingGrid = page.locator('#pricing .grid').first();
      await expect(pricingGrid).toBeVisible({ timeout: 10_000 });

      const cards = pricingGrid.locator('> div');
      const count = await cards.count();
      expect(count).toBe(2);

      const firstBox = await cards.nth(0).boundingBox();
      const secondBox = await cards.nth(1).boundingBox();
      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();

      expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height - 10);
    });

    test('pricing cards display side-by-side on desktop (1280px)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/#pricing');
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(500);

      const pricingGrid = page.locator('#pricing .grid').first();
      await expect(pricingGrid).toBeVisible({ timeout: 10_000 });

      const cards = pricingGrid.locator('> div');
      const count = await cards.count();
      expect(count).toBe(2);

      const firstBox = await cards.nth(0).boundingBox();
      const secondBox = await cards.nth(1).boundingBox();
      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();

      expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThan(20);
      expect(secondBox!.x).toBeGreaterThan(firstBox!.x + firstBox!.width - 10);
    });
  });
});
