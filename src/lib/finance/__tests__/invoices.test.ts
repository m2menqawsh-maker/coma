import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals, type InvoiceTotalsInput } from "../invoices";

describe("finance invoices logic", () => {
	it("calculateInvoiceTotals calculates correctly without discount or credit", () => {
		const input: InvoiceTotalsInput = {
			sessionAmount: 10,
			ordersTotal: 20,
			discount: 0,
			creditApplied: 0,
			totalPaid: 30,
			totalCost: 15,
		};

		const result = calculateInvoiceTotals(input);
		expect(result.totalAmount).toBe(30);
		expect(result.baseTotal).toBe(30);
		expect(result.totalDue).toBe(30);
		expect(result.overpaidRaw).toBe(0);
		expect(result.debtCreated).toBe(0);
		expect(result.grossProfit).toBe(15); // 30 - 15
	});

	it("calculateInvoiceTotals handles discount and credit correctly", () => {
		const input: InvoiceTotalsInput = {
			sessionAmount: 20,
			ordersTotal: 30,
			discount: 10,
			creditApplied: 5,
			totalPaid: 35,
			totalCost: 20,
		};

		const result = calculateInvoiceTotals(input);
		expect(result.totalAmount).toBe(50);
		expect(result.baseTotal).toBe(40); // 50 - 10
		expect(result.totalDue).toBe(35); // 40 - 5
		expect(result.overpaidRaw).toBe(0); // 35 paid vs 35 due
		expect(result.debtCreated).toBe(0);
		expect(result.grossProfit).toBe(15); // 35 due - 20 cost
	});

	it("calculateInvoiceTotals handles partial payment (debt created)", () => {
		const input: InvoiceTotalsInput = {
			sessionAmount: 10,
			ordersTotal: 10,
			discount: 0,
			creditApplied: 0,
			totalPaid: 15,
			totalCost: 8,
		};

		const result = calculateInvoiceTotals(input);
		expect(result.totalDue).toBe(20);
		expect(result.overpaidRaw).toBe(0);
		expect(result.debtCreated).toBe(5); // 20 - 15
		expect(result.grossProfit).toBe(12); // 20 - 8
	});

	it("calculateInvoiceTotals handles overpayment", () => {
		const input: InvoiceTotalsInput = {
			sessionAmount: 10,
			ordersTotal: 10,
			discount: 0,
			creditApplied: 0,
			totalPaid: 30,
			totalCost: 5,
		};

		const result = calculateInvoiceTotals(input);
		expect(result.totalDue).toBe(20);
		expect(result.overpaidRaw).toBe(10); // 30 paid - 20 due
		expect(result.debtCreated).toBe(0);
	});
});
