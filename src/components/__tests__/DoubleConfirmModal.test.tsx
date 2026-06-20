import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import DoubleConfirmModal from "../DoubleConfirmModal";

describe("DoubleConfirmModal Component", () => {
	const onConfirmMock = vi.fn();
	const onCancelMock = vi.fn();

	const defaultProps = {
		isOpen: true,
		title: "تأكيد الحذف",
		message: "هل أنت متأكد من الحذف؟",
		onConfirm: onConfirmMock,
		onCancel: onCancelMock,
		confirmWord: "تصفية",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders correctly when open", () => {
		render(<DoubleConfirmModal {...defaultProps} />);

		expect(screen.getByText("تأكيد الحذف")).toBeInTheDocument();
		expect(screen.getByText("هل أنت متأكد من الحذف؟")).toBeInTheDocument();
		expect(screen.getByPlaceholderText(/اكتب تصفية/)).toBeInTheDocument();
	});

	it("does not render when not open", () => {
		render(<DoubleConfirmModal {...defaultProps} isOpen={false} />);

		expect(screen.queryByText("تأكيد الحذف")).not.toBeInTheDocument();
	});

	it("calls onCancel when cancel button is clicked", () => {
		render(<DoubleConfirmModal {...defaultProps} />);

		fireEvent.click(screen.getByText("تراجع وإلغاء"));
		expect(onCancelMock).toHaveBeenCalledTimes(1);
	});

	it("disables confirm button initially", () => {
		render(<DoubleConfirmModal {...defaultProps} />);

		const confirmButton = screen.getByText("تأكيد العملية");
		expect(confirmButton).toBeDisabled();
	});

	it("enables confirm button when confirmWord matches exactly", () => {
		render(<DoubleConfirmModal {...defaultProps} />);

		const input = screen.getByPlaceholderText(/اكتب تصفية/);
		const confirmButton = screen.getByText("تأكيد العملية");

		fireEvent.change(input, { target: { value: "تصفية" } });

		expect(confirmButton).not.toBeDisabled();
	});

	it("keeps confirm button disabled if confirmWord is wrong", () => {
		render(<DoubleConfirmModal {...defaultProps} />);

		const input = screen.getByPlaceholderText(/اكتب تصفية/);
		const confirmButton = screen.getByText("تأكيد العملية");

		fireEvent.change(input, { target: { value: "تأكيد" } });

		expect(confirmButton).toBeDisabled();
	});

	it("calls onConfirm when confirm button is clicked and confirmWord matches", () => {
		render(<DoubleConfirmModal {...defaultProps} />);

		const input = screen.getByPlaceholderText(/اكتب تصفية/);
		const confirmButton = screen.getByText("تأكيد العملية");

		fireEvent.change(input, { target: { value: "تصفية" } });
		fireEvent.click(confirmButton);

		expect(onConfirmMock).toHaveBeenCalledTimes(1);
	});
});
