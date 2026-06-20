import { expect, test } from "@playwright/test";

test.describe("9. الالتزامات الثابتة (Fixed Obligations)", () => {
	test("إضافة وتسديد الالتزامات الثابتة والتحقق من الخزينة (Manage and Pay Obligations)", async ({
		page,
	}) => {
		test.setTimeout(120000);
		const obName = `E2E Obligation ${Date.now()}`;

		// تتبع الخزينة قبل التسديد
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		const initialCashStr = await page
			.getByText("الخزينة", { exact: true })
			.locator("..")
			.locator("div")
			.nth(1)
			.innerText({ timeout: 15000 });
		const initialCash =
			parseFloat(initialCashStr.replace(/[^0-9.-]+/g, "")) || 0;

		// 1. زيارة صفحة الالتزامات
		await page.goto("/obligations");
		await page.waitForLoadState("networkidle");
		await expect(
			page.locator("h1").getByText("الالتزامات").first(),
		).toBeVisible({ timeout: 15000 });

		// 2. إضافة التزام جديد
		const addObBtn = page
			.getByRole("button", { name: "+ إضافة التزام" })
			.or(page.getByText("+ إضافة التزام"));
		await expect(addObBtn).toBeVisible({ timeout: 15000 });
		await addObBtn.click();

		const modal = page
			.locator("div.fixed.inset-0")
			.filter({ hasText: "إلغاء" })
			.first();
		await expect(modal).toBeVisible({ timeout: 10000 });

		await modal.getByPlaceholder("مثال: إيجار، كهرباء، عامل...").fill(obName);
		await modal.locator('input[type="number"]').first().fill("100"); // 100 شيكل
		await modal
			.getByRole("button", { name: "حفظ" })
			.or(modal.getByRole("button", { name: "إضافة الالتزام" }))
			.click();

		// التأكد من اختفاء المودال وظهور الالتزام
		await expect(modal).not.toBeVisible({ timeout: 10000 });
		const obRow = page.locator("div").filter({ hasText: obName }).first();
		await expect(obRow).toBeVisible({ timeout: 15000 });
		await expect(obRow.getByText("₪100.00").first()).toBeVisible({
			timeout: 10000,
		});

		// 3. تسديد الالتزام عبر حاسبة المستحقات
		await page.getByRole("button", { name: "🧮 احسب المستحقات" }).click();
		const calcModal = page
			.locator("div.fixed.inset-0")
			.filter({ hasText: "احتساب المستحقات" })
			.first();
		await expect(calcModal).toBeVisible({ timeout: 10000 });

		// تعيين التواريخ لتشمل اليوم الحالي
		const today = new Date().toISOString().split("T")[0];
		await calcModal.locator('input[type="date"]').first().fill(today);
		await calcModal.locator('input[type="date"]').nth(1).fill(today);
		await calcModal.getByRole("button", { name: "احسب", exact: true }).click();
		await page.waitForTimeout(2000);

		// التحقق من ظهور الالتزام في القائمة
		await expect(calcModal.getByText(obName)).toBeVisible({ timeout: 10000 });

		// الضغط مباشرة على زر تسجيل - النظام سيسجل المبالغ المحسوبة تلقائياً لكل التزامات المختارة
		const registerBtn = calcModal.getByRole("button", {
			name: /تسجيل.*التزام/,
		});
		if (await registerBtn.isVisible()) {
			await registerBtn.click();
		} else {
			// فعل الالتزام (النقر على الزر الأول = مربع approve)
			await calcModal.locator("button").first().click();
			await page.waitForTimeout(1000);
			await calcModal.getByRole("button", { name: /تسجيل.*التزام/ }).click();
		}

		await expect(calcModal).not.toBeVisible({ timeout: 15000 });

		// التحقق المالي: تأكد أن الخزينة انخفضت
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);
		const finalCashStr = await page
			.getByText("الخزينة", { exact: true })
			.locator("..")
			.locator("div")
			.nth(1)
			.innerText({ timeout: 15000 });
		const finalCash = parseFloat(finalCashStr.replace(/[^0-9.-]+/g, "")) || 0;
		// يجب أن تكون الخزينة قد انخفضت
		expect(finalCash).toBeLessThan(initialCash);
	});
});
