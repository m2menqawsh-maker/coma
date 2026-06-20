import { chromium } from "@playwright/test";

async function globalSetup() {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Go to login page
	await page.goto("http://localhost:3000/login");

	// Wait for React to hydrate
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000); // extra safety

	// Fill credentials
	await page.locator('[data-testid="login-email-input"]').fill("m2menqawsh@gmail.com");
	await page.locator('[data-testid="login-password-input"]').fill("123456");

	// Click login
	await page.locator('[data-testid="login-submit-button"]').click();

	// Check for error messages first
	try {
		const errorLocator = page.locator('[data-testid="login-error-message"]');
		await errorLocator.waitFor({ state: "visible", timeout: 5000 });
		const errorMsg = await errorLocator.innerText();
		console.error("LOGIN ERROR MESSAGE:", errorMsg);
		throw new Error(`Login failed with message: ${errorMsg}`);
	} catch (e) {
		if (e instanceof Error && e.message.includes("Login failed with message")) {
			await page.screenshot({ path: "login-error.png" });
			throw e;
		}
		// If the error message didn't appear, assume it might be successful or another error
	}

	// Wait until we are redirected to home
	try {
		await page.waitForURL("http://localhost:3000/", { timeout: 15000 });
	} catch (e) {
		await page.screenshot({ path: "login-timeout-error.png" });
		throw new Error("Timed out waiting for redirect to / after login. Check credentials or network.");
	}

	// Save storage state (cookies + localStorage)
	await page.context().storageState({ path: "e2e/storageState.json" });

	await browser.close();
}

export default globalSetup;
