import { expect, test } from "@playwright/test";

test.describe("7. المزامنة دون اتصال (Offline Sync)", () => {
	test("إنشاء جلسة في وضع أوفلاين والمزامنة تلقائياً عند عودة الاتصال", async ({
		context,
		page,
	}) => {
		test.setTimeout(120000);
		// 1. زيارة صفحة الجلسات والتأكد من أنها متصلة بالإنترنت
		await page.goto("/sessions");
		await page.waitForLoadState("networkidle");
		await expect(
			page.locator("h1").getByText("الجلسات النشطة").first(),
		).toBeVisible({ timeout: 15000 });

		// 2. تفعيل وضع عدم الاتصال (Offline Mode) برمجياً
		await context.setOffline(true);

		// 3. محاولة إنشاء جلسة جديدة أثناء انقطاع الاتصال
		await page.getByRole("button", { name: "+ جلسة جديدة" }).click();

		const customerName = `E2E Offline ${Date.now()}`;
		await page.getByPlaceholder("ابحث بالاسم أو الرقم...").fill(customerName);

		const registerBtn = page.locator("button").filter({ hasText: "ليس من القائمة" });
		await expect(registerBtn).toBeVisible({ timeout: 15000 });
		await registerBtn.click();

		const phoneInput = page.getByPlaceholder("رقم الهاتف *");
		await expect(phoneInput).toBeVisible({ timeout: 10000 });
		await phoneInput.fill("05900001111");

		await page.getByRole("button", { name: "📱 موبايل" }).click();
		await page.getByRole("button", { name: "فتح الجلسة" }).click();

		// 4. التحقق من ظهور التنبيه البصري لوضع عدم الاتصال وعدد التغييرات المعلقة
		await expect(page.getByText("📡 غير متصل")).toBeVisible({ timeout: 15000 });
		await expect(page.getByText("تغييرات")).toBeVisible({ timeout: 15000 });

		// 5. استعادة الاتصال بالإنترنت
		await context.setOffline(false);

		// انتظار المزامنة — يجب أن يختفي مؤشر "غير متصل"
		await expect(page.getByText("📡 غير متصل")).not.toBeVisible({ timeout: 30000 });

		// ننتظر حتى تختفي كلمة تغييرات (دليل على المزامنة)
		await expect(page.getByText("تغييرات")).not.toBeVisible({ timeout: 30000 });

		// 6. إعادة تحميل الصفحة لجلب البيانات المحدّثة من Supabase
		await page.reload();
		await page.waitForLoadState("networkidle");

		// التحقق من ظهور الجلسة بعد المزامنة وإعادة التحميل
		await expect(page.getByText(customerName).first()).toBeVisible({ timeout: 15000 });

		// تنظيف الجلسة من الواجهة لتجنب تلويث البيانات
		page.on("dialog", (dialog) => dialog.accept());
		
		let cardsCount = await page.locator("div.grid > div").filter({ hasText: customerName }).count();
		while (cardsCount > 0) {
			await page.locator("div.grid > div").filter({ hasText: customerName }).first().getByTitle("حذف الجلسة").click();
			await expect(page.getByText("تم حذف الجلسة")).toBeVisible({ timeout: 15000 });
			
			// Wait for the toast to disappear to avoid overlapping toasts
			await expect(page.getByText("تم حذف الجلسة")).not.toBeVisible({ timeout: 15000 });
			
			cardsCount = await page.locator("div.grid > div").filter({ hasText: customerName }).count();
		}
		
		await page.reload();
		await page.waitForLoadState("networkidle");

		// انتظار اختفاء الكارت
		await expect(page.locator("div.grid > div").filter({ hasText: customerName }).first()).not.toBeVisible({ timeout: 15000 });
	});
});
