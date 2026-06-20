export type SubscriptionType = "hours" | "days";

export interface DrinksAllowance {
	type: "daily" | "total";
	count: number;
	allowed_products: "all" | string[]; // array of product IDs if specific
}

export interface Subscription {
	id: string;
	customer_id: string;
	name: string;
	type: SubscriptionType;
	device?: "mobile" | "laptop" | null;
	start_date: string;
	end_date: string;
	frozen_at: string | null;
	frozen_days_total: number;
	is_active: boolean;
	notes: string | null;
	created_at: string;
	price: number;
	cost: number;
	paid_amount: number;
	limit_value: number | null;
	excluded_days: number[] | null; // 0=Sun, 1=Mon, etc.
	drinks_allowance: DrinksAllowance | null;
}

export interface SubscriptionUsage {
	id: string;
	subscription_id: string;
	session_id: string;
	date: string;
	hours_used: number;
	drinks_used: number;
	drinks_details: { product_id: string; quantity: number }[] | null;
	created_at: string;
}
