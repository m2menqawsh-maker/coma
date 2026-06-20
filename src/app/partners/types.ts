export interface Partner {
	id: string;
	name: string;
	share_percent: number;
	is_active: boolean;
}

export interface BankAccount {
	id: string;
	name: string;
}

export interface PartnerMovement {
	id: string;
	date: string;
	tx_type: "partner_withdrawal" | "partner_deposit" | "partner_loan" | "partner_loan_payment";
	direction: "in" | "out";
	channel: "cash" | "bank";
	amount: number;
	description: string;
	bank_accounts?: { name: string } | null;
	partner_id: string | null;
}
