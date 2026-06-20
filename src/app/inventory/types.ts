export interface InventoryItem {
	id: string;
	name: string;
	unit: string | null;
	qty: number;
	cost_price: number | null;
	low_stock_threshold: number | null;
	is_active: boolean;
}

export interface Product {
	id: string;
	name: string;
	has_sizes: boolean;
	small_price: number | null;
	large_price: number | null;
	is_active: boolean;
}

export interface ProductRecipe {
	id: string;
	product_id: string;
	inventory_item_id: string;
	qty_per_unit: number;
	size: string | null;
	inventory_items?: { name: string; unit: string | null };
	products?: { name: string };
}

export type Tab = "items" | "purchase" | "recipes";
