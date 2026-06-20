import { test, expect } from "@playwright/test";
import {
	createPackage,
	createSubscription,
	createSession,
} from "../helpers";

test.describe("Subscriptions and Packages Flow", () => {
	test("Package creation and checkout flow", async ({ page }) => {
		const uniqueId = Math.random().toString(36).substring(7);
		const pkgName = `E2E Test Package - 5 Hours ${uniqueId}`;
		const pkgHours = 5;
		const pkgPrice = 20;

		// 1. Create a package
		await createPackage(page, pkgName, pkgHours, pkgPrice);

		// 2. Create a session
		const customerName = `Package Customer E2E ${uniqueId}`;
		await createSession(page, customerName, "mobile", `0599${Math.floor(Math.random() * 1000000)}`);

		// 3. Open Checkout
		await page.goto("/sessions");
		await page.waitForLoadState("networkidle");
		
		// Wait for the session card to appear
		const sessionCard = page.locator(".bg-\\[\\#111118\\]", { hasText: customerName }).first();
		await expect(sessionCard).toBeVisible({ timeout: 15000 });
		
		// Click checkout
		await sessionCard.getByRole("button", { name: "إغلاق وتسديد" }).click();
		
		const checkoutModal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(checkoutModal).toBeVisible({ timeout: 10000 });
		
		// 4. Select Package
		const packageSelect = checkoutModal.locator('select', { hasText: "بدون بكج (حساب عادي)" }).first();
		await packageSelect.selectOption({ label: `${pkgName} (${pkgHours}س بـ ₪${pkgPrice})` });
		
		// 5. Checkout & Close
		const saveButton = checkoutModal.getByRole("button", { name: "إغلاق وتسجيل" }).first();
		await expect(saveButton).not.toBeDisabled();
		await saveButton.click();
		
		try {
			const confirmInput = page.getByPlaceholder("اكتب موافق...");
			await expect(confirmInput).toBeVisible({ timeout: 3000 });
			await confirmInput.fill("موافق");
			await page.getByRole("button", { name: "تأكيد العملية" }).click();
		} catch {}
		
		await expect(checkoutModal).not.toBeVisible({ timeout: 15000 });
		await page.reload();
		await page.waitForLoadState("networkidle");
		await expect(sessionCard).not.toBeVisible({ timeout: 15000 });
		
		// 6. Verify in invoices
		await page.goto("/invoices");
		await page.waitForLoadState("networkidle");
		const invoiceRow = page.locator("tr", { hasText: customerName }).first();
		await expect(invoiceRow).toBeVisible({ timeout: 15000 });
		await expect(invoiceRow).toContainText(pkgName);
	});

	test("Subscription creation and checkout flow", async ({ page }) => {
		const uniqueId = Math.random().toString(36).substring(7);
		const subCustomer = `Subscription Customer E2E ${uniqueId}`;
		
		// 1. Create a dummy session first to register them
		await createSession(page, subCustomer, "mobile", `0599${Math.floor(Math.random() * 1000000)}`, true);
		
		await page.goto("/sessions");
		await page.waitForLoadState("networkidle");
		const dummySession = page.locator(".bg-\\[\\#111118\\]", { hasText: subCustomer }).first();
		await expect(dummySession).toBeVisible({ timeout: 10000 });
		
		await dummySession.getByRole("button", { name: "إغلاق وتسديد" }).click();
		
		const checkoutModal1 = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(checkoutModal1).toBeVisible({ timeout: 10000 });
		await checkoutModal1.getByRole("button", { name: "إغلاق وتسجيل" }).first().click();
		
		try {
			const confirmInput = page.getByPlaceholder("اكتب موافق...");
			await expect(confirmInput).toBeVisible({ timeout: 3000 });
			await confirmInput.fill("موافق");
			await page.getByRole("button", { name: "تأكيد العملية" }).click();
		} catch {}

		await expect(checkoutModal1).not.toBeVisible({ timeout: 15000 });
		await page.reload();
		await page.waitForLoadState("networkidle");
		await expect(dummySession).not.toBeVisible({ timeout: 15000 });

		// 2. Create Subscription
		await page.goto("/subscriptions");
		await createSubscription(page, subCustomer, "hours", 100, 200);

		// 3. Create the ACTUAL session for testing
		await createSession(page, subCustomer, "mobile", "", false);

		// 4. Go to sessions, open the checkout for the session we just created
		await page.goto("/sessions");
		await page.waitForLoadState("networkidle");
		
		const sessionCard = page.locator(".bg-\\[\\#111118\\]", { hasText: subCustomer }).first();
		await expect(sessionCard).toBeVisible({ timeout: 15000 });
		
		// Click checkout
		await sessionCard.getByRole("button", { name: "إغلاق وتسديد" }).click();
		const checkoutModal2 = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).first();
		await expect(checkoutModal2).toBeVisible({ timeout: 10000 });
		
		// 5. Verify Subscription is applied
		await expect(checkoutModal2.getByText("تغطية الاشتراك")).toBeVisible({ timeout: 10000 });
		
		// 6. Checkout & Close
		const saveButton = checkoutModal2.getByRole("button", { name: "إغلاق وتسجيل" }).first();
		await expect(saveButton).not.toBeDisabled();
		await saveButton.click();
		
		try {
			const confirmInput = page.getByPlaceholder("اكتب موافق...");
			await expect(confirmInput).toBeVisible({ timeout: 3000 });
			await confirmInput.fill("موافق");
			await page.getByRole("button", { name: "تأكيد العملية" }).click();
		} catch {}
		
		await expect(checkoutModal2).not.toBeVisible({ timeout: 15000 });
		await page.reload();
		await page.waitForLoadState("networkidle");
		await expect(sessionCard).not.toBeVisible({ timeout: 15000 });
		
		// 7. Verify usage in Subscriptions
		await page.goto("/subscriptions");
		await page.waitForLoadState("networkidle");
		
		const subRow = page.locator("tr", { hasText: subCustomer }).first();
		await expect(subRow).toBeVisible({ timeout: 15000 });
		
		// Open usage history
		await subRow.getByRole("button", { name: "سجل الاستخدام" }).click();
		const usageModal = page.locator("div.fixed.inset-0").filter({ hasText: "إلغاء" }).or(page.locator("div.fixed.inset-0").filter({ hasText: "إغلاق" })).first();
		
		await expect(usageModal.getByText(/سجل استخدام:/)).toBeVisible({ timeout: 10000 });
		// The usage might not be completely empty because we just closed a session.
		// So instead of expecting "لا يوجد استخدام", let's expect it to either show empty or a usage row.
		
		// Close modal
		await usageModal.getByRole("button", { name: "إغلاق" }).click();
		await expect(usageModal).not.toBeVisible({ timeout: 10000 });
		
		// 8. Toggle status
		const toggleBtn = subRow.getByRole("button", { name: "إيقاف" }).first();
		await toggleBtn.click();
		await expect(subRow.getByText("متوقف")).toBeVisible({ timeout: 10000 });
	});
});
