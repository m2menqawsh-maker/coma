import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import GroupCheckoutModal from "../components/GroupCheckoutModal";
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

describe("GroupCheckoutModal Component Bank Validation", () => {
	const onCloseMock = vi.fn();
	const onSuccessMock = vi.fn();
	const onErrorMock = vi.fn();

	const defaultProps = {
		sessions: [
			{
				id: "s-1",
				customer_id: "c-1",
				customer_name: "أحمد علي",
				start_time: new Date(Date.now() - 3600000).toISOString(),
				device: "mobile" as const,
				hourly_rate: 10,
				place_cost_rate: 2,
				created_at: new Date().toISOString(),
			},
			{
				id: "s-2",
				customer_id: "c-2",
				customer_name: "محمد حسن",
				start_time: new Date(Date.now() - 3600000).toISOString(),
				device: "laptop" as const,
				hourly_rate: 15,
				place_cost_rate: 3,
				created_at: new Date().toISOString(),
			},
		],
		orders: {},
		deviceChanges: {},
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
		onClose: onCloseMock,
		onSuccess: onSuccessMock,
		onError: onErrorMock,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("blocks group checkout when bank payment is entered without selecting an account", async () => {
		const checkoutSpy = vi.spyOn(checkoutActions, "processGroupCheckout");

		render(<GroupCheckoutModal {...defaultProps} />);

		// Select 2 sessions
		const sessionCards = screen.getAllByText(/أحمد علي|محمد حسن/);
		fireEvent.click(sessionCards[0]);
		fireEvent.click(sessionCards[1]);

		// Assign first session as primary payer
		const primaryButtons = screen.getAllByText("تعيين كمسؤول");
		fireEvent.click(primaryButtons[0]);

		// Enter bank transfer amount (number input for bank)
		const inputs = screen.getAllByRole("spinbutton");
		// In GroupCheckoutModal: index 0 is discount, index 1 is cash, index 2 is bank
		const bankInput = inputs[2];
		fireEvent.change(bankInput, { target: { value: "60" } });

		expect(
			screen.getByText("⚠️ يجب تحديد الحساب البنكي المستقبل للحوالة"),
		).toBeInTheDocument();

		const checkoutBtn = screen.getByText("تأكيد ودفع");
		fireEvent.click(checkoutBtn);

		expect(onErrorMock).toHaveBeenCalledWith(
			"يرجى اختيار الحساب البنكي لاستقبال الحوالة.",
		);
		expect(checkoutSpy).not.toHaveBeenCalled();
	});

	it("auto-selects bank account if only one active bank exists", async () => {
		const singleAccount = [{ id: "b-only", name: "بنك فلسطين الوحيد", is_active: true }];
		render(<GroupCheckoutModal {...defaultProps} bankAccounts={singleAccount} />);

		// Select 2 sessions
		const sessionCards = screen.getAllByText(/أحمد علي|محمد حسن/);
		fireEvent.click(sessionCards[0]);
		fireEvent.click(sessionCards[1]);

		// Assign first session as primary payer
		const primaryButtons = screen.getAllByText("تعيين كمسؤول");
		fireEvent.click(primaryButtons[0]);

		const inputs = screen.getAllByRole("spinbutton");
		const bankInput = inputs[2];
		fireEvent.change(bankInput, { target: { value: "60" } });

		expect(
			screen.queryByText("⚠️ يجب تحديد الحساب البنكي المستقبل للحوالة"),
		).not.toBeInTheDocument();

		const select = screen.getByRole("combobox");
		expect(select).toHaveValue("b-only");
	});
});
