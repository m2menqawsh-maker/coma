export interface Partner {
	id: string;
	name: string;
	share_percent: number;
}

export interface Obligation {
	id: string;
	name: string;
	amount: number;
	schedule_type: "monthly" | "weekly" | "daily";
	is_active: boolean;
}

export interface FinancialClosing {
	id: string;
	period_from: string;
	period_to: string;
	label: string | null;
	total_revenue: number;
	total_expenses: number;
	total_obligations: number;
	net_profit: number;
	partners_snapshot: PartnerRow[];
	approved_deductions: DeductionRow[];
	notes: string | null;
	created_at: string;
}

export interface PartnerRow {
	id: string;
	name: string;
	percent: number;
	share: number;
	actual_deducted: number;
}

export interface DeductionRow {
	id: string;
	label: string;
	calculated: number;
	approved: boolean;
	actual_amount: number;
	type: "obligation" | "expense" | "custom";
}

export type Step = "period" | "preview" | "deductions" | "partners" | "confirm";

export interface PreviewData {
	revenue: number;
	cashRevenue: number;
	bankRevenue: number;
	debtRevenue: number;
	expenses: number;
	netProfit: number;
	invoiceCount: number;
}
