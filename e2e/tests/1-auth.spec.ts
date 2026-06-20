import { expect, test } from "@playwright/test";

// تعطيل الجلسة المحفوظة لهذا الملف فقط لنتمكن من اختبار شاشة الدخول
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("1. اختبار الأمان والمصادقة (Auth & Security)", () => {
	test("يمنع الدخول للصفحات المحمية ويختبر إدخال بيانات خاطئة", async ({
		page,
	}) => {
	// 1. محاولة الدخول لصفحة محمية (الجلسات) — يجب أن يُعاد توجيهنا للدخول
	await page.goto("/sessions");
	await page.waitForLoadState("networkidle");
	await expect(page).toHaveURL(/.*login.*/, { timeout: 30000 });

	// التحقق من وجود حقل البريد الإلكتروني وكلمة المرور
	const emailInput = page.locator('[data-testid="login-email-input"]');
	await expect(emailInput).toBeVisible({ timeout: 15000 });

	const passwordInput = page.locator('[data-testid="login-password-input"]');
	await expect(passwordInput).toBeVisible();

	const loginBtn = page.locator('[data-testid="login-submit-button"]');
	await expect(loginBtn).toBeVisible();

	// 2. تجربة تفاعل: كتابة بيانات خاطئة للتأكد من رسالة الخطأ
	await emailInput.fill("wrong@example.com");
	await passwordInput.fill("wrongpassword123");
	await loginBtn.click();

	// يجب أن تظهر رسالة تفيد بخطأ في البيانات
	const errorMsg = page.locator('[data-testid="login-error-message"]');
	await expect(errorMsg).toBeVisible({ timeout: 30000 });
	await expect(errorMsg).toContainText("البريد الإلكتروني أو كلمة المرور غير صحيحة");
});
});
