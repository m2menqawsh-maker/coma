import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BanksManager from "../components/BanksManager";

// Mock toast
vi.mock("react-hot-toast", () => ({
	default: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

const mockAccounts = [
	{
		id: "acc-1",
		name: "بنك فلسطين",
		account_type: "bank",
		balance: 1000,
		total_in: 2000,
		total_out: 1000,
		pending_in: 0,
		pending_count: 0,
		phone: "123456",
	},
	{
		id: "acc-2",
		name: "جوال باي",
		account_type: "wallet",
		balance: 500,
		total_in: 800,
		total_out: 300,
		pending_in: 0,
		pending_count: 0,
		phone: "654321",
	},
];

const mockTransfers = [
	{
		id: "trans-1",
		bank_account_id: "acc-1",
		date: "2026-10-20",
		amount: 250,
		direction: "in",
		status: "confirmed",
		sender_name: "حوالة بنك فلسطين 1",
		created_at: "2026-10-20T10:00:00Z",
		bank_accounts: { name: "بنك فلسطين" },
	},
	{
		id: "trans-2",
		bank_account_id: "acc-2",
		date: "2026-10-21",
		amount: 150,
		direction: "in",
		status: "confirmed",
		sender_name: "حوالة جوال باي 2",
		created_at: "2026-10-21T11:00:00Z",
		bank_accounts: { name: "جوال باي" },
	},
];

const { mockFrom } = vi.hoisted(() => {
	const mockFrom = vi.fn((table: string) => {
		if (table === "bank_transfers") {
			const currentFilters: Record<string, any> = {};
			const chain: any = {
				select: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
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
				then: (resolve: any) => {
					let filtered = [...mockTransfers];
					if (currentFilters.bank_account_id) {
						filtered = filtered.filter(
							(t) => t.bank_account_id === currentFilters.bank_account_id,
						);
					}
					if (currentFilters.status) {
						filtered = filtered.filter((t) => t.status === currentFilters.status);
					}
					if (currentFilters.direction) {
						filtered = filtered.filter(
							(t) => t.direction === currentFilters.direction,
						);
					}
					return resolve({ data: filtered, error: null });
				},
			};
			return chain;
		}

		if (table === "bank_account_balances") {
			return {
				select: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				then: (resolve: any) => resolve({ data: mockAccounts, error: null }),
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
	}),
}));

describe("BanksManager Account and Filter Integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("filters transfers to only selected account when account card is clicked", async () => {
		render(<BanksManager />);

		// Initially both transfers should be visible
		await waitFor(() => {
			expect(screen.getByText("حوالة بنك فلسطين 1")).toBeInTheDocument();
			expect(screen.getByText("حوالة جوال باي 2")).toBeInTheDocument();
		});

		// Click on "بنك فلسطين" account card (first occurrence is the card)
		const bankCard = screen.getAllByText("بنك فلسطين")[0];
		fireEvent.click(bankCard);

		// Table should update and show ONLY transfers for بنك فلسطين
		await waitFor(() => {
			expect(screen.getByText("حوالة بنك فلسطين 1")).toBeInTheDocument();
			expect(
				screen.queryByText("حوالة جوال باي 2"),
			).not.toBeInTheDocument();
		});

		// Click on "كل الحسابات" card to reset selection
		const allAccountsCard = screen.getByText("كل الحسابات");
		fireEvent.click(allAccountsCard);

		// Both transfers should be visible again
		await waitFor(() => {
			expect(screen.getByText("حوالة بنك فلسطين 1")).toBeInTheDocument();
			expect(screen.getByText("حوالة جوال باي 2")).toBeInTheDocument();
		});
	});

	it("re-queries transfers when direction filter is changed", async () => {
		render(<BanksManager />);

		await waitFor(() => {
			expect(screen.getByText("حوالة بنك فلسطين 1")).toBeInTheDocument();
		});

		// Change direction filter to "out" (صادر)
		const selects = screen.getAllByRole("combobox");
		const dirSelect = selects[1]; // direction select
		fireEvent.change(dirSelect, { target: { value: "out" } });

		// Transfers list should become empty as both mock transfers are "in"
		await waitFor(() => {
			expect(
				screen.queryByText("حوالة بنك فلسطين 1"),
			).not.toBeInTheDocument();
			expect(screen.getByText("لا توجد حوالات")).toBeInTheDocument();
		});
	});
});
