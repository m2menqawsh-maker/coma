"use client";

import { useState } from "react";
import type { Product } from "../types";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";

interface ProductModalProps {
	product?: Product | null;
	onSave: (data: Partial<Product>) => Promise<boolean>;
	onClose: () => void;
}

export default function ProductModal({
	product,
	onSave,
	onClose,
}: ProductModalProps) {
	const isEditing = !!product;
	const [form, setForm] = useState({
		name: product?.name || "",
		category: product?.category || "drink",
		has_sizes: product?.has_sizes || false,
		small_price: product?.small_price ? String(product.small_price) : "",
		large_price: product?.large_price ? String(product.large_price) : "",
		small_cost: product?.small_cost ? String(product.small_cost) : "",
		large_cost: product?.large_cost ? String(product.large_cost) : "",
	});
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		setSaving(true);
		const success = await onSave({
			name: form.name.trim(),
			category: form.category,
			has_sizes: form.has_sizes,
			small_price: Math.max(0, parseFloat(form.small_price) || 0) || null,
			large_price: form.has_sizes
				? Math.max(0, parseFloat(form.large_price) || 0) || null
				: null,
			small_cost: Math.max(0, parseFloat(form.small_cost) || 0) || null,
			large_cost: form.has_sizes
				? Math.max(0, parseFloat(form.large_cost) || 0) || null
				: null,
		});
		setSaving(false);
		if (success) onClose();
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[440px] border border-white/5">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">
					{isEditing ? "تعديل المنتج" : "منتج جديد"}
				</h2>
				<div className="flex flex-col gap-3.5">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							اسم المنتج
						</label>
						<input
							className={inputStyle}
							value={form.name}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							placeholder="مثال: قهوة، كرت 5 شيكل..."
						/>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							التصنيف
						</label>
						<select
							className={inputStyle}
							value={form.category}
							onChange={(e) =>
								setForm((f) => ({ ...f, category: e.target.value }))
							}
						>
							<option value="drink">مشروب</option>
							<option value="internet_card">كرت إنترنت</option>
							<option value="other">أخرى</option>
						</select>
					</div>
					<div className="flex items-center gap-2.5">
						<button
							onClick={() =>
								setForm((f) => ({ ...f, has_sizes: !f.has_sizes }))
							}
							className={`w-10 h-[22px] rounded-full border-none cursor-pointer relative transition-colors shrink-0 ${
								form.has_sizes ? "bg-indigo-500" : "bg-[#2a2a3e]"
							}`}
						>
							<span
								className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ${
									form.has_sizes ? "right-[3px]" : "left-[3px]"
								}`}
							/>
						</button>
						<span className="text-[13px] text-[#9090b0]">
							فيه حجمين (صغير/كبير)
						</span>
					</div>
					{form.has_sizes ? (
						<div className="grid grid-cols-2 gap-2.5">
							<div>
								<label className="text-xs text-[#9090b0] block mb-1.5">
									سعر الصغير (₪)
								</label>
								<input
									className={inputStyle}
									type="number"
									min="0"
									dir="ltr"
									value={form.small_price}
									onChange={(e) =>
										setForm((f) => ({ ...f, small_price: e.target.value }))
									}
									placeholder="0"
								/>
							</div>
							<div>
								<label className="text-xs text-[#9090b0] block mb-1.5">
									سعر الكبير (₪)
								</label>
								<input
									className={inputStyle}
									type="number"
									min="0"
									dir="ltr"
									value={form.large_price}
									onChange={(e) =>
										setForm((f) => ({ ...f, large_price: e.target.value }))
									}
									placeholder="0"
								/>
							</div>
							<div>
								<label className="text-xs text-[#9090b0] block mb-1.5">
									تكلفة الصغير (₪)
								</label>
								<input
									className={inputStyle}
									type="number"
									min="0"
									dir="ltr"
									value={form.small_cost}
									onChange={(e) =>
										setForm((f) => ({ ...f, small_cost: e.target.value }))
									}
									placeholder="0"
								/>
							</div>
							<div>
								<label className="text-xs text-[#9090b0] block mb-1.5">
									تكلفة الكبير (₪)
								</label>
								<input
									className={inputStyle}
									type="number"
									min="0"
									dir="ltr"
									value={form.large_cost}
									onChange={(e) =>
										setForm((f) => ({ ...f, large_cost: e.target.value }))
									}
									placeholder="0"
								/>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-2 gap-2.5">
							<div>
								<label className="text-xs text-[#9090b0] block mb-1.5">
									السعر (₪)
								</label>
								<input
									className={inputStyle}
									type="number"
									min="0"
									dir="ltr"
									value={form.small_price}
									onChange={(e) =>
										setForm((f) => ({ ...f, small_price: e.target.value }))
									}
									placeholder="0"
								/>
							</div>
							<div>
								<label className="text-xs text-[#9090b0] block mb-1.5">
									التكلفة (₪)
								</label>
								<input
									className={inputStyle}
									type="number"
									min="0"
									dir="ltr"
									value={form.small_cost}
									onChange={(e) =>
										setForm((f) => ({ ...f, small_cost: e.target.value }))
									}
									placeholder="0"
								/>
							</div>
						</div>
					)}
				</div>
				<div className="flex gap-2.5 mt-5">
					<button className={btnSecondary} onClick={onClose} disabled={saving}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${saving ? "opacity-60" : "opacity-100"}`}
						onClick={handleSave}
						disabled={saving || !form.name.trim()}
					>
						{saving
							? "جاري الحفظ..."
							: isEditing
								? "حفظ التعديلات"
								: "إضافة المنتج"}
					</button>
				</div>
			</div>
		</div>
	);
}
