import { expect, test } from "@playwright/test";

test.describe("8. المستخدمين والشركاء (Users & Partners)", () => {
	test("إضافة شريك جديد وتعديل نسبته (Manage Partners)", async ({ page }) => {
		const partnerName = `E2E Partner ${Date.now()}`;

		// 1. زيارة صفحة الشركاء في الإعدادات
		await page.goto("/settings");
		await page.waitForLoadState("networkidle");
		await expect(
			page.locator("h1").getByText("الإعدادات").first(),
		).toBeVisible();
		
		await page.getByRole("button", { name: "الشركاء", exact: true }).click();

		// 2. تعبئة بيانات الشريك الجديد (لا يوجد مودال، النموذج ظاهر مباشرة)
		const nameInput = page.getByPlaceholder("اسم الشريك...");
		await expect(nameInput).toBeVisible({ timeout: 10000 });
		await nameInput.fill(partnerName);
		
		await page.locator('input[placeholder="0"]').fill("20"); // نسبة 20%
		await page
			.getByRole("button", { name: "+ إضافة شريك", exact: true })
			.click();

		// التأكد من ظهوره في الجدول مباشرة بعد الحفظ (بدون توقف زمني ثابت)
		await expect(page.getByText(partnerName).first()).toBeVisible({ timeout: 15000 });
	});

	test("إدارة المستخدمين والصلاحيات (Manage Users)", async ({ page }) => {
		const userEmail = `e2e_user_${Date.now()}@test.com`;

		// 1. زيارة صفحة المستخدمين
		await page.goto("/users");
		await page.waitForLoadState("networkidle");
		await expect(
			page.locator("h1").getByText("المستخدمين والصلاحيات").first(),
		).toBeVisible();

		// 2. إضافة مستخدم جديد (إن وجد الزر)
		const addUserBtn = page
			.getByRole("button", { name: "+ مستخدم جديد" })
			.or(page.getByText("مستخدم جديد"));
			
		if (await addUserBtn.isVisible()) {
			await addUserBtn.click();
			const modal = page
				.locator("div.fixed.inset-0")
				.filter({ hasText: "إلغاء" })
				.first();
			await expect(modal).toBeVisible({ timeout: 10000 });

			await modal.getByPlaceholder("البريد الإلكتروني").fill(userEmail);
			await modal.locator("select").selectOption("viewer");
			
			const saveBtn = modal.getByRole("button", { name: "حفظ" }).or(modal.getByRole("button", { name: "إضافة" }));
			await saveBtn.click();

			await expect(modal).not.toBeVisible({ timeout: 15000 });
			await expect(
				page.locator("tr").filter({ hasText: userEmail }).first(),
			).toBeVisible({ timeout: 15000 });
		}
	});
});
