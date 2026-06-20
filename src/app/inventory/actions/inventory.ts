import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function addItem(item: {
	name: string;
	unit: string | null;
	cost_price: number | null;
	low_stock_threshold: number | null;
}) {
	const { error } = await supabase.from("inventory_items").insert({
		name: item.name,
		unit: item.unit,
		qty: 0,
		cost_price: item.cost_price,
		low_stock_threshold: item.low_stock_threshold,
	});
	if (error) throw error;
}

export async function updateItem(
	id: string,
	item: {
		name: string;
		unit: string | null;
		cost_price: number | null;
		low_stock_threshold: number | null;
	},
) {
	const { error } = await supabase
		.from("inventory_items")
		.update({
			name: item.name,
			unit: item.unit,
			cost_price: item.cost_price,
			low_stock_threshold: item.low_stock_threshold,
		})
		.eq("id", id);
	if (error) throw error;
}

export async function recordPurchase(data: {
	itemId: string;
	qty: number;
	cashAmount: number;
	bankAmount: number;
	bankAccountId: string | null;
	notes: string;
	itemName: string;
	currentQty: number;
}) {
	// 1. Update inventory qty
	const { error: e1 } = await supabase
		.from("inventory_items")
		.update({ qty: data.currentQty + data.qty })
		.eq("id", data.itemId);
	if (e1) throw e1;

	// 2. Record inventory movement
	const { error: e2 } = await supabase.from("inventory_movements").insert({
		item_id: data.itemId,
		qty: data.qty,
		direction: "in",
		reference_type: "manual",
		notes: data.notes || null,
	});
	if (e2) throw e2;

	// 3. Record as expense (purchase) → triggers ledger entry automatically
	if (data.cashAmount + data.bankAmount > 0) {
		const res = await supabase.from("expenses").insert({
			name: `مشتريات: ${data.itemName}`,
			cash_amount: data.cashAmount,
			bank_amount: data.bankAmount,
			amount: data.cashAmount + data.bankAmount,
			channel: data.bankAmount > 0 ? "bank" : "cash",
			expense_type: "purchase",
			date: new Date().toISOString().split("T")[0],
			bank_account_id: data.bankAmount > 0 ? data.bankAccountId : null,
			notes: data.notes || null,
		});
		if (res.error) throw res.error;
	}
}

export async function saveRecipe(
	productId: string,
	ingredients: {
		inventory_item_id: string;
		qty_per_unit: number;
		size: string | null;
	}[],
) {
	// Delete existing recipe for this product first (Upsert logic)
	const { error: e1 } = await supabase
		.from("product_recipes")
		.delete()
		.eq("product_id", productId);
	if (e1) throw e1;

	if (ingredients.length > 0) {
		const { error: e2 } = await supabase.from("product_recipes").insert(
			ingredients.map((r) => ({
				product_id: productId,
				inventory_item_id: r.inventory_item_id,
				qty_per_unit: r.qty_per_unit,
				size: r.size,
			})),
		);
		if (e2) throw e2;
	}
}

export async function deleteRecipe(id: string) {
	const { error } = await supabase
		.from("product_recipes")
		.delete()
		.eq("id", id);
	if (error) throw error;
}
