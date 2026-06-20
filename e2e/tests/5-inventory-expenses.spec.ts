import { expect, test } from "@playwright/test";
import { createProduct, createSession, getCashBalance } from "../helpers";

test.describe("5. المخزون والمصروفات (Inventory & Expenses)", () => {
	test("إضافة مصروف تشغيلي وتحديث سجل المصاريف مع فحص الخزينة (Operational Expenses)", async ({
		page,
	}) => {
		test.setTimeout(120000);
		// تتبع الخزينة قبل المصروف
		const initialCash = await getCashBalance(page);

		// 1. زيارة صفحة المصاريف
		await page.goto("/expenses");
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1").getByText("المصاريف").first()).toBeVisible({ timeout: 15000 });

		// 2. إضافة مصروف جديد
		const addExpenseBtn = page.getByRole("button", { name: "+ مصروف جديد" }).or(page.getByText("+ مصروف جديد"));
		await expect(addExpenseBtn).toBeVisible({ timeout: 15000 });
		await addExpenseBtn.click();

		const modal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(modal).toBeVisible({ timeout: 10000 });

		// تعبئة البيانات
		await modal.getByPlaceholder("مثال: إيجار، كهرباء، مشتريات قهوة...").fill("مصروف تشغيلي E2E");
		await modal.locator('input[type="number"]').first().fill("15");

		// اختيار النوع تشغيلي والقناة نقدي
		const typeSelect = modal.locator("select").first();
		if (await typeSelect.isVisible()) {
			await typeSelect.selectOption("fixed");
		}

		await modal.getByRole("button", { name: "تسجيل المصروف" }).or(modal.getByRole("button", { name: "حفظ" })).click();
		
		try {
			const confirmInput = page.getByPlaceholder("اكتب موافق...");
			await expect(confirmInput).toBeVisible({ timeout: 3000 });
			await confirmInput.fill("موافق");
			await page.getByRole("button", { name: "تأكيد العملية" }).click();
		} catch {}

		await expect(modal).not.toBeVisible({ timeout: 15000 });

		// التأكد من تسجيل المصروف بنجاح وظهوره في القائمة
		await expect(page.locator("tr").filter({ hasText: "مصروف تشغيلي E2E" }).first()).toBeVisible({ timeout: 15000 });

		// التحقق المالي: التأكد من خصم المصروف من الخزينة
		const finalCash = await getCashBalance(page);
		expect(finalCash).toBeLessThanOrEqual(initialCash - 15);
	});

	test("إدارة الأصناف ووصفات المنتجات والتكامل مع الجلسات وخصم الكمية (Inventory & Recipe Decrement Integration)", async ({
		page,
	}) => {
		test.setTimeout(180000);
		const itemName = `E2E Item ${Date.now()}`;
		const productName = `E2E ProdRecipe ${Date.now()}`;

		// 0. إضافة صنف نهائي أولاً (منتج) لضمان توفره لربط الوصفة به
		await createProduct(page, productName, "drink", 10);

		// 1. إضافة صنف خام (مكون)
		await page.goto("/inventory");
		await page.waitForLoadState("networkidle");
		await page.getByRole("button", { name: "+ صنف جديد" }).click();
		await page.getByPlaceholder("مثال: بن مطحون، حليب، سكر...").fill(itemName);
		await page.getByPlaceholder("غ، مل، حبة...").fill("غرام");
		await page.getByPlaceholder("0.00").first().fill("0.5"); // سعر التكلفة
		await page.getByPlaceholder("مثال: 100").fill("10"); // حد التنبيه
		await page.getByRole("button", { name: "إضافة الصنف" }).click();
		
		// التأكد من ظهور الصنف الجديد برصيد 0
		const itemRow = page.locator("tr").filter({ hasText: itemName }).first();
		await expect(itemRow).toBeVisible({ timeout: 15000 });
		await expect(itemRow.getByText("منخفض")).toBeVisible({ timeout: 10000 });

		// 2. تسجيل عملية شراء مخزون
		await page.getByRole("button", { name: "تسجيل شراء" }).click();

		const purchaseContainer = page.locator("div").filter({ hasText: "تسجيل شراء / إضافة للمخزون" }).last();
		await expect(purchaseContainer).toBeVisible({ timeout: 10000 });

		const itemSelect = purchaseContainer.locator("select").first();
		const itemOptionVal = await itemSelect.locator("option").filter({ hasText: itemName }).getAttribute("value");
		if (itemOptionVal) {
			await itemSelect.selectOption(itemOptionVal);
		}

		await purchaseContainer.getByPlaceholder("0", { exact: true }).fill("500");
		await purchaseContainer.locator('input[placeholder="0.00"]').first().fill("250");
		await purchaseContainer.getByRole("button", { name: "تسجيل الشراء" }).click();

		// التحقق من زوال تنبيه "منخفض" بعد الشراء وزيادة الكمية
		await page.getByRole("button", { name: "الأصناف" }).click();
		const updatedRow = page.locator("tr").filter({ hasText: itemName }).first();
		
		// التأكد من أن الكمية أصبحت 500 (سواء بالأرقام العربية أو الإنجليزية)
		await expect(updatedRow.locator('td').filter({ hasText: /(500|٥٠٠)/ })).toBeVisible({ timeout: 15000 });

		// 3. إعداد وصفة لمنتج معين
		await page.getByRole("button", { name: "وصفات المنتجات" }).click();
		await page.getByRole("button", { name: "+ وصفة جديدة" }).click();

		const recipeModal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(recipeModal).toBeVisible({ timeout: 10000 });

		const productSelect = recipeModal.locator("select").first();
		await productSelect.selectOption({ label: productName });

		const ingSelect = recipeModal.locator("select").nth(1);
		const ingOptionVal = await ingSelect.locator("option").filter({ hasText: itemName }).getAttribute("value");
		if (ingOptionVal) {
			await ingSelect.selectOption(ingOptionVal);
		}

		await recipeModal.locator('input[placeholder="0"]').fill("50");
		await recipeModal.getByRole("button", { name: "حفظ الوصفة" }).click();
		await expect(recipeModal).not.toBeVisible({ timeout: 15000 });

		// 4. بيع المنتج لاستهلاك الوصفة
		await page.goto("/sessions");
		await page.waitForLoadState("networkidle");
		const customerName = `E2E RecipeCust ${Date.now()}`;
		await createSession(page, customerName, "mobile", "0599123456");

		const sessionCard = page.locator("div.grid > div").filter({ hasText: customerName });
		await sessionCard.getByRole("button", { name: "+ طلب" }).click();

		const orderSelect = page.locator("select");
		const orderOptionVal = await orderSelect.locator("option").filter({ hasText: productName }).getAttribute("value");
		if (orderOptionVal) {
			await orderSelect.selectOption(orderOptionVal);
		}

		await page.locator('input[type="number"]').fill("1");
		await page.getByRole("button", { name: "إضافة", exact: true }).click();
		await expect(sessionCard.getByText("×1")).toBeVisible({ timeout: 15000 });

		await sessionCard.getByRole("button", { name: "إغلاق وتسديد" }).click();

		const checkoutModal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await checkoutModal.getByRole("button", { name: "إغلاق وتسجيل" }).click();

		try {
			const confirmInput = page.getByPlaceholder("اكتب موافق...");
			await expect(confirmInput).toBeVisible({ timeout: 3000 });
			await confirmInput.fill("موافق");
			await page.getByRole("button", { name: "تأكيد العملية" }).click();
		} catch {}

		await expect(checkoutModal).not.toBeVisible({ timeout: 15000 });

		// 5. التحقق من خصم 50 غرام من المخزون
		await page.goto("/inventory");
		await page.waitForLoadState("networkidle");
		await expect(
			page.locator("tr").filter({ hasText: itemName }).first().locator('td').filter({ hasText: /(450|٤٥٠)/ })
		).toBeVisible({ timeout: 15000 });
	});
});
