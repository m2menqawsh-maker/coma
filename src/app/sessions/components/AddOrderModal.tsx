"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "../types";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";

const supabase = createClient();

interface AddOrderModalProps {
	sessionId: string;
	products: Product[];
	onClose: () => void;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

export default function AddOrderModal({
	sessionId,
	products,
	onClose,
	onSuccess,
	onError,
}: AddOrderModalProps) {
	const [orderProduct, setOrderProduct] = useState("");
	const [orderSize, setOrderSize] = useState<"small" | "large">("small");
	const [orderQty, setOrderQty] = useState("1");
	const [savingOrder, setSavingOrder] = useState(false);

	const handleAddOrder = async () => {
		if (!orderProduct) return;
		setSavingOrder(true);
		const product = products.find((p) => p.id === orderProduct);
		if (!product) {
			setSavingOrder(false);
			return;
		}

		const price = product.has_sizes
			? orderSize === "small"
				? product.small_price
				: product.large_price
			: product.small_price;

		const { error } = await supabase.from("session_orders").insert({
			id: crypto.randomUUID(),
			session_id: sessionId,
			product_id: orderProduct,
			product_name: product.name,
			size: product.has_sizes ? orderSize : null,
			quantity: Math.max(1, parseInt(orderQty, 10) || 1),
			price_per_unit: price || 0,
			cost_per_unit: 0,
		});

		setSavingOrder(false);
		if (error) {
			onError("خطأ في إضافة الطلب");
		} else {
			onSuccess("تمت الإضافة بنجاح");
		}
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[360px] border border-white/10">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">
					إضافة طلب للجلسة
				</h2>
				<div className="flex flex-col gap-3.5">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							المنتج
						</label>
						<select
							className={inputStyle}
							value={orderProduct}
							onChange={(e) => setOrderProduct(e.target.value)}
						>
							<option value="">اختر منتج...</option>
							{products.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>
					{orderProduct &&
						products.find((p) => p.id === orderProduct)?.has_sizes && (
							<div>
								<label className="text-xs text-[#9090b0] block mb-1.5">
									الحجم
								</label>
								<div className="flex gap-2">
									{(["small", "large"] as const).map((sz) => (
										<button
											key={sz}
											onClick={() => setOrderSize(sz)}
											className={`flex-1 py-2 rounded-lg text-[13px] border-[1.5px] cursor-pointer transition-colors ${
												orderSize === sz
													? "border-indigo-500 bg-indigo-500/15 text-indigo-400"
													: "border-[#2a2a3e] bg-[#1a1a26] text-[#6b6b8a] hover:bg-[#20202e]"
											}`}
										>
											{sz === "small" ? "صغير" : "كبير"}
										</button>
									))}
								</div>
							</div>
						)}
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							الكمية
						</label>
						<input
							className={inputStyle}
							type="number"
							min="1"
							value={orderQty}
							onChange={(e) => setOrderQty(e.target.value)}
							dir="ltr"
						/>
					</div>
				</div>
				<div className="flex gap-2.5 mt-5.5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${savingOrder ? "opacity-60" : "opacity-100"}`}
						onClick={handleAddOrder}
						disabled={savingOrder || !orderProduct}
					>
						{savingOrder ? "جاري الإضافة..." : "إضافة"}
					</button>
				</div>
			</div>
		</div>
	);
}
