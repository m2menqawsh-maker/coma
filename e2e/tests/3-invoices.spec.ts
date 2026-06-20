import { expect, test } from "@playwright/test";
import { createProduct, createSession, getCashBalance } from "../helpers";

test.describe("3. الفواتير والزبائن (Invoices & Customers)", () => {
	test("دورة سداد الديون والدفع المتبادل مع التحقق من الخزينة (Debt Payment & Cross-Customer Payment)", async ({
		page,
	}) => {
		test.setTimeout(180000); // 3 دقائق — اختبار طويل متعدد الخطوات
		const customerName = `E2E DebtCust ${Date.now()}`;
		const otherCustomerName = `E2E PayerCust ${Date.now()}`;
		const productName = `E2E InvoiceProd ${Date.now()}`;

		// حفظ رصيد الخزينة المبدئي
		const initialBalance = await getCashBalance(page);

		// 0. إنشاء منتج لضمان إضافة طلب ذو قيمة مالية
		await createProduct(page, productName, "drink", 50);
		await expect(page.getByText(productName).first()).toBeVisible({
			timeout: 15000,
		});

		// --- خطوة تمهيدية: إنشاء زبون آخر لاستخدامه كدافع متبادل ---
		await page.goto("/sessions");
		await page.waitForLoadState("networkidle");
		await createSession(page, otherCustomerName, "laptop", "01011112222");
		await expect(page.getByText(otherCustomerName)).toBeVisible({
			timeout: 15000,
		});

		// --- خطوة 1: إنشاء جلسة وإغلاقها كدين بالكامل للزبون المدين ---
		await createSession(page, customerName, "mobile", "01033334444");
		await expect(page.getByText(customerName)).toBeVisible({ timeout: 15000 });

		// إضافة منتج لضمان وجود مبلغ مستحق
		const card = page
			.locator("div.grid > div")
			.filter({ hasText: customerName });
		await card.getByRole("button", { name: "+ طلب" }).click();
		await expect(
			page.locator("select option").filter({ hasText: productName }),
		).toBeAttached({ timeout: 15000 });
		await page.locator("select").selectOption({ label: productName });
		await page.locator('input[type="number"]').fill("1");
		await page.getByRole("button", { name: "إضافة", exact: true }).click();

		await expect(card.getByText("×1")).toBeVisible({ timeout: 15000 });

		// إغلاق الجلسة كدين (دون كاش أو بنك)
		await card.getByRole("button", { name: "إغلاق وتسديد" }).click();

		const checkoutModal = page
			.locator("div.fixed.inset-0")
			.filter({ hasText: "إلغاء" })
			.first();
		
		// مسح الكاش للتأكد من أنها دين
		const cashInputCheck = checkoutModal
			.locator("div")
			.filter({ hasText: /^كاش \(₪\)$/ })
			.locator("input");
		if (await cashInputCheck.isVisible()) {
			await cashInputCheck.fill("0");
		}

		await checkoutModal.getByRole("button", { name: "إغلاق وتسجيل" }).click();

		// تأكيد نافذة الخسارة المالية
		try {
			const confirmInput = page.getByPlaceholder("اكتب موافق...");
			await expect(confirmInput).toBeVisible({ timeout: 3000 });
			await confirmInput.fill("موافق");
			await page.getByRole("button", { name: "تأكيد العملية" }).click();
		} catch {}

		await expect(checkoutModal).not.toBeVisible({ timeout: 15000 });

		// التأكد من أن الخزينة لم تتأثر (لأنه دين)
		const balanceAfterDebt = await getCashBalance(page);
		expect(balanceAfterDebt).toBe(initialBalance);

		await page.goto("/invoices");
		await page.waitForLoadState("networkidle");

		// البحث باسم الزبون المدين
		const searchInput = page.getByPlaceholder("اسم العميل...");
		await searchInput.fill(customerName);
		
		// تصفية الفواتير حسب حالة "دين"
		const statusSelect = page
			.locator("div")
			.filter({ has: page.locator("label", { hasText: /^الحالة$/ }) })
			.locator("select")
			.first();
		await statusSelect.selectOption("debt");

		// الضغط على الفاتورة
		const row = page.locator("tr").filter({ hasText: customerName }).first();
		await expect(row).toBeVisible({ timeout: 15000 });
		await row.click();

		// --- خطوة 3: سداد جزء من الدين (تسديد جزئي) ---
		const payDebtBtn = page.getByRole("button", {
			name: "سداد الدين",
			exact: false,
		});
		await expect(payDebtBtn).toBeVisible({ timeout: 10000 });
		await payDebtBtn.click();

		const activeModal = page
			.locator("div.fixed.inset-0")
			.filter({ hasText: "إلغاء" })
			.first();
		const cashInput = activeModal
			.locator("div")
			.filter({ has: page.locator("label", { hasText: "دفع نقدي" }) })
			.locator("input")
			.first();
		await expect(cashInput).toBeVisible({ timeout: 10000 });
		await cashInput.fill("5"); // سداد 5 شيكل

		await activeModal
			.getByRole("button", { name: "سداد", exact: true })
			.click();

		await expect(activeModal).not.toBeVisible({ timeout: 15000 });
		await page.waitForResponse(response => response.url().includes('/rest/v1/') && response.status() === 200 || response.status() === 201 || response.status() === 204);

		// التحقق من تحول حالة الفاتورة لـ "جزئي"
		await page.getByRole("button", { name: "×", exact: true }).click();
		await expect(page.getByText("تفاصيل الفاتورة")).not.toBeVisible({ timeout: 10000 });
		
		await statusSelect.selectOption("all");
		await page.reload();
		await page.waitForLoadState("networkidle");
		await page.getByPlaceholder("اسم العميل...").fill(customerName);

		const targetRow = page
			.locator("tr")
			.filter({ hasText: customerName })
			.first();
		await expect(targetRow).toBeVisible({ timeout: 15000 });
		await expect(targetRow.filter({ hasText: "جزئي" })).toBeVisible({ timeout: 5000 });

		// التحقق من الخزينة للتأكد من زيادة 5 شيكل
		const balanceAfterPartial = await getCashBalance(page);
		expect(balanceAfterPartial).toBeGreaterThanOrEqual(initialBalance + 5);

		// --- خطوة 4: سداد متبقي الدين بواسطة عميل آخر (Cross-Customer Payment) ---
		await page.goto("/invoices");
		await page.getByPlaceholder("اسم العميل...").fill(customerName);
		const invoiceRow = page.locator("tr").filter({ hasText: customerName }).first();
		await expect(invoiceRow).toBeVisible({ timeout: 15000 });
		await invoiceRow.click();

		const crossPayBtn = page.getByRole("button", {
			name: "يسدد عنه زبون آخر",
			exact: true,
		});
		await expect(crossPayBtn).toBeVisible({ timeout: 10000 });
		await crossPayBtn.click();

		const activeCrossModal = page
			.locator("div.fixed.inset-0")
			.filter({ hasText: "إلغاء" })
			.first();
		const payerSearchInput = activeCrossModal
			.locator("div")
			.filter({ hasText: "ابحث عن الزبون الدافع" })
			.locator("input");
		await payerSearchInput.fill(otherCustomerName);

		const payerResultBtn = activeCrossModal
			.locator("button")
			.filter({ hasText: otherCustomerName })
			.first();
		await expect(payerResultBtn).toBeVisible({ timeout: 10000 });
		await payerResultBtn.click();

		const crossCashInput = activeCrossModal
			.locator("div")
			.filter({ has: page.locator("label", { hasText: "دفع نقدي" }) })
			.locator("input")
			.first();
		await crossCashInput.fill("100"); // سداد المتبقي

		await activeCrossModal
			.getByRole("button", { name: "تنفيذ وتسجيل" })
			.click();

		await expect(activeCrossModal).not.toBeVisible({ timeout: 15000 });
		
		await page.getByRole("button", { name: "×", exact: true }).click();
		await expect(page.getByText("تفاصيل الفاتورة")).not.toBeVisible({ timeout: 10000 });

		// التحقق من الخزينة للتأكد من الزيادة الأخيرة
		const balanceAfterCrossPay = await getCashBalance(page);
		expect(balanceAfterCrossPay).toBeGreaterThan(balanceAfterPartial);
	});

	test("تصفح قائمة الزبائن والتحقق من الأرصدة (Customers Tab & Balances)", async ({
		page,
	}) => {
		test.setTimeout(120000);
		await page.goto("/sessions");
		await page.waitForLoadState("networkidle");
		await createSession(page, `E2E BalanceCust ${Date.now()}`, "mobile");

		await page.goto("/invoices");
		await page.waitForLoadState("networkidle");

		await page.getByRole("button", { name: "الزبائن" }).click();

		const searchInput = page.getByPlaceholder("بحث عن زبون...");
		await expect(searchInput).toBeVisible({ timeout: 15000 });
		await searchInput.fill("E2E");

		await expect(
			page.locator("tr").filter({ hasText: "E2E" }).first(),
		).toBeVisible({ timeout: 15000 });
	});
});
