import { expect, type Page } from "@playwright/test";

export async function createProduct(
	page: Page,
	name: string,
	category: string,
	price: number,
) {
	await page.goto("/settings");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000);
	await page.locator(".flex.gap-1 button", { hasText: "المنتجات" }).click(); // التبديل لتبويب المنتجات
	await page.getByRole("button", { name: "+ منتج جديد" }).click();
	await page.getByPlaceholder("مثال: قهوة، كرت 5 شيكل...").fill(name);
	await page.locator("select").first().selectOption(category);
	// Default is has_sizes: false, so we fill the small_price which acts as the main price
	await page.locator('input[placeholder="0"]').first().fill(price.toString());
	await page.getByRole("button", { name: "إضافة المنتج" }).click();
	await expect(page.getByText(name).first()).toBeVisible({ timeout: 15000 });
}

export async function createBankAccount(page: Page, name: string) {
	await page.goto("/banks");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000);
	const addBtn = page
		.getByRole("button", { name: "+ إضافة حساب بنكي" })
		.or(page.getByText("+ إضافة حساب بنكي"));
	if (await addBtn.isVisible()) {
		await addBtn.click();
	} else {
		// If there is no such button directly, let's assume there is an empty state or a button
		await page.getByRole("button", { name: "+ حساب جديد" }).click();
	}
	await page.getByPlaceholder("اسم البنك أو الحساب...").fill(name);
	await page.getByRole("button", { name: "حفظ" }).click();
	await expect(page.getByText(name).first()).toBeVisible({ timeout: 5000 });
}

export async function getCashBalance(page: Page): Promise<number> {
	await page.goto("/");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000);
	const cashLocator = page
		.getByText("الخزينة", { exact: true })
		.locator("..")
		.locator("div")
		.nth(1);
	await expect(cashLocator).toBeVisible({ timeout: 15000 });
	const cashText = await cashLocator.innerText();
	// Example text: "₪1,200.00"
	return parseFloat(cashText.replace(/[^0-9.-]+/g, ""));
}

export async function createSession(
	page: Page,
	customerName: string,
	device: "mobile" | "laptop" = "mobile",
	phone: string = "0599123456",
	isNew: boolean = true
) {
	await page.goto("/sessions");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000);
	await page.getByRole("button", { name: "+ جلسة جديدة" }).click();
	await page.getByPlaceholder("ابحث بالاسم أو الرقم...").fill(customerName);

	if (isNew) {
		const registerBtn = page
			.locator("button")
			.filter({ hasText: "ليس من القائمة" });
		await expect(registerBtn).toBeVisible({ timeout: 10000 });
		await registerBtn.click();

		const phoneInput = page.getByPlaceholder("رقم الهاتف *");
		await expect(phoneInput).toBeVisible({ timeout: 5000 });
		await phoneInput.fill(phone);
	} else {
		// Wait for search result and click the existing customer
		const existingCustomer = page.locator('div.cursor-pointer', { hasText: customerName }).first();
		await expect(existingCustomer).toBeVisible({ timeout: 10000 });
		await existingCustomer.click();
		// Wait for the dropdown to disappear indicating selection was processed
		await expect(existingCustomer).not.toBeVisible({ timeout: 5000 });
	}

	if (device === "mobile") {
		await page.getByRole("button", { name: "📱 موبايل" }).click();
	} else {
		await page.getByRole("button", { name: "💻 لابتوب" }).click();
	}

	await page.getByRole("button", { name: "فتح الجلسة" }).click();
	await page.waitForTimeout(1000);
}

export async function createPackage(
	page: Page,
	name: string,
	hours: number,
	price: number,
) {
	await page.goto("/settings");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000);
	
	await page.locator(".flex.gap-1 button", { hasText: "البكجات" }).click();
	await page.waitForTimeout(500);
	
	await page.getByRole("button", { name: "+ بكج جديد" }).click();
	await page.waitForTimeout(500);
	
	await page.locator('input[placeholder="مثال: عرض الصباح"]').fill(name);
	await page.locator('div:has(> label:has-text("عدد الساعات")) > input').fill(hours.toString());
	await page.locator('div:has(> label:has-text("السعر (₪)")) > input').fill(price.toString());
	
	await page.getByRole("button", { name: "حفظ", exact: true }).click();
	await expect(page.getByText(name).first()).toBeVisible({ timeout: 15000 });
}

export async function createSubscription(
	page: Page,
	customerName: string,
	type: "hours" | "days",
	limitValue: number,
	price: number,
) {
	await page.goto("/subscriptions");
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000);
	
	await page.getByRole("button", { name: "إنشاء اشتراك جديد" }).click();
	await page.waitForTimeout(500);
	
	// Select Customer
	await page.getByText("-- اختر زبون --").click();
	await page.getByPlaceholder("بحث...").fill(customerName);
	await page.locator('div.cursor-pointer', { hasText: customerName }).first().click();
	
	// Set End Date (next month)
	const nextMonth = new Date();
	nextMonth.setMonth(nextMonth.getMonth() + 1);
	const endDateStr = nextMonth.toISOString().split("T")[0];
	await page.locator('div:has(> label:has-text("تاريخ النهاية")) > input').fill(endDateStr);
	
	// Set Type
	if (type === "hours") {
		await page.locator('label:has-text("رصيد ساعات إجمالي")').click();
		await page.locator('div:has(> label:has-text("رصيد الساعات الإجمالي")) > input').fill(limitValue.toString());
	} else {
		await page.locator('label:has-text("ساعات محددة يومياً")').click();
		await page.locator('div:has(> label:has-text("ساعات يومية مسموحة")) > input').fill(limitValue.toString());
	}
	
	// Set Price
	await page.locator('div:has(> label:has-text("سعر الاشتراك (مبيع)")) > input').fill(price.toString());
	
	await page.getByRole("button", { name: "حفظ الاشتراك" }).click();
	
	const toastLocator = page.locator('.go3958317564, .go2072408551, [role="alert"], [data-sonner-toast], .toast'); // various toast classes
	await toastLocator.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);
	
	try {
		await expect(page.getByText("تم إنشاء الاشتراك بنجاح")).toBeVisible({ timeout: 10000 });
		await page.waitForTimeout(1000);
	} catch (e) {
		await page.screenshot({ path: "error-toast.png" });
		throw e;
	}
}
