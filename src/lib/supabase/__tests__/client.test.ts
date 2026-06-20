import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../client";

// Mock the @supabase/ssr module
vi.mock("@supabase/ssr", () => ({
	createBrowserClient: vi.fn(() => ({
		from: vi.fn(() => ({
			select: vi.fn(),
			insert: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		})),
	})),
}));

describe("Supabase Client configuration", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
			NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
		};
	});

	it("exports a createClient function that returns a client", () => {
		const supabase = createClient();
		expect(supabase).toBeDefined();
		expect(typeof supabase.from).toBe("function");
	});
});
