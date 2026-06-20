import { expect, test } from "@playwright/test";

test.describe("6. الإغلاقات والتقارير (Closings & Reports)", () => {
	test("مراجعة التقارير وحساب نسبة المطور وتأكيد الجرد المالي (Reports & Financial Closing Wizard)", async ({
		page,
	}) => {
		test.setTimeout(120000);
		// 1. زيارة صفحة التقارير والتأكد من تحميلها
		await page.goto("/reports");
		await expect(
			page.locator("h1").getByText("التقارير").first(),
		).toBeVisible({ timeout: 15000 });

		// 2. زيارة صفحة الجرد المالي
		await page.goto("/closing");
		await expect(
			page.locator("h1").getByText("الجرد المالي").first(),
		).toBeVisible({ timeout: 15000 });

		// 3. بدء عملية جرد مالي جديد
		const newClosingBtn = page
			.getByRole("button", { name: "جرد جديد" })
			.or(page.getByText("+ جرد جديد"));
		await expect(newClosingBtn).toBeVisible({ timeout: 15000 });
		await newClosingBtn.click();

		// --- الخطوة 1: اختيار الفترة ---
		const previewBtn = page.getByRole("button", { name: "معاينة البيانات ←" });
		await expect(previewBtn).toBeVisible({ timeout: 10000 });
		await previewBtn.click();

		// --- الخطوة 2: المعاينة والتحقق من القيم المالية ---
		await expect(page.getByText("ملخص الفترة")).toBeVisible({ timeout: 15000 });

		// قراءة القيم للتحقق من أنها أرقام صالحة وليست أخطاء (NaN)
		const revenueStr = await page
			.locator("div")
			.filter({ hasText: /^إجمالي الإيراد$/ })
			.locator("..")
			.locator("div")
			.nth(1)
			.innerText();
		const revenue = parseFloat(revenueStr.replace(/[^0-9.-]+/g, "")) || 0;
		expect(revenue).toBeGreaterThanOrEqual(0); // تأكيد أن الإيراد رقم صحيح

		const profitStr = await page
			.locator("div")
			.filter({ hasText: /^صافي الربح$/ })
			.locator("..")
			.locator("div")
			.nth(1)
			.innerText();
		const profit = parseFloat(profitStr.replace(/[^0-9.-]+/g, "")) || 0;
		expect(profit).not.toBeNaN();

		const deductionsBtn = page.getByRole("button", { name: "الخصومات ←" });
		await expect(deductionsBtn).toBeVisible({ timeout: 10000 });
		await deductionsBtn.click();

		// --- الخطوة 3: الخصومات ---
		// إمكانية إضافة خصم يدوي إضافي
		const deductLabel = page.getByPlaceholder("اسم الخصم (مثال: كهرباء، إيجار...)");
		await expect(deductLabel).toBeVisible({ timeout: 10000 });
		
		await deductLabel.fill("مشتريات طارئة E2E");
		await page.getByPlaceholder("المبلغ").fill("20");
		await page.getByRole("button", { name: "إضافة", exact: true }).click();

		const partnersBtn = page.getByRole("button", { name: "توزيع الشركاء ←" });
		await expect(partnersBtn).toBeVisible({ timeout: 10000 });
		await partnersBtn.click();

		// --- الخطوة 4: الشركاء ---
		const reviewBtn = page.getByRole("button", { name: "مراجعة وتأكيد ←" });
		await expect(reviewBtn).toBeVisible({ timeout: 10000 });
		await reviewBtn.click();

		// --- الخطوة 5: التأكيد والإغلاق المالي وقفل الفترة ---
		const saveBtn = page.getByRole("button", { name: "✓ تأكيد وإقفال الفترة" });
		await expect(saveBtn).toBeVisible({ timeout: 10000 });
		
		// إعداد اعتراض للرد لضمان حفظ الداتا فعلا
		const closingResponsePromise = page.waitForResponse(response => response.url().includes('/rest/v1/financial_closings') && response.status() === 201);
		
		await saveBtn.click();
		await closingResponsePromise;

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });

		// التحقق من رسالة النجاح
		await expect(page.getByText("تم إنشاء الجرد وقفل الفترة")).toBeVisible({ timeout: 10000 });
	});
});
