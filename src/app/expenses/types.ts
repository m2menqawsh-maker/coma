export type ExpenseType = "fixed" | "one_time" | "purchase" | "loan_repayment";

export interface Expense {
	id: string;
	name: string;
	cash_amount: number;
	bank_amount: number;
	expense_type: ExpenseType;
	date: string;
	bank_account_id: string | null;
	notes: string | null;
	created_at: string;
	bank_accounts?: { name: string } | null;
}

export interface BankAccount {
	id: string;
	name: string;
}
