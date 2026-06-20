import { useState } from "react";
import toast from "react-hot-toast";
import { updateItem } from "../actions/inventory";
import type { InventoryItem } from "../types";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";

interface Props {
	item: InventoryItem;
	onClose: () => void;
	onSaved: () => void;
}

export default function EditItemModal({ item, onClose, onSaved }: Props) {
	const [editItemForm, setEditItemForm] = useState({
		name: item.name,
		unit: item.unit || "",
		cost_price: String(item.cost_price ?? ""),
		low_stock_threshold: String(item.low_stock_threshold ?? ""),
	});
	const [savingEditItem, setSavingEditItem] = useState(false);

	const handleSaveEditItem = async () => {
		setSavingEditItem(true);
		try {
			await updateItem(item.id, {
				name: editItemForm.name.trim(),
				unit: editItemForm.unit.trim() || null,
				cost_price:
					Math.max(0, parseFloat(editItemForm.cost_price) || 0) || null,
				low_stock_threshold:
					Math.max(0, parseFloat(editItemForm.low_stock_threshold) || 0) ||
					null,
			});
			toast.success("تم تعديل الصنف ✓");
			onSaved();
			onClose();
		} catch (error: any) {
			toast.error(`فشل التعديل: ${error.message}`);
		} finally {
			setSavingEditItem(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[420px] border border-white/10">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">تعديل الصنف</h2>
				<div className="flex flex-col gap-3.5">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							اسم الصنف
						</label>
						<input
							className={inputStyle}
							value={editItemForm.name}
							onChange={(e) =>
								setEditItemForm((f) => ({ ...f, name: e.target.value }))
							}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								الوحدة
							</label>
							<input
								className={inputStyle}
								value={editItemForm.unit}
								onChange={(e) =>
									setEditItemForm((f) => ({ ...f, unit: e.target.value }))
								}
							/>
						</div>
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								سعر التكلفة (₪)
							</label>
							<input
								className={inputStyle}
								type="number"
								min="0"
								step="0.01"
								dir="ltr"
								value={editItemForm.cost_price}
								onChange={(e) =>
									setEditItemForm((f) => ({
										...f,
										cost_price: e.target.value,
									}))
								}
							/>
						</div>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							حد التنبيه
						</label>
						<input
							className={inputStyle}
							type="number"
							min="0"
							step="0.001"
							dir="ltr"
							value={editItemForm.low_stock_threshold}
							onChange={(e) =>
								setEditItemForm((f) => ({
									...f,
									low_stock_threshold: e.target.value,
								}))
							}
						/>
					</div>
				</div>
				<div className="flex gap-2.5 mt-5.5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${savingEditItem ? "opacity-60" : ""}`}
						onClick={handleSaveEditItem}
						disabled={savingEditItem || !editItemForm.name.trim()}
					>
						{savingEditItem ? "جاري الحفظ..." : "حفظ التعديلات"}
					</button>
				</div>
			</div>
		</div>
	);
}
