export interface PricingConfig {
	id: string;
	mobile_rate: number;
	laptop_rate: number;
	mobile_place_cost: number;
	laptop_place_cost: number;
	dev_percent: number;
}

export interface Partner {
	id: string;
	name: string;
	share_percent: number;
	is_active: boolean;
}

export interface BankAccount {
	id: string;
	name: string;
	account_type: string;
	phone: string | null;
	is_active: boolean;
}

export interface Product {
	id: string;
	name: string;
	category: string;
	small_price: number | null;
	large_price: number | null;
	small_cost: number | null;
	large_cost: number | null;
	has_sizes: boolean;
	is_active: boolean;
}

export type Tab = "pricing" | "partners" | "banks" | "products" | "packages";
