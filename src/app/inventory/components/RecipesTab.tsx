"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import { deleteRecipe } from "../actions/inventory";
import type { InventoryItem, Product, ProductRecipe } from "../types";
import { btnPrimary, fmt } from "../utils";
import RecipeModal from "./RecipeModal";

const supabase = createClient();

export default function RecipesTab() {
	const [items, setItems] = useState<InventoryItem[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
	const [loading, setLoading] = useState(true);

	const [showNewRecipe, setShowNewRecipe] = useState(false);
	const [editRecipeProductId, setEditRecipeProductId] = useState("");
	const [editRecipeIngredients, setEditRecipeIngredients] = useState<
		{ inventory_item_id: string; qty_per_unit: string; size: string }[]
	>([]);

	const loadData = useCallback(async () => {
		setLoading(true);
		const [{ data: invItems }, { data: prods }, { data: recs }] =
			await Promise.all([
				supabase
					.from("inventory_items")
					.select("*")
					.eq("is_active", true)
					.order("name"),
				supabase
					.from("products")
					.select("id, name, has_sizes, small_price, large_price, is_active")
					.eq("is_active", true)
					.order("name"),
				supabase
					.from("product_recipes")
					.select("*, inventory_items(name, unit), products(name)")
					.order("product_id"),
			]);

		setItems((invItems as InventoryItem[]) || []);
		setProducts((prods as Product[]) || []);
		setRecipes((recs as ProductRecipe[]) || []);
		setLoading(false);
	}, []);

	useEffect(() => {
		loadData();
	}, []);

	const handleDeleteRecipe = async (id: string) => {
		try {
			await deleteRecipe(id);
			toast.success("تم حذف الوصفة ✓");
			loadData();
		} catch (error: any) {
			toast.error(`فشل الحذف: ${error.message}`);
		}
	};

	const recipesByProduct = recipes.reduce<Record<string, ProductRecipe[]>>(
		(acc, r) => {
			const key = r.products?.name || r.product_id;
			if (!acc[key]) acc[key] = [];
			acc[key].push(r);
			return acc;
		},
		{},
	);

	if (loading)
		return (
			<div className="p-10">
				<LoadingSpinner />
			</div>
		);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<div className="text-[13px] text-[#6b6b8a]">
					وصفة كل منتج تحدد ما يُخصم من المخزون عند البيع
				</div>
				<button
					className={btnPrimary}
					onClick={() => {
						setEditRecipeProductId("");
						setEditRecipeIngredients([
							{ inventory_item_id: "", qty_per_unit: "", size: "" },
						]);
						setShowNewRecipe(true);
					}}
				>
					+ وصفة جديدة
				</button>
			</div>

			{Object.keys(recipesByProduct).length === 0 ? (
				<div className="text-center py-12 px-5 bg-[#111118] rounded-xl border border-dashed border-white/10 text-[#4a4a6a] text-sm">
					لا توجد وصفات بعد
				</div>
			) : (
				Object.entries(recipesByProduct).map(([productName, recs]) => {
					const prod = products.find((p) => p.id === recs[0].product_id);
					if (!prod) return null;

					let smallCost = 0;
					let largeCost = 0;
					let defaultCost = 0;

					recs.forEach((r) => {
						const item = items.find((i) => i.id === r.inventory_item_id);
						const costPrice = item?.cost_price || 0;
						const lineCost = r.qty_per_unit * costPrice;

						if (prod.has_sizes) {
							if (r.size === "small" || !r.size) smallCost += lineCost;
							if (r.size === "large" || !r.size) largeCost += lineCost;
						} else {
							defaultCost += lineCost;
						}
					});

					const renderProfit = (
						label: string,
						price: number | null,
						cost: number,
					) => {
						if (!price) return null;
						const profit = price - cost;
						const margin = price > 0 ? (profit / price) * 100 : 0;
						return (
							<div className="flex flex-col gap-1 bg-white/5 p-2.5 rounded-lg border border-white/5 min-w-[200px]">
								<span className="text-[#9090b0] text-[11px] font-bold mb-0.5">
									{label}
								</span>
								<div className="flex justify-between items-center text-[11px]">
									<span className="text-[#e0e0f0]">سعر البيع: ₪{price}</span>
									<span className="text-amber-400">التكلفة: ₪{fmt(cost)}</span>
								</div>
								<div className="flex justify-between items-center text-[11px] mt-0.5">
									<span className="text-[#9090b0]">الصافي:</span>
									<span className="text-green-400 font-bold">
										₪{fmt(profit)} ({fmt(margin)}%)
									</span>
								</div>
							</div>
						);
					};

					return (
					<div
						key={productName}
						className="bg-[#111118] rounded-xl border border-white/5 overflow-hidden"
					>
						<div className="px-5 py-3.5 border-b border-white/5 bg-indigo-500/5 flex justify-between items-center">
							<span className="text-sm font-semibold text-[#c0c0f0]">
								{productName}
							</span>
							<button
								onClick={() => {
									setEditRecipeProductId(recs[0].product_id);
									setEditRecipeIngredients(
										recs.map((r) => ({
											inventory_item_id: r.inventory_item_id,
											qty_per_unit: String(r.qty_per_unit),
											size: r.size || "",
										})),
									);
									setShowNewRecipe(true);
								}}
								className="bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-400 px-3 py-1 text-[11px] cursor-pointer hover:bg-indigo-500/20 transition-colors"
							>
								تعديل الوصفة
							</button>
						</div>
						<div className="px-5 py-4 border-b border-white/5 bg-[#111118] flex flex-wrap gap-4">
							{prod.has_sizes ? (
								<>
									{renderProfit("ربحية الحجم الصغير", prod.small_price, smallCost)}
									{renderProfit("ربحية الحجم الكبير", prod.large_price, largeCost)}
								</>
							) : (
								renderProfit("الربحية", prod.small_price, defaultCost)
							)}
						</div>
						<table className="w-full border-collapse text-[13px]">
							<thead>
								<tr className="border-b border-white/5">
									{["المكوّن", "الكمية لكل وحدة", "الحجم", ""].map((h) => (
										<th
											key={h}
											className="p-2.5 px-4 text-right text-[#6b6b8a] font-semibold text-[11px]"
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{recs.map((r, i) => (
									<tr
										key={r.id}
										className={`${
											i < recs.length - 1 ? "border-b border-white/5" : ""
										}`}
									>
										<td className="p-2.5 px-4 text-[#e0e0f0]">
											{r.inventory_items?.name}
										</td>
										<td className="p-2.5 px-4 text-green-400 font-semibold">
											{fmt(r.qty_per_unit)} {r.inventory_items?.unit || ""}
										</td>
										<td className="p-2.5 px-4 text-[#6b6b8a]">
											{r.size
												? r.size === "small"
													? "صغير"
													: "كبير"
												: "كل الأحجام"}
										</td>
										<td className="p-2.5 px-4">
											<button
												onClick={() => handleDeleteRecipe(r.id)}
												className="bg-red-400/10 border border-red-400/20 rounded-md text-red-400 px-2.5 py-1 text-[11px] cursor-pointer hover:bg-red-400/20 transition-colors"
											>
												حذف
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)})
			)}

			{showNewRecipe && (
				<RecipeModal
					items={items}
					products={products}
					recipes={recipes}
					initialProductId={editRecipeProductId}
					initialIngredients={editRecipeIngredients}
					onClose={() => setShowNewRecipe(false)}
					onSaved={loadData}
				/>
			)}
		</div>
	);
}
