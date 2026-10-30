import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InvoiceDetailsModal from "../components/InvoiceDetailsModal";
import type { CustomerMovement, Invoice } from "../types";

const mockInvoice: Invoice = {
	id: "inv-101",
	customer_id: "cust-1",
	customer_name: "مؤمن أحمد",
	session_start: "2026-10-30T10:00:00Z",
	session_end: "2026-10-30T12:00:00Z",
	duration_minutes: 120,
	device: "laptop",
	session_amount: 30,
	products_amount: 20,
	total_amount: 50,
	discount_amount: 0,
	total_due: 50,
	place_cost: 10,
	products_cost: 10,
	total_cost: 20,
	gross_profit: 30,
	net_profit: 30,
	cash_paid: 0,
	bank_paid: 50,
	debt_created: 0,
	credit_applied: 0,
	status: "paid",
	notes: null,
	created_at: "2026-10-30T12:00:00Z",
	hourly_rate_snapshot: 15,
	bank_account_id: "bank-1",
	bank_accounts: { name: "بنك فلسطين" },
};

const mockMovements: CustomerMovement[] = [
	{
		id: "mv-1",
		invoice_id: "inv-101",
		amount: 50,
		channel: "bank",
		date: "2026-10-30",
		note: "دفعة حساب",
		created_at: "2026-10-30T12:05:00Z",
		bank_accounts: { name: "جوال باي" },
	},
];

describe("InvoiceDetailsModal Component", () => {
	it("renders destination bank account name when bank_paid > 0", () => {
		render(
			<InvoiceDetailsModal
				invoice={mockInvoice}
				items={[]}
				movements={[]}
				loadingItems={false}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByText("بنك فلسطين")).toBeInTheDocument();
	});

	it("renders bank account name in customer movements when movement channel is bank", () => {
		render(
			<InvoiceDetailsModal
				invoice={mockInvoice}
				items={[]}
				movements={mockMovements}
				loadingItems={false}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByText(/جوال باي/)).toBeInTheDocument();
	});
});
