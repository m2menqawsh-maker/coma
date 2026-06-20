export type LedgerDirection = "in" | "out";
export type PaymentChannel = "cash" | "bank";
export type LedgerTxType =
	| "income_session"
	| "income_product"
	| "debt_payment"
	| "debt_create"
	| "expense_operational"
	| "expense_purchase"
	| "loan_receipt"
	| "loan_repayment"
	| "partner_withdrawal"
	| "partner_deposit"
	| "partner_loan"
	| "partner_loan_payment"
	| "internal_transfer"
	| "opening_balance";

export interface LedgerEntry {
	id: string;
	date: string;
	tx_type: LedgerTxType;
	direction: LedgerDirection;
	channel: PaymentChannel;
	amount: number;
	description: string;
	reference_type: string | null;
	bank_account_id: string | null;
	created_at: string;
	bank_accounts?: { name: string } | null;
	user_profiles?: { name: string } | null;
}
