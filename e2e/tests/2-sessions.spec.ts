import { expect, test } from "@playwright/test";
import { createProduct, createSession, getCashBalance } from "../helpers";

test.describe("2. الجلسات (Sessions)", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("دورة حياة الجلسة بالكامل وإغلاقها وتسجيل الفاتورة مع فحص الرصيد (Full Session Lifecycle & Balance Check)", async ({
		page,
	}) => {
		const customerName = `E2E Customer ${Date.now()}`;
		const productName = `E2E Prod ${Date.now()}`;

		// حفظ رصيد الخزينة الحالي (للتأكد من تغيره لاحقاً وعدم التحايل)
		const initialBalance = await getCashBalance(page);

		// 0. إنشاء منتج لضمان نجاح الجلسة
		await createProduct(page, productName, "drink", 15);

		// 1. إنشاء الجلسة
		await page.goto("/sessions");
		await createSession(page, customerName, "mobile");

		// التأكد من ظهور الجلسة الجديدة في القائمة
		await expect(page.getByText(customerName)).toBeVisible({ timeout: 30000 });

		// 2. إضافة طلب (منتج) للجلسة
		const card = page
			.locator("div.grid > div")
			.filter({ hasText: customerName });
		await card.getByRole("button", { name: "+ طلب" }).click();

		// نختار الصنف الذي قمنا بإنشائه للتو باستخدام الـ label
		await page.locator("select").selectOption({ label: productName });
		await page.locator('input[type="number"]').fill("2");
		await page.getByRole("button", { name: "إضافة", exact: true }).click();

		// التأكد من إغلاق المودال وظهور المنتجات المضافة على الكارت
		await expect(card.getByText(/المنتجات/)).toBeVisible({ timeout: 5000 });

		// 3. إيقاف الجلسة مؤقتاً
		await card.getByTitle("إيقاف مؤقت").click();
		await page.waitForTimeout(500);

		// 4. استئناف الجلسة على لابتوب
		await card.getByRole("button", { name: "استئناف 💻" }).click();
		await page.waitForTimeout(500);

		// 5. تبديل الجهاز إلى موبايل
		await card.getByTitle("تبديل الجهاز").click();
		await page
			.getByRole("button", { name: "تبديل إلى موبايل" })
			.or(page.getByRole("button", { name: "تبديل إلى لابتوب" }))
			.click();
		await page.waitForTimeout(500);

		// 6. إغلاق الجلسة وتسجيل الفاتورة (Checkout)
		await card.getByRole("button", { name: "إغلاق وتسديد" }).click();

		// تعبئة بيانات الدفع في المودال
		const modal = page
			.locator("div.fixed.inset-0")
			.filter({ hasText: "إلغاء" })
			.first();
		await expect(modal).toBeVisible();

		const cashInput = modal
			.locator("div")
			.filter({ hasText: /^كاش \(₪\)$/ })
			.locator("input");
		
		// يجب الدفع نقداً بمبلغ 30 شيكل (15 شيكل * 2 منتج)
		if (await cashInput.isVisible()) {
			await cashInput.fill("30");
		}

		// حفظ وإغلاق الجلسة
		await modal.getByRole("button", { name: "إغلاق وتسجيل" }).click();

		// تأكيد نافذة الخسارة المالية إذا ظهرت
		try {
			const confirmInput = page.getByPlaceholder("اكتب موافق...");
			await expect(confirmInput).toBeVisible({ timeout: 2000 });
			await confirmInput.fill("موافق");
			await page.getByRole("button", { name: "تأكيد العملية" }).click();
		} catch {
			// لم تظهر نافذة الخسارة، وهو أمر عادي
		}

		// التحقق من زوال المودال والجلسة من الشاشة
		await expect(modal).not.toBeVisible({ timeout: 15000 });
		await expect(
			page.locator("div.grid > div").filter({ hasText: customerName }),
		).not.toBeVisible({ timeout: 5000 });

		// 7. التحقق الحقيقي من الخزينة (عدم التحايل)
		const finalBalance = await getCashBalance(page);
		expect(finalBalance).toBeGreaterThan(initialBalance);
	});

	test("اختبار الفاتورة الجماعية مع الدفع النقدي والتأكد من الخزينة (Group Checkout)", async ({ page }) => {
		const group1 = `E2E Group1 ${Date.now()}`;
		const group2 = `E2E Group2 ${Date.now()}`;
		
		const initialBalance = await getCashBalance(page);
		
		await page.goto("/sessions");
		await createSession(page, group1, "mobile");
		await createSession(page, group2, "laptop");

		// 2. الضغط على زر فاتورة جماعية
		const groupCheckoutBtn = page
			.getByRole("button", { name: "◈ فاتورة جماعية" })
			.or(page.getByText("فاتورة جماعية"));
		await expect(groupCheckoutBtn).toBeVisible({ timeout: 10000 });
		await groupCheckoutBtn.click();

		const modal = page
			.locator("div.fixed.inset-0")
			.filter({ hasText: "فاتورة جماعية" })
			.first();
		await expect(modal).toBeVisible();

		// اختيار الجلستين
		const firstRow = modal.locator("div").filter({ hasText: group1 }).last();
		const secondRow = modal.locator("div").filter({ hasText: group2 }).last();
		await firstRow.click();
		await page.waitForTimeout(300);
		await secondRow.click();
		await page.waitForTimeout(300);

		// تعيين المسؤول
		const assignBtn = modal
			.locator("button")
			.filter({ hasText: "تعيين كمسؤول" })
			.first();
		await assignBtn.click();
		await page.waitForTimeout(300);

		// تعبئة المبلغ كاش
		const cashInput = modal
			.locator("div")
			.filter({ hasText: /^كاش \(₪\)$/ })
			.locator("input");
		await cashInput.fill("15");

		// الضغط على تأكيد ودفع
		const checkoutBtn = modal
			.getByRole("button", { name: "تأكيد ودفع" })
			.or(modal.getByRole("button", { name: "تأكيد" }));
		await checkoutBtn.click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
		
		// التحقق من الخزينة للتأكد أن الفاتورة سُجلت فعلاً في قاعدة البيانات 
		const finalBalance = await getCashBalance(page);
		expect(Math.round(finalBalance * 100)).toBeGreaterThanOrEqual(Math.round((initialBalance + 15) * 100));
	});
});
