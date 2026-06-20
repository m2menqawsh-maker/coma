import { useState } from "react";
import toast from "react-hot-toast";
import { addItem } from "../actions/inventory";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";

interface Props {
	onClose: () => void;
	onSaved: () => void;
}

export default function NewItemModal({ onClose, onSaved }: Props) {
	const [newItem, setNewItem] = useState({
		name: "",
		unit: "",
		cost_price: "",
		low_stock_threshold: "",
	});
	const [savingItem, setSavingItem] = useState(false);

	const handleAddItem = async () => {
		if (!newItem.name.trim()) return;
		setSavingItem(true);
		try {
			await addItem({
				name: newItem.name.trim(),
				unit: newItem.unit.trim() || null,
				cost_price: Math.max(0, parseFloat(newItem.cost_price) || 0) || null,
				low_stock_threshold:
					Math.max(0, parseFloat(newItem.low_stock_threshold) || 0) || null,
			});
			toast.success("تمت إضافة الصنف ✓");
			onSaved();
			onClose();
		} catch (error: any) {
			toast.error(`فشل الإضافة: ${error.message}`);
		} finally {
			setSavingItem(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[420px] border border-white/10">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">صنف جديد</h2>
				<div className="flex flex-col gap-3.5">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							اسم الصنف
						</label>
						<input
							className={inputStyle}
							value={newItem.name}
							onChange={(e) =>
								setNewItem((f) => ({ ...f, name: e.target.value }))
							}
							placeholder="مثال: بن مطحون، حليب، سكر..."
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								الوحدة
							</label>
							<input
								className={inputStyle}
								value={newItem.unit}
								onChange={(e) =>
									setNewItem((f) => ({ ...f, unit: e.target.value }))
								}
								placeholder="غ، مل، حبة..."
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
								value={newItem.cost_price}
								onChange={(e) =>
									setNewItem((f) => ({ ...f, cost_price: e.target.value }))
								}
								placeholder="0.00"
							/>
						</div>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							حد التنبيه (رصيد منخفض)
						</label>
						<input
							className={inputStyle}
							type="number"
							min="0"
							step="0.001"
							dir="ltr"
							value={newItem.low_stock_threshold}
							onChange={(e) =>
								setNewItem((f) => ({
									...f,
									low_stock_threshold: e.target.value,
								}))
							}
							placeholder="مثال: 100"
						/>
					</div>
				</div>
				<div className="flex gap-2.5 mt-5.5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${savingItem ? "opacity-60" : ""}`}
						onClick={handleAddItem}
						disabled={savingItem || !newItem.name.trim()}
					>
						{savingItem ? "جاري الإضافة..." : "إضافة الصنف"}
					</button>
				</div>
			</div>
		</div>
	);
}
