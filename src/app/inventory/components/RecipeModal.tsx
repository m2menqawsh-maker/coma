import { useState } from "react";
import toast from "react-hot-toast";
import { saveRecipe } from "../actions/inventory";
import type { InventoryItem, Product, ProductRecipe } from "../types";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";

interface Props {
	items: InventoryItem[];
	products: Product[];
	recipes: ProductRecipe[];
	initialProductId?: string;
	initialIngredients?: {
		inventory_item_id: string;
		qty_per_unit: string;
		size: string;
	}[];
	onClose: () => void;
	onSaved: () => void;
}

export default function RecipeModal({
	items,
	products,
	recipes,
	initialProductId = "",
	initialIngredients = [{ inventory_item_id: "", qty_per_unit: "", size: "" }],
	onClose,
	onSaved,
}: Props) {
	const [recipeProductId, setRecipeProductId] = useState(initialProductId);
	const [recipeIngredients, setRecipeIngredients] =
		useState(initialIngredients);
	const [savingRecipe, setSavingRecipe] = useState(false);

	const handleAddRecipe = async () => {
		const valid = recipeIngredients.filter(
			(r) =>
				r.inventory_item_id && r.qty_per_unit && parseFloat(r.qty_per_unit) > 0,
		);
		if (!recipeProductId || valid.length === 0) return;
		const product = products.find((p) => p.id === recipeProductId);

		setSavingRecipe(true);
		try {
			await saveRecipe(
				recipeProductId,
				valid.map((r) => ({
					inventory_item_id: r.inventory_item_id,
					qty_per_unit: Math.max(0, parseFloat(r.qty_per_unit) || 0),
					size: product?.has_sizes && r.size ? r.size : null,
				})),
			);
			toast.success(`تم حفظ الوصفة (${valid.length} مكوّن) ✓`);
			onSaved();
			onClose();
		} catch (error: any) {
			toast.error(`فشل حفظ الوصفة: ${error.message}`);
		} finally {
			setSavingRecipe(false);
		}
	};

	const selectedProduct = products.find((p) => p.id === recipeProductId);

	return (
		<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[520px] border border-white/10 max-h-[90vh] overflow-y-auto">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">وصفة المنتج</h2>
				<div className="flex flex-col gap-4">
					{/* المنتج */}
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							المنتج
						</label>
						<select
							className={inputStyle}
							value={recipeProductId}
							onChange={(e) => {
								const pid = e.target.value;
								setRecipeProductId(pid);
								const existing = recipes.filter((r) => r.product_id === pid);
								if (existing.length > 0) {
									setRecipeIngredients(
										existing.map((r) => ({
											inventory_item_id: r.inventory_item_id,
											qty_per_unit: String(r.qty_per_unit),
											size: r.size || "",
										})),
									);
								} else {
									setRecipeIngredients([
										{ inventory_item_id: "", qty_per_unit: "", size: "" },
									]);
								}
							}}
						>
							<option value="">-- اختر منتج --</option>
							{products.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>

					{/* قائمة المكونات */}
					<div className="flex flex-col gap-2.5">
						<div className="flex justify-between items-center">
							<label className="text-xs text-[#9090b0]">المكونات</label>
							<button
								onClick={() =>
									setRecipeIngredients((r) => [
										...r,
										{ inventory_item_id: "", qty_per_unit: "", size: "" },
									])
								}
								className="bg-indigo-400/15 border border-indigo-400/30 rounded-md text-indigo-400 px-3 py-1 text-xs cursor-pointer hover:bg-indigo-400/20 transition-colors"
							>
								+ أضف مكوّن
							</button>
						</div>

						{recipeIngredients.map((ing, idx) => (
							<div
								key={idx}
								className="bg-[#0d0d14] rounded-xl p-3 border border-white/5 flex flex-col gap-2.5"
							>
								<div className="flex justify-between items-center">
									<span className="text-[11px] text-[#4a4a6a]">
										مكوّن {idx + 1}
									</span>
									{recipeIngredients.length > 1 && (
										<button
											onClick={() =>
												setRecipeIngredients((r) =>
													r.filter((_, i) => i !== idx),
												)
											}
											className="bg-transparent border-none text-red-400 text-xs cursor-pointer px-1.5 py-0.5 hover:text-red-300 transition-colors"
										>
											✕ حذف
										</button>
									)}
								</div>
								<div
									className={`grid gap-2.5 ${selectedProduct?.has_sizes ? "grid-cols-[2fr_1fr_1fr]" : "grid-cols-[2fr_1fr]"}`}
								>
									<div>
										<label className="text-[11px] text-[#6b6b8a] block mb-1">
											الصنف
										</label>
										<select
											className={inputStyle}
											value={ing.inventory_item_id}
											onChange={(e) =>
												setRecipeIngredients((r) =>
													r.map((x, i) =>
														i === idx
															? { ...x, inventory_item_id: e.target.value }
															: x,
													),
												)
											}
										>
											<option value="">-- اختر --</option>
											{items.map((item) => (
												<option key={item.id} value={item.id}>
													{item.name} ({item.unit || "—"})
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="text-[11px] text-[#6b6b8a] block mb-1">
											الكمية
										</label>
										<input
											className={inputStyle}
											type="number"
											min="0.001"
											step="0.001"
											dir="ltr"
											value={ing.qty_per_unit}
											placeholder="0"
											onChange={(e) =>
												setRecipeIngredients((r) =>
													r.map((x, i) =>
														i === idx
															? { ...x, qty_per_unit: e.target.value }
															: x,
													),
												)
											}
										/>
									</div>
									{selectedProduct?.has_sizes && (
										<div>
											<label className="text-[11px] text-[#6b6b8a] block mb-1">
												الحجم
											</label>
											<select
												className={inputStyle}
												value={ing.size}
												onChange={(e) =>
													setRecipeIngredients((r) =>
														r.map((x, i) =>
															i === idx ? { ...x, size: e.target.value } : x,
														),
													)
												}
											>
												<option value="">الكل</option>
												<option value="small">صغير</option>
												<option value="large">كبير</option>
											</select>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="flex gap-2.5 mt-5.5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${savingRecipe ? "opacity-60" : ""}`}
						onClick={handleAddRecipe}
						disabled={
							savingRecipe ||
							!recipeProductId ||
							recipeIngredients.every(
								(r) => !r.inventory_item_id || !r.qty_per_unit,
							)
						}
					>
						{savingRecipe
							? "جاري الحفظ..."
							: `حفظ الوصفة (${recipeIngredients.filter((r) => r.inventory_item_id && r.qty_per_unit).length} مكوّن)`}
					</button>
				</div>
			</div>
		</div>
	);
}
