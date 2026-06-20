import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // forced to 1 for dev server stability
	timeout: 120000,
	reporter: "html",
	globalSetup: require.resolve("./e2e/global-setup"),
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		storageState: "e2e/storageState.json",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: "npm run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});
