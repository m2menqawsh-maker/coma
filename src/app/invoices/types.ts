export type InvoiceStatus = "paid" | "debt" | "partial" | "cleared";

export interface InvoiceItem {
	id: string;
	product_name: string;
	size: string | null;
	quantity: number;
	price_per_unit: number;
	cost_per_unit: number;
	total_price: number;
	total_cost: number;
}

export interface Invoice {
	id: string;
	customer_id: string | null;
	customer_name: string;
	session_start: string;
	session_end: string;
	duration_minutes: number;
	device: "mobile" | "laptop";
	session_amount: number;
	products_amount: number;
	total_amount: number;
	discount_amount: number;
	total_due: number;
	place_cost: number;
	products_cost: number;
	total_cost: number;
	gross_profit: number;
	net_profit: number;
	cash_paid: number;
	bank_paid: number;
	debt_created: number;
	credit_applied: number;
	status: InvoiceStatus;
	notes: string | null;
	created_at: string;
	hourly_rate_snapshot: number | null;
	bank_accounts?: { name: string } | null;
	package_id?: string | null;
	final_calculation_snapshot?: any | null;
	packages?: { name: string } | null;
}

export interface CustomerMovement {
	id: string;
	invoice_id: string | null;
	amount: number;
	channel: string;
	date: string;
	note: string | null;
	created_at: string;
}

export type ToastType = "success" | "error";

export interface Toast {
	id: number;
	msg: string;
	type: ToastType;
}
