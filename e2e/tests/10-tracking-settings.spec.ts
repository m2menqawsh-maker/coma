import { expect, test } from "@playwright/test";
import { createSession } from "../helpers";

test.describe("10. سجل الحركات والإعدادات (Tracking & Settings)", () => {
	test("تغيير الإعدادات والتأكد من حفظها (Update Settings)", async ({
		page,
	}) => {
		// 1. زيارة صفحة الإعدادات
		await page.goto("/settings");
		await expect(
			page.locator("h1").getByText("الإعدادات").first(),
		).toBeVisible({ timeout: 15000 });

		// 2. تغيير تسعيرة اللابتوب
		const laptopRateInput = page
			.locator("label")
			.filter({ hasText: "سعر اللابتوب" })
			.locator("..")
			.locator("input");
		await expect(laptopRateInput).toBeVisible({ timeout: 10000 });
		
		const newValue = "7";
		await laptopRateInput.fill(newValue);

		const savePromise = page.waitForResponse(response => response.url().includes('/rest/v1/settings') && response.status() === 204 || response.status() === 200);

		await page
			.getByRole("button", { name: "حفظ التسعير" })
			.or(page.getByText("حفظ"))
			.click();
			
		await savePromise;

		// إعادة التحميل للتأكد من حفظ البيانات في قاعدة البيانات وليس فقط محلياً
		await page.reload();
		await page.waitForLoadState("networkidle");
		await expect(laptopRateInput).toHaveValue(newValue, { timeout: 15000 });
	});

	test("التحقق من سجل الحركات (Activity Log)", async ({ page }) => {
		const trackingName = `E2E Tracking Event ${Date.now()}`;

		// نفتح جلسة جديدة - سيقوم الـ DB Trigger بتسجيل الحركة باسم الزبون في جدول activity_logs
		await page.goto("/sessions");
		await page.waitForLoadState("networkidle");
		await createSession(page, trackingName, "mobile");

		// زيارة سجل الحركات
		await page.goto("/tracking");
		await page.waitForLoadState("networkidle");
		await expect(
			page.locator("h1").getByText("سجل حركات").first(),
		).toBeVisible({ timeout: 15000 });

		// التأكد من ظهور حركة فتح الجلسة
		const trackingRow = page
			.locator("tr")
			.filter({ hasText: trackingName })
			.first();
		await expect(trackingRow).toBeVisible({ timeout: 15000 });
	});
});
