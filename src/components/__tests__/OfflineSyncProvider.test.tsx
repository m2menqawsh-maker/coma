import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { OfflineSyncProvider } from "../OfflineSyncProvider";

// Mock react-toastify to avoid errors in tests
vi.mock("react-toastify", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
	},
}));

vi.mock("next/navigation", () => ({
	useRouter() {
		return {
			push: vi.fn(),
			replace: vi.fn(),
			prefetch: vi.fn(),
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
		};
	},
}));

describe("OfflineSyncProvider Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("navigator", { onLine: true });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("renders children correctly", () => {
		render(
			<OfflineSyncProvider>
				<div data-testid="test-child">Test Child Content</div>
			</OfflineSyncProvider>,
		);

		expect(screen.getByTestId("test-child")).toBeInTheDocument();
		expect(screen.getByText("Test Child Content")).toBeInTheDocument();
	});

	it("responds to offline and online events", () => {
		render(
			<OfflineSyncProvider>
				<div>Test</div>
			</OfflineSyncProvider>,
		);

		// Simulate offline
		act(() => {
			vi.stubGlobal("navigator", { onLine: false });
			window.dispatchEvent(new Event("offline"));
		});

		// Simulate online
		act(() => {
			vi.stubGlobal("navigator", { onLine: true });
			window.dispatchEvent(new Event("online"));
		});
	});
});
