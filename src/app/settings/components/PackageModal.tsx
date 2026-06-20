"use client";

import { useState } from "react";
import type { Product } from "../types";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";
import type { Package, PackageItem } from "./PackagesTab";

interface Props {
	pkg?: Package;
	initialItems?: PackageItem[];
	products: Product[];
	onSave: (
		pkgData: Partial<Package>,
		itemsData: { product_id: string; size: string | null; quantity: number }[]
	) => Promise<boolean>;
	onClose: () => void;
}

export default function PackageModal({ pkg, initialItems, products, onSave, onClose }: Props) {
	const [name, setName] = useState(pkg?.name || "");
	const [device, setDevice] = useState<"mobile" | "laptop" | "any">(pkg?.device || "any");
	const [hours, setHours] = useState(pkg?.hours?.toString() || "");
	const [price, setPrice] = useState(pkg?.price?.toString() || "");
	const [notes, setNotes] = useState(pkg?.notes || "");
	
	const [items, setItems] = useState<{ id: string; product_id: string; size: string | null; quantity: number }[]>(
		initialItems?.map(i => ({ id: Math.random().toString(), product_id: i.product_id, size: i.size, quantity: i.quantity })) || []
	);

	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		if (!name || !hours || !price) return;
		setSaving(true);
		
		const ok = await onSave(
			{
				name,
				device: device === "any" ? null : device,
				hours: parseFloat(hours),
				price: parseFloat(price),
				notes: notes || null,
			},
			items.map(i => ({ product_id: i.product_id, size: i.size, quantity: i.quantity }))
		);
		
		if (ok) onClose();
		else setSaving(false);
	};

	const addItem = () => {
		setItems([...items, { id: Math.random().toString(), product_id: "", size: null, quantity: 1 }]);
	};

	const updateItem = (id: string, updates: any) => {
		setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
	};

	const removeItem = (id: string) => {
		setItems(items.filter(i => i.id !== id));
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[500px] border border-white/10 max-h-[90vh] flex flex-col">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">
					{pkg ? "تعديل بكج" : "إضافة بكج جديد"}
				</h2>

				<div className="flex flex-col gap-4 overflow-y-auto pr-1">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">الاسم</label>
						<input
							className={inputStyle}
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="مثال: عرض الصباح"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">عدد الساعات</label>
							<input
								className={inputStyle}
								type="number"
								min="0"
								step="0.5"
								dir="ltr"
								value={hours}
								onChange={(e) => setHours(e.target.value)}
								placeholder="0"
							/>
						</div>
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">السعر (₪)</label>
							<input
								className={inputStyle}
								type="number"
								min="0"
								dir="ltr"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								placeholder="0"
							/>
						</div>
					</div>

					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">الجهاز المخصص (اختياري)</label>
						<select
							className={inputStyle}
							value={device}
							onChange={(e) => setDevice(e.target.value as any)}
						>
							<option value="any">أي جهاز</option>
							<option value="mobile">موبايل فقط</option>
							<option value="laptop">لابتوب فقط</option>
						</select>
					</div>
					
					<div className="bg-white/5 border border-white/10 rounded-lg p-3">
						<div className="flex justify-between items-center mb-3">
							<label className="text-xs text-indigo-400 font-semibold m-0">المنتجات المشمولة</label>
							<button onClick={addItem} className="text-[11px] bg-indigo-400/20 text-indigo-400 px-2 py-1 rounded cursor-pointer border-none hover:bg-indigo-400/30">
								+ منتج
							</button>
						</div>
						
						<div className="flex flex-col gap-2">
							{items.length === 0 ? (
								<div className="text-[11px] text-[#6b6b8a] text-center py-2">لا يوجد منتجات في البكج.</div>
							) : (
								items.map((it) => {
									const selectedProd = products.find(p => p.id === it.product_id);
									return (
										<div key={it.id} className="flex gap-2 items-center bg-[#0d0d14] p-2 rounded">
											<select
												className={`${inputStyle} !h-8 !py-1 !text-[11px] !w-auto flex-1`}
												value={it.product_id}
												onChange={(e) => {
													const pId = e.target.value;
													const p = products.find(x => x.id === pId);
													updateItem(it.id, { product_id: pId, size: p?.has_sizes ? "small" : null });
												}}
											>
												<option value="">اختر المنتج...</option>
												{products.map(p => (
													<option key={p.id} value={p.id}>{p.name}</option>
												))}
											</select>
											
											{selectedProd?.has_sizes && (
												<select
													className={`${inputStyle} !h-8 !py-1 !text-[11px] !w-[70px] shrink-0`}
													value={it.size || "small"}
													onChange={(e) => updateItem(it.id, { size: e.target.value })}
												>
													<option value="small">صغير</option>
													<option value="large">كبير</option>
												</select>
											)}
											
											<input
												className={`${inputStyle} !h-8 !py-1 !text-[11px] !w-[50px] shrink-0 text-center`}
												type="number"
												min="1"
												value={it.quantity}
												onChange={(e) => updateItem(it.id, { quantity: parseInt(e.target.value) || 1 })}
											/>
											
											<button onClick={() => removeItem(it.id)} className="text-red-400 hover:text-red-300 w-6 h-6 flex items-center justify-center cursor-pointer border-none bg-transparent">
												×
											</button>
										</div>
									);
								})
							)}
						</div>
					</div>

					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">ملاحظات</label>
						<input
							className={inputStyle}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="أية ملاحظات حول البكج..."
						/>
					</div>
				</div>

				<div className="flex gap-2.5 mt-5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1`}
						onClick={handleSave}
						disabled={saving || !name || !hours || !price}
					>
						{saving ? "جاري الحفظ..." : "حفظ"}
					</button>
				</div>
			</div>
		</div>
	);
}
