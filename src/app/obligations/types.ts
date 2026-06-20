import type { ScheduleType } from "@/lib/finance/obligations";

export interface Obligation {
	id: string;
	name: string;
	amount: number;
	schedule_type: ScheduleType;
	is_active: boolean;
	notes: string | null;
}

export interface BankAccount {
	id: string;
	name: string;
}

export interface PendingPayment {
	obligation: Obligation;
	days: number;
	dailyRate: number;
	totalDue: number;
	cashAmount: string;
	bankAmount: string;
	bankAccountId: string;
	approved: boolean;
}
