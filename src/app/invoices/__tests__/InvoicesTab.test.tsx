import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvoicesTab from "../components/InvoicesTab";

// Mock toast
vi.mock("react-hot-toast", () => ({
	default: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock DashboardChart to avoid canvas/svg issues in jsdom
vi.mock("@/components/DashboardChart", () => ({
	default: () => <div data-testid="dashboard-chart">Chart</div>,
}));

const mockInvoices = [
	{
		id: "inv-1",
		customer_name: "أحمد علي",
		device: "mobile",
		status: "paid",
		session_start: "2026-10-20T10:00:00Z",
		session_end: "2026-10-20T12:00:00Z",
		duration_minutes: 120,
		session_amount: 20,
		products_amount: 10,
		total_due: 30,
		cash_paid: 30,
		bank_paid: 0,
		credit_applied: 0,
		debt_created: 0,
		net_profit: 25,
		created_at: "2026-10-20T12:00:00Z",
	},
	{
		id: "inv-2",
		customer_name: "محمد حسن",
		device: "laptop",
		status: "debt",
		session_start: "2026-10-21T10:00:00Z",
		session_end: "2026-10-21T13:00:00Z",
		duration_minutes: 180,
		session_amount: 35,
		products_amount: 15,
		total_due: 50,
		cash_paid: 0,
		bank_paid: 0,
		credit_applied: 0,
		debt_created: 50,
		net_profit: 40,
		created_at: "2026-10-21T13:00:00Z",
	},
];

const { mockFrom } = vi.hoisted(() => {
	const mockFrom = vi.fn((table: string) => {
		if (table === "invoices") {
			const currentFilters: Record<string, any> = {};
			const chain: any = {
				select: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				eq: vi.fn((col: string, val: any) => {
					currentFilters[col] = val;
					return chain;
				}),
				gte: vi.fn((col: string, val: any) => {
					currentFilters[`${col}_gte`] = val;
					return chain;
				}),
				lte: vi.fn((col: string, val: any) => {
					currentFilters[`${col}_lte`] = val;
					return chain;
				}),
				ilike: vi.fn((col: string, val: any) => {
					currentFilters[`${col}_ilike`] = val;
					return chain;
				}),
				then: (resolve: any) => {
					let filtered = [...mockInvoices];
					if (currentFilters.customer_name_ilike) {
						const term = currentFilters.customer_name_ilike.replace(/%/g, "");
						filtered = filtered.filter((i) => i.customer_name.includes(term));
					}
					if (currentFilters.status) {
						filtered = filtered.filter((i) => i.status === currentFilters.status);
					}
					if (currentFilters.device) {
						filtered = filtered.filter((i) => i.device === currentFilters.device);
					}
					return resolve({ data: filtered, error: null });
				},
			};
			return chain;
		}

		if (table === "bank_accounts") {
			return {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				then: (resolve: any) => resolve({ data: [], error: null }),
			};
		}

		return {
			select: vi.fn().mockReturnThis(),
			then: (resolve: any) => resolve({ data: [], error: null }),
		};
	});

	return { mockFrom };
});

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		from: mockFrom,
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
		},
	}),
}));

describe("InvoicesTab Search and Filter Integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("re-queries and updates invoices when user searches by customer name", async () => {
		render(<InvoicesTab />);

		// Wait for initial load
		await waitFor(() => {
			expect(screen.getByText("أحمد علي")).toBeInTheDocument();
			expect(screen.getByText("محمد حسن")).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText("اسم العميل...");
		fireEvent.change(searchInput, { target: { value: "محمد" } });

		// Should filter to only "محمد حسن"
		await waitFor(
			() => {
				expect(screen.getByText("محمد حسن")).toBeInTheDocument();
				expect(screen.queryByText("أحمد علي")).not.toBeInTheDocument();
			},
			{ timeout: 1000 },
		);
	});

	it("re-queries and updates invoices when user changes status filter", async () => {
		render(<InvoicesTab />);

		await waitFor(() => {
			expect(screen.getByText("أحمد علي")).toBeInTheDocument();
		});

		const selects = screen.getAllByRole("combobox");
		const statusSelect = selects[0]; // first select is status

		fireEvent.change(statusSelect, { target: { value: "debt" } });

		await waitFor(
			() => {
				expect(screen.getByText("محمد حسن")).toBeInTheDocument();
				expect(screen.queryByText("أحمد علي")).not.toBeInTheDocument();
			},
			{ timeout: 1000 },
		);
	});

	it("resets all filters and shows all invoices when clear filters is clicked", async () => {
		render(<InvoicesTab />);

		await waitFor(() => {
			expect(screen.getByText("أحمد علي")).toBeInTheDocument();
		});

		// Apply a filter
		const selects = screen.getAllByRole("combobox");
		fireEvent.change(selects[0], { target: { value: "debt" } });

		await waitFor(() => {
			expect(screen.queryByText("أحمد علي")).not.toBeInTheDocument();
		});

		// Click "مسح الفلاتر"
		const clearBtn = screen.getByText("مسح الفلاتر");
		fireEvent.click(clearBtn);

		await waitFor(() => {
			expect(screen.getByText("أحمد علي")).toBeInTheDocument();
			expect(screen.getByText("محمد حسن")).toBeInTheDocument();
		});
	});
});
