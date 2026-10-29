import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

// Mock Supabase
const mockRpc = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn(() => ({
		rpc: mockRpc,
	})),
}));

describe("GET /api/invoices/today", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.EXTERNAL_API_KEY = "test-secret-key-123";
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";

		mockRpc.mockResolvedValue({
			data: [
				{
					id: "inv-1",
					customer_name: "مهند سليمان",
					device: "mobile",
					duration_minutes: 120,
					session_amount: 20,
					products_amount: 15,
					total_due: 35,
					cash_paid: 35,
					bank_paid: 0,
					debt_created: 0,
					status: "paid",
					session_start: "2026-10-20T08:00:00Z",
					session_end: "2026-10-20T10:00:00Z",
					bank_account_id: null,
					bank_account_name: null,
					package_name: null,
					items: [
						{
							id: "item-1",
							product_name: "شاي بالنعناع",
							quantity: 1,
							price_per_unit: 5,
							total_price: 5,
						},
						{
							id: "item-2",
							product_name: "ساندويش جبنة",
							quantity: 1,
							price_per_unit: 10,
							total_price: 10,
						},
					],
				},
				{
					id: "inv-2",
					customer_name: "أحمد علي",
					device: "laptop",
					duration_minutes: 60,
					session_amount: 20,
					products_amount: 0,
					total_due: 20,
					cash_paid: 0,
					bank_paid: 20,
					debt_created: 0,
					status: "paid",
					session_start: "2026-10-20T11:00:00Z",
					session_end: "2026-10-20T12:00:00Z",
					bank_account_id: "bank-pal-1",
					bank_account_name: "بنك فلسطين",
					package_name: null,
					items: [],
				},
			],
			error: null,
		});
	});

	it("returns 401 when no API key is provided", async () => {
		const req = new Request("http://localhost:3000/api/invoices/today");
		const res = await GET(req);

		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error).toBe("Unauthorized: Missing or invalid API key");
	});

	it("returns 401 when invalid API key is provided", async () => {
		const req = new Request("http://localhost:3000/api/invoices/today", {
			headers: { "x-api-key": "wrong-key" },
		});
		const res = await GET(req);

		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error).toBe("Unauthorized: Missing or invalid API key");
	});

	it("returns 200 and today's invoices with bank details when valid x-api-key is provided", async () => {
		const req = new Request("http://localhost:3000/api/invoices/today", {
			headers: { "x-api-key": "test-secret-key-123" },
		});
		const res = await GET(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.count).toBe(2);
		expect(json.summary).toBeDefined();
		expect(json.summary.total_revenue).toBe(55);
		expect(json.summary.total_products).toBe(15);
		expect(json.summary.total_sessions).toBe(40);
		expect(json.summary.total_cash).toBe(35);
		expect(json.summary.total_bank).toBe(20);
		expect(json.summary.banks_breakdown["بنك فلسطين"]).toBe(20);

		expect(json.invoices).toHaveLength(2);
		expect(json.invoices[0].items).toHaveLength(2);
		expect(json.invoices[0].items[0].product_name).toBe("شاي بالنعناع");

		// Bank details validation
		expect(json.invoices[1].bank_paid).toBe(20);
		expect(json.invoices[1].bank_account_id).toBe("bank-pal-1");
		expect(json.invoices[1].bank_account_name).toBe("بنك فلسطين");
		expect(json.invoices[1].bank_name).toBe("بنك فلسطين");
	});

	it("accepts valid key via Authorization Bearer header", async () => {
		const req = new Request("http://localhost:3000/api/invoices/today", {
			headers: { authorization: "Bearer test-secret-key-123" },
		});
		const res = await GET(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.count).toBe(2);
	});

	it("supports custom date query parameter ?date=YYYY-MM-DD", async () => {
		const req = new Request("http://localhost:3000/api/invoices/today?date=2026-10-20", {
			headers: { "x-api-key": "test-secret-key-123" },
		});
		const res = await GET(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.date).toBe("2026-10-20");
		expect(mockRpc).toHaveBeenCalledWith("get_daily_invoices", {
			p_date: "2026-10-20",
			p_timezone: "Asia/Jerusalem",
		});
	});
});
