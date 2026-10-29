import { describe, expect, it, vi } from "vitest";
import { processGroupCheckout, processSingleCheckout } from "../actions/checkout";

describe("sessions/actions/checkout bank validation", () => {
	const mockSupabase = {
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } } }),
		},
		from: vi.fn(() => ({
			insert: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({ data: { id: "inv-1" }, error: null }),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			in: vi.fn().mockReturnThis(),
			gt: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
		})),
	};

	const baseParams: any = {
		session: {
			id: "s-1",
			customer_id: "c-1",
			customer_name: "أحمد",
			start_time: "2026-10-29T10:00:00Z",
			device: "mobile",
		},
		customer: { id: "c-1", name: "أحمد", balance: 0 },
		deviceChanges: [],
		pricing: {
			mobile_rate: 10,
			laptop_rate: 15,
			mobile_place_cost: 2,
			laptop_place_cost: 3,
			dev_percent: 20,
		},
		orders: [],
		initialDev: "mobile",
		sessionAmount: 20,
		ordersTotal: 0,
		discount: 0,
		creditApplied: 0,
		placeCost: 4,
		productsCost: 0,
		totalCost: 4,
		cash: 0,
		bank: 20,
		bankAccountId: null,
		notes: "",
		grossProfit: 16,
		devCut: 3.2,
		netProfit: 12.8,
		totalDue: 20,
		debtCreated: 0,
		overpaidRaw: 0,
		debtClearedByOverpay: 0,
	};

	it("processSingleCheckout throws when bank > 0 but bankAccountId is null or empty", async () => {
		await expect(
			processSingleCheckout(mockSupabase, {
				...baseParams,
				bank: 20,
				bankAccountId: null,
			}),
		).rejects.toThrow("يجب اختيار الحساب البنكي");

		await expect(
			processSingleCheckout(mockSupabase, {
				...baseParams,
				bank: 20,
				bankAccountId: "",
			}),
		).rejects.toThrow("يجب اختيار الحساب البنكي");
	});

	it("processSingleCheckout succeeds when bank > 0 and bankAccountId is provided", async () => {
		const insertSpy = vi.fn().mockReturnThis();
		const customMockSupabase = {
			auth: {
				getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } } }),
			},
			from: vi.fn((table: string) => ({
				insert: insertSpy,
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({ data: { id: "inv-1" }, error: null }),
				update: vi.fn().mockReturnThis(),
				delete: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
			})),
		};

		await expect(
			processSingleCheckout(customMockSupabase, {
				...baseParams,
				bank: 20,
				bankAccountId: "acc-1",
			}),
		).resolves.not.toThrow();

		// Check invoices insert contained bank_account_id: 'acc-1'
		expect(insertSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				bank_paid: 20,
				bank_account_id: "acc-1",
			}),
		);
	});

	it("processSingleCheckout clears bankAccountId when bank is 0 even if id passed", async () => {
		const insertSpy = vi.fn().mockReturnThis();
		const customMockSupabase = {
			auth: {
				getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } } }),
			},
			from: vi.fn(() => ({
				insert: insertSpy,
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({ data: { id: "inv-1" }, error: null }),
				update: vi.fn().mockReturnThis(),
				delete: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
			})),
		};

		await expect(
			processSingleCheckout(customMockSupabase, {
				...baseParams,
				cash: 20,
				bank: 0,
				bankAccountId: "leftover-acc",
			}),
		).resolves.not.toThrow();

		expect(insertSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				bank_paid: 0,
				bank_account_id: null,
			}),
		);
	});

	it("processSingleCheckout allows bank = 0 with bankAccountId = null", async () => {
		await expect(
			processSingleCheckout(mockSupabase, {
				...baseParams,
				cash: 20,
				bank: 0,
				bankAccountId: null,
			}),
		).resolves.not.toThrow();
	});

	it("processGroupCheckout throws when bank > 0 but bankAccountId is null or empty", async () => {
		const groupParams: any = {
			groupSelected: ["s-1", "s-2"],
			groupPrimaryId: "s-1",
			selectedSessions: [
				{ id: "s-1", start_time: new Date().toISOString(), customer_name: "أحمد" },
				{ id: "s-2", start_time: new Date().toISOString(), customer_name: "محمد" },
			],
			sessionAmounts: [
				{
					session: { id: "s-1", start_time: new Date().toISOString(), customer_name: "أحمد" },
					changes: [],
					initialDev: "mobile",
					sessionAmt: 20,
					ordersAmt: 0,
				},
				{
					session: { id: "s-2", start_time: new Date().toISOString(), customer_name: "محمد" },
					changes: [],
					initialDev: "mobile",
					sessionAmt: 20,
					ordersAmt: 0,
				},
			],
			orders: {},
			pricing: baseParams.pricing,
			primaryCustomer: baseParams.customer,
			discount: 0,
			creditApplied: 0,
			cash: 0,
			bank: 40,
			bankAccountId: null,
			notes: "",
			debtCreated: 0,
			overpaidRaw: 0,
			totalPaid: 40,
		};

		await expect(
			processGroupCheckout(mockSupabase, groupParams),
		).rejects.toThrow("يجب اختيار الحساب البنكي");

		await expect(
			processGroupCheckout(mockSupabase, {
				...groupParams,
				bankAccountId: "",
			}),
		).rejects.toThrow("يجب اختيار الحساب البنكي");
	});
});
