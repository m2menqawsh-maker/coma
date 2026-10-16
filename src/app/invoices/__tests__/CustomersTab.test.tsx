import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CustomersTab from "../components/CustomersTab";

// Mock toast
vi.mock("react-hot-toast", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock cache.utils
vi.mock("@/lib/supabase/cache.utils", () => ({
	evictTableCache: vi.fn(),
}));

const { mockDeleteEq, mockDelete, mockUpdateEq, mockUpdate, mockFrom, mockCustomersData } = vi.hoisted(() => {
	const mockDeleteEq = vi.fn();
	const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
	const mockUpdateEq = vi.fn();
	const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

	const mockCustomersData = [
		{
			id: "cust-1",
			name: "أحمد محمد",
			phone: "0591234567",
			balance: 0,
			last_visit_at: "2026-10-15T12:00:00Z",
			is_vip: false,
		},
		{
			id: "cust-2",
			name: "خالد سعيد",
			phone: "0597654321",
			balance: -150,
			last_visit_at: "2026-10-14T10:00:00Z",
			is_vip: true,
		},
	];

	const mockFrom = vi.fn((table: string) => {
		if (table === "customers") {
			return {
				select: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				then: (resolve: any) => resolve({ data: mockCustomersData, error: null }),
				delete: mockDelete,
				update: mockUpdate,
			};
		}
		if (table === "invoices") {
			return {
				select: vi.fn().mockReturnThis(),
				not: vi.fn().mockReturnThis(),
				then: (resolve: any) => resolve({ data: [], error: null }),
			};
		}
		if (table === "subscriptions") {
			return {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				then: (resolve: any) => resolve({ data: [], error: null }),
			};
		}
		return {
			select: vi.fn().mockReturnThis(),
			then: (resolve: any) => resolve({ data: [], error: null }),
		};
	});

	return { mockDeleteEq, mockDelete, mockUpdateEq, mockUpdate, mockFrom, mockCustomersData };
});

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		from: mockFrom,
	}),
}));

describe("CustomersTab Component", () => {
	const storage: Record<string, string> = {};
	beforeEach(() => {
		vi.clearAllMocks();
		mockDeleteEq.mockResolvedValue({ error: null });
		Object.keys(storage).forEach((k) => delete storage[k]);
		vi.stubGlobal("localStorage", {
			getItem: vi.fn((key: string) => storage[key] || null),
			setItem: vi.fn((key: string, value: string) => {
				storage[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete storage[key];
			}),
			clear: vi.fn(() => {
				Object.keys(storage).forEach((k) => delete storage[k]);
			}),
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("renders customer rows and delete buttons", async () => {
		render(<CustomersTab />);

		await waitFor(() => {
			expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
			expect(screen.getByText("خالد سعيد")).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByRole("button", { name: /حذف/i });
		expect(deleteButtons.length).toBe(2);
	});

	it("opens DoubleConfirmModal when delete button is clicked", async () => {
		render(<CustomersTab />);

		await waitFor(() => {
			expect(screen.getByText("خالد سعيد")).toBeInTheDocument();
		});

		// Khaled is VIP so he appears first (index 0)
		const deleteButtons = screen.getAllByRole("button", { name: /حذف/i });
		fireEvent.click(deleteButtons[0]); // Khaled who has -150 balance

		expect(screen.getByText("تأكيد حذف الزبون")).toBeInTheDocument();
		expect(screen.getByText(/تحذير مالي هام.*150\.00/i)).toBeInTheDocument();
	});

	it("deletes customer when confirmWord is typed and confirmed", async () => {
		const user = userEvent.setup();
		render(<CustomersTab />);

		await waitFor(() => {
			expect(screen.getByText("خالد سعيد")).toBeInTheDocument();
		});

		// Khaled is index 0
		const deleteButtons = screen.getAllByRole("button", { name: /حذف/i });
		fireEvent.click(deleteButtons[0]); // Khaled

		const input = screen.getByPlaceholderText("اكتب حذف...");
		await user.type(input, "حذف");

		const confirmBtn = screen.getByRole("button", { name: "تأكيد العملية" });
		expect(confirmBtn).not.toBeDisabled();

		fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(mockDelete).toHaveBeenCalled();
			expect(mockDeleteEq).toHaveBeenCalledWith("id", "cust-2");
			expect(screen.queryByText("خالد سعيد")).not.toBeInTheDocument();
		});
	});

	it("cancels deletion when cancel button is clicked", async () => {
		render(<CustomersTab />);

		await waitFor(() => {
			expect(screen.getByText("خالد سعيد")).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByRole("button", { name: /حذف/i });
		fireEvent.click(deleteButtons[0]);

		const cancelBtn = screen.getByRole("button", { name: "تراجع وإلغاء" });
		fireEvent.click(cancelBtn);

		expect(screen.queryByText("تأكيد حذف الزبون")).not.toBeInTheDocument();
		expect(mockDelete).not.toHaveBeenCalled();
		expect(screen.getByText("خالد سعيد")).toBeInTheDocument();
	});
});
