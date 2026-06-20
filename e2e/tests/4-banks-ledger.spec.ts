import { expect, test } from "@playwright/test";
import { getCashBalance } from "../helpers";

test.describe("4. البنوك ودفتر الأستاذ (Banks & Ledger)", () => {
	test("إدارة الحسابات البنكية وتصديق الحوالات (Bank Transfers Management)", async ({
		page,
	}) => {
		test.setTimeout(180000); // 3 دقائق — اختبار طويل ومعقد
		const bankName = `E2E Bank ${Date.now()}`;

		// 1. إنشاء حساب بنكي جديد في الإعدادات
		await page.goto("/settings");
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1").getByText("الإعدادات").first()).toBeVisible({ timeout: 15000 });
		
		await page.getByRole("button", { name: "الحسابات البنكية", exact: true }).click();
		
		await page.getByPlaceholder("مثال: PalPay خالد...").fill(bankName);
		await page.getByRole("button", { name: "+ إضافة حساب", exact: true }).click();
		
		await expect(page.getByText(bankName).first()).toBeVisible({ timeout: 15000 });

		// 2. زيارة صفحة الحوالات البنكية
		await page.goto("/banks");
		await page.waitForLoadState("networkidle");
		
		const btn = page.locator("button", { hasText: "+ تسجيل حوالة يدوية" }).first();
		await expect(btn).toBeVisible({ timeout: 30000 });

		// 3. تسجيل حوالة واردة يدوية (تحتاج تصديق)
		await btn.click({ force: true });

		const modal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(modal).toBeVisible({ timeout: 10000 });

		// اختيار وارد
		await modal.getByRole("button", { name: "↓ وارد" }).click();

		// تعبئة البيانات
		const amountInput = modal.locator('input[placeholder="0.00"]');
		await amountInput.fill("120");

		const bankSelect = modal.locator("select");
		await bankSelect.selectOption({ label: bankName });

		const senderNameInput = modal.locator('input[placeholder="اسم المُرسِل"]');
		if (await senderNameInput.isVisible()) {
			await senderNameInput.fill("E2E Sender");
		}

		const descInput = modal.locator('input[placeholder="وصف الحوالة..."]');
		await descInput.fill("حوالة تجريبية E2E واردة");

		// حفظ
		await modal.getByRole("button", { name: "تسجيل الحوالة" }).click();
		
		// الانتظار حتى اكتمال طلب API
		await expect(modal).not.toBeVisible({ timeout: 15000 });

		// التحقق من ظهور الحوالة المعلقة في الجدول
		const pendingRow = page.locator("tr").filter({ hasText: "حوالة تجريبية E2E واردة" }).first();
		await expect(pendingRow).toBeVisible({ timeout: 15000 });
		await expect(pendingRow.getByText("بانتظار التصديق")).toBeVisible({ timeout: 10000 });

		// 3. تصديق الحوالة الواردة
		const confirmBtn = pendingRow.getByRole("button").filter({ hasText: "تصديق" });
		await expect(confirmBtn).toBeVisible({ timeout: 10000 });
		await confirmBtn.click();
		
		// التأكد من تغير حالتها إلى مؤكدة
		const confirmedRow = page.locator("tr").filter({ hasText: "حوالة تجريبية E2E واردة" }).first();
		await expect(confirmedRow.getByText("مؤكدة")).toBeVisible({ timeout: 15000 });

		// 4. تسجيل حوالة صادرة يدوية (تؤكد تلقائياً)
		const btn2 = page.locator("button", { hasText: "+ تسجيل حوالة يدوية" }).first();
		await btn2.waitFor({ state: "visible", timeout: 15000 });
		await btn2.click({ force: true });

		const outModal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(outModal).toBeVisible({ timeout: 10000 });

		await outModal.getByRole("button", { name: "↑ صادر" }).click();
		await outModal.locator('input[placeholder="0.00"]').fill("40");
		await outModal.locator("select").selectOption({ label: bankName });
		await outModal.locator('input[placeholder="وصف الحوالة..."]').fill("حوالة تجريبية E2E صادرة");
		await outModal.getByRole("button", { name: "تسجيل الحوالة" }).click();
		
		await expect(outModal).not.toBeVisible({ timeout: 15000 });

		// التأكد من ظهور الحوالة الصادرة ومؤكدة مباشرة
		const outRow = page.locator("tr").filter({ hasText: "حوالة تجريبية E2E صادرة" }).first();
		await expect(outRow).toBeVisible({ timeout: 15000 });
		await expect(outRow.getByText("↑ صادر", { exact: true })).toBeVisible({ timeout: 10000 });
		await expect(outRow.getByText("مؤكدة")).toBeVisible({ timeout: 10000 });
	});

	test("تسجيل القيود اليدوية في دفتر الأستاذ والتأكد من الأرصدة (Manual Ledger Entries)", async ({
		page,
	}) => {
		test.setTimeout(180000);
		
		// 1. أخذ رصيد الخزينة قبل بدء أي شيء لعدم التحايل
		const initialLedgerCash = await getCashBalance(page);
		
		// 2. زيارة صفحة دفتر الأستاذ
		await page.goto("/ledger");
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1").getByText("السجل المالي").first()).toBeVisible({ timeout: 15000 });

		// 3. إضافة قيد يدوي خزنة (نقدي) وارد
		const addManualBtn = page.getByRole("button", { name: "+ قيد يدوي" }).or(page.getByText("قيد يدوي"));
		await expect(addManualBtn).toBeVisible({ timeout: 15000 });
		await addManualBtn.click();

		const modal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(modal).toBeVisible({ timeout: 10000 });

		await modal.locator('input[placeholder="0.00"]').fill("35");

		const typeSelect = modal.locator("select").first();
		await typeSelect.selectOption("opening_balance");

		const dirSelect = modal.locator("select").nth(1);
		await dirSelect.selectOption("in");

		const channelSelect = modal.locator("select").nth(2);
		await channelSelect.selectOption("cash");

		const descInput = modal.locator('input[placeholder="وصف القيد..."]');
		await descInput.fill("رصيد افتتاحي E2E نقدي");

		await modal.getByRole("button", { name: "تسجيل القيد" }).click();
		await expect(modal).not.toBeVisible({ timeout: 15000 });

		const cashRow = page.locator("tr").filter({ hasText: "رصيد افتتاحي E2E نقدي" }).first();
		await expect(cashRow).toBeVisible({ timeout: 15000 });
		await expect(cashRow.getByText("+₪35.00")).toBeVisible({ timeout: 10000 });

		// التأكد من الخزينة لضمان التغيرات المالية زادت 35
		const balanceAfterIn = await getCashBalance(page);
		expect(balanceAfterIn).toBeGreaterThanOrEqual(initialLedgerCash + 35);

		await page.goto("/ledger");
		await page.waitForLoadState("networkidle");

		// 4. إضافة قيد يدوي كاش (سحب شريك)
		await expect(addManualBtn).toBeVisible({ timeout: 15000 });
		await addManualBtn.click();

		const bankModal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(bankModal).toBeVisible({ timeout: 10000 });

		await bankModal.locator('input[placeholder="0.00"]').fill("10");

		const bankTypeSelect = bankModal.locator("select").first();
		await bankTypeSelect.selectOption("partner_withdrawal");

		const bankDirSelect = bankModal.locator("select").nth(1);
		await bankDirSelect.selectOption("out");

		const bankChannelSelect = bankModal.locator("select").nth(2);
		await bankChannelSelect.selectOption("cash");

		await bankModal.locator('input[placeholder="وصف القيد..."]').fill("سحب شريك E2E كاش");
		await bankModal.getByRole("button", { name: "تسجيل القيد" }).click();

		try {
			const confirmInput = page.getByPlaceholder("اكتب موافق...");
			await expect(confirmInput).toBeVisible({ timeout: 3000 });
			await confirmInput.fill("موافق");
			await page.getByRole("button", { name: "تأكيد العملية" }).click();
		} catch {}

		await expect(bankModal).not.toBeVisible({ timeout: 15000 });

		const manualRow = page.locator("tr").filter({ hasText: "سحب شريك E2E كاش" }).first();
		await expect(manualRow).toBeVisible({ timeout: 15000 });
		await expect(manualRow.getByText("-₪10.00")).toBeVisible({ timeout: 10000 });

		// التحقق المالي: التأكد من خصم الأموال من الخزينة بقيمة 10 شيكل
		const finalLedgerCash = await getCashBalance(page);
		expect(finalLedgerCash).toBeLessThanOrEqual(balanceAfterIn - 10);
	});
});
