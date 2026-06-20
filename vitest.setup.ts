import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-key";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
	createClient: vi.fn(() => ({
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
				order: vi.fn(() => ({
					limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
				})),
			})),
			insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
			update: vi.fn(() => Promise.resolve({ data: null, error: null })),
			delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
		})),
	})),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});
