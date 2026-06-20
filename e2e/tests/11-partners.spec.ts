import { expect, test } from "@playwright/test";

test.describe("11. الشركاء (Partners)", () => {
	test("إضافة شريك جديد ثم تسجيل سحب نقدي والتأكد من الأرصدة (Withdrawal Flow)", async ({
		page,
	}) => {
		const partnerName = `E2E Partner ${Date.now()}`;

		// 1. أضف شريك جديد من الإعدادات أولاً
		await page.goto("/settings");
		await page.waitForLoadState("networkidle");
		await expect(
			page.locator("h1").getByText("الإعدادات").first(),
		).toBeVisible({ timeout: 15000 });
		await page.getByRole("button", { name: "الشركاء", exact: true }).click();

		const partnerNameInput = page.getByPlaceholder("اسم الشريك...");
		await expect(partnerNameInput).toBeVisible({ timeout: 10000 });
		await partnerNameInput.fill(partnerName);
		await page.locator('input[placeholder="0"]').fill("25"); // نسبة 25%
		
		const addPartnerPromise = page.waitForResponse(response => response.url().includes('/rest/v1/partners') && response.status() === 201);
		await page.getByRole("button", { name: "+ إضافة شريك", exact: true }).click();
		await addPartnerPromise;

		// 2. انتقل لصفحة الشركاء
		await page.goto("/partners");
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1").getByText("الشركاء").first()).toBeVisible({ timeout: 15000 });

		// 3. اختر الشريك الجديد
		const partnerTab = page.locator("button").filter({ hasText: partnerName }).first();
		await expect(partnerTab).toBeVisible({ timeout: 15000 });
		await partnerTab.click();

		// 4. تحقق من ظهور بطاقات الإحصائيات الأربعة
		await expect(page.getByText("حصة الأرباح")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("إجمالي السحوبات")).toBeVisible();
		await expect(page.getByText("إجمالي الإيداعات")).toBeVisible();
		await expect(page.getByText("الأرباح المتاحة")).toBeVisible();

		// 5. تحقق من ظهور سجل الحركات الفارغ
		await expect(page.getByText(`سجل الحركات — ${partnerName}`)).toBeVisible();
		await expect(page.getByText("لا توجد حركات مسجلة لهذا الشريك")).toBeVisible();

		// 6. اضغط زر السحب
		await page.getByRole("button", { name: "− سحب" }).click();

		const modal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(modal).toBeVisible({ timeout: 10000 });

		// تحقق من عنوان المودال ومحتواه
		await expect(modal.getByText("تسجيل سحب")).toBeVisible();
		await expect(modal.getByText(partnerName)).toBeVisible();

		// 7. أدخل المبلغ
		await modal.locator('input[type="number"]').first().fill("50");

		// تأكيد القناة نقدي (افتراضي)
		await expect(modal.getByText("💵 نقدي")).toBeVisible();

		// 8. سجّل السحب
		const withdrawPromise = page.waitForResponse(response => response.url().includes('/rest/v1/ledger_entries') && response.status() === 201);
		await modal.getByRole("button", { name: "تسجيل السحب" }).click();

		try {
			const confirmInput = page.getByPlaceholder("اكتب موافق...");
			await expect(confirmInput).toBeVisible({ timeout: 3000 });
			await confirmInput.fill("موافق");
			await page.getByRole("button", { name: "تأكيد العملية" }).click();
		} catch {}

		await withdrawPromise;
		await expect(modal).not.toBeVisible({ timeout: 15000 });

		// 9. تحقق من ظهور العملية في جدول الحركات
		const withdrawRow = page.locator("tr").filter({ hasText: "↑ سحب" }).first();
		await expect(withdrawRow).toBeVisible({ timeout: 15000 });
		await expect(withdrawRow.locator("td").filter({ hasText: "-₪50.00" }).first()).toBeVisible();
	});

	test("تسجيل إيداع لشريك والتحقق من تحديث الرصيد (Deposit Flow)", async ({
		page,
	}) => {
		await page.goto("/partners");
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1").getByText("الشركاء").first()).toBeVisible({ timeout: 15000 });

		// تحقق من وجود شركاء
		const partnerTab = page.locator("button").filter({ hasText: /₪/ }).first();
		await expect(partnerTab).toBeVisible({ timeout: 15000 });

		// اختر أول شريك
		await partnerTab.click();

		// احفظ الرصيد الحالي
		const netBalanceCard = page
			.locator("div")
			.filter({ hasText: /^الأرباح المتاحة$/ })
			.locator("..")
			.locator("div")
			.nth(1);
		await expect(netBalanceCard).toBeVisible({ timeout: 10000 });
		const initialBalanceStr = await netBalanceCard.innerText();
		const initialBalance = parseFloat(initialBalanceStr.replace(/[^0-9.-]+/g, "")) || 0;

		// افتح مودال الإيداع
		await page.getByRole("button", { name: "+ إيداع" }).click();

		const modal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(modal).toBeVisible({ timeout: 10000 });

		// أدخل مبلغ الإيداع
		const depositAmount = 100;
		await modal.locator('input[type="number"]').first().fill(String(depositAmount));
		await modal.locator('input[placeholder*="إيداع"]').fill("إيداع E2E اختبار");

		const depositPromise = page.waitForResponse(response => response.url().includes('/rest/v1/ledger_entries') && response.status() === 201);
		await modal.getByRole("button", { name: "تسجيل الإيداع" }).click();
		await depositPromise;
		
		await expect(modal).not.toBeVisible({ timeout: 15000 });

		// تحقق من ظهور الإيداع في الجدول
		const depositRow = page.locator("tr").filter({ hasText: "↓ إيداع" }).first();
		await expect(depositRow).toBeVisible({ timeout: 15000 });
		await expect(depositRow.locator("td").filter({ hasText: "+₪100.00" }).first()).toBeVisible();

		// تحقق من تحديث الرصيد الصافي
		const expectedBalance = initialBalance + depositAmount;
		await expect(async () => {
			const finalBalanceStr = await netBalanceCard.innerText();
			const finalBalance = parseFloat(finalBalanceStr.replace(/[^0-9.-]+/g, "")) || 0;
			expect(Math.abs(finalBalance - expectedBalance)).toBeLessThan(0.01);
		}).toPass({ timeout: 10000 });
	});
});
