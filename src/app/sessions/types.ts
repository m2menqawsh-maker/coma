export type Device = "mobile" | "laptop" | "paused";

export interface Customer {
	id: string;
	name: string;
	phone: string | null;
	is_vip: boolean;
	balance: number; // موجب = رصيد دائن، سالب = دين
	notes: string | null;
	last_visit_at?: string;
}

export interface CustomerBalance {
	id: string;
	name: string;
	remaining_debt: number;
	total_credit_used: number;
}

export interface Session {
	id: string;
	customer_name: string;
	customer_id: string | null;
	device: Device;
	start_time: string;
	notes: string | null;
	package_id: string | null;
}

export interface Product {
	id: string;
	name: string;
	category: string;
	small_price: number | null;
	large_price: number | null;
	has_sizes: boolean;
}

export interface SessionOrder {
	id: string;
	session_id: string;
	product_id: string;
	product_name: string;
	size: string | null;
	quantity: number;
	price_per_unit: number;
	cost_per_unit: number;
}

export interface SessionDeviceChange {
	id: string;
	session_id: string;
	from_device: Device;
	to_device: Device;
	changed_at: string;
}

export interface PricingConfig {
	mobile_rate: number;
	laptop_rate: number;
	mobile_place_cost: number;
	laptop_place_cost: number;
	dev_percent: number;
}

export interface BankAccount {
	id: string;
	name: string;
}

export interface Package {
	id: string;
	name: string;
	device: Device | null;
	hours: number;
	price: number;
	is_active: boolean;
	notes: string | null;
}

export interface PackageItem {
	id: string;
	package_id: string;
	product_id: string;
	size: string | null;
	quantity: number;
	product_name?: string; // joined from products
}

export type ToastType = "success" | "error";
export interface Toast {
	id: number;
	msg: string;
	type: ToastType;
}
