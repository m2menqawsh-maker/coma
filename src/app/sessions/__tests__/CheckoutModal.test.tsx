import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import CheckoutModal from "../components/CheckoutModal";
import * as checkoutActions from "../actions/checkout";

// Mock Supabase
vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({ data: null, error: null }),
		})),
	}),
}));

describe("CheckoutModal Component Bank Validation", () => {
	const onCloseMock = vi.fn();
	const onSuccessMock = vi.fn();
	const onErrorMock = vi.fn();

	const defaultProps = {
		session: {
			id: "s-1",
			customer_id: "c-1",
			customer_name: "أحمد علي",
			start_time: new Date(Date.now() - 3600000).toISOString(),
			device: "mobile" as const,
			hourly_rate: 10,
			place_cost_rate: 2,
			created_at: new Date().toISOString(),
		},
		orders: [],
		deviceChanges: [],
		pricing: {
			id: "p-1",
			mobile_rate: 10,
			laptop_rate: 15,
			mobile_place_cost: 2,
			laptop_place_cost: 3,
			dev_percent: 20,
			effective_from: new Date().toISOString(),
		},
		bankAccounts: [
			{ id: "b-1", name: "بنك فلسطين", is_active: true },
			{ id: "b-2", name: "جوال باي", is_active: true },
		],
		packages: [],
		packageItems: [],
		onClose: onCloseMock,
		onSuccess: onSuccessMock,
		onError: onErrorMock,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("blocks checkout when bank payment is entered without choosing a bank account", async () => {
		const checkoutSpy = vi.spyOn(checkoutActions, "processSingleCheckout");

		render(<CheckoutModal {...defaultProps} />);

		// Wait for customer data loading to enable the checkout button
		const checkoutBtn = screen.getByText("إغلاق وتسجيل");
		await waitFor(() => expect(checkoutBtn).not.toBeDisabled());

		// Enter bank transfer amount (3rd number input: discount, cash, bank)
		const bankInputs = screen.getAllByRole("spinbutton");
		const bankInput = bankInputs[2];
		fireEvent.change(bankInput, { target: { value: "50" } });

		// Verify warning message is visible in real-time
		expect(
			screen.getByText("⚠️ يجب تحديد الحساب البنكي المستقبل للحوالة"),
		).toBeInTheDocument();

		// Click checkout button
		fireEvent.click(checkoutBtn);

		expect(onErrorMock).toHaveBeenCalledWith(
			"يرجى اختيار الحساب البنكي لاستقبال الحوالة.",
		);
		expect(checkoutSpy).not.toHaveBeenCalled();
	});

	it("shows warning and blocks checkout if bank > 0 but no bank accounts exist", async () => {
		const checkoutSpy = vi.spyOn(checkoutActions, "processSingleCheckout");

		render(<CheckoutModal {...defaultProps} bankAccounts={[]} />);

		const checkoutBtn = screen.getByText("إغلاق وتسجيل");
		await waitFor(() => expect(checkoutBtn).not.toBeDisabled());

		const bankInputs = screen.getAllByRole("spinbutton");
		const bankInput = bankInputs[2];
		fireEvent.change(bankInput, { target: { value: "30" } });

		expect(
			screen.getByText(/لا توجد حسابات بنكية نشطة في النظام لاستقبال الحوالة/),
		).toBeInTheDocument();

		fireEvent.click(checkoutBtn);

		expect(onErrorMock).toHaveBeenCalledWith(
			"لا يمكن الدفع البنكي لعدم وجود حسابات بنكية نشطة في النظام.",
		);
		expect(checkoutSpy).not.toHaveBeenCalled();
	});

	it("auto-selects the bank account if only one active bank account exists", () => {
		const singleAccount = [{ id: "b-only", name: "بنك فلسطين الوحيد", is_active: true }];
		render(<CheckoutModal {...defaultProps} bankAccounts={singleAccount} />);

		const bankInputs = screen.getAllByRole("spinbutton");
		const bankInput = bankInputs[2];
		fireEvent.change(bankInput, { target: { value: "40" } });

		// Should NOT show warning message because it was auto-selected
		expect(
			screen.queryByText("⚠️ يجب تحديد الحساب البنكي المستقبل للحوالة"),
		).not.toBeInTheDocument();

		// Verify the select has the single account value
		const select = screen.getByRole("combobox");
		expect(select).toHaveValue("b-only");
	});
});
