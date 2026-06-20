export type TransferStatus = "pending" | "confirmed" | "rejected";
export type Direction = "in" | "out";

export interface BankAccountDetail {
	id: string;
	name: string;
	account_type: string;
	phone: string | null;
	is_active: boolean;
	balance: number;
	total_in: number;
	total_out: number;
	pending_in: number;
	pending_count: number;
}

export interface BankTransfer {
	id: string;
	date: string;
	bank_account_id: string | null;
	amount: number;
	direction: Direction;
	status: TransferStatus;
	description: string | null;
	sender_name: string | null;
	sender_phone: string | null;
	invoice_id: string | null;
	reference_type: string | null;
	confirmed_at: string | null;
	created_at: string;
	bank_accounts?: { name: string } | null;
}
