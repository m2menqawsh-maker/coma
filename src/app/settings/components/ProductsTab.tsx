"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "../types";
import { btnPrimary, btnSecondary } from "../utils";
import ProductModal from "./ProductModal";

const supabase = createClient();

export default function ProductsTab() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [showNewProduct, setShowNewProduct] = useState(false);
	const [editProduct, setEditProduct] = useState<Product | null>(null);

	const loadData = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from("products")
			.select("*")
			.order("name");
		if (error) {
			toast.error(`خطأ في تحميل المنتجات: ${error.message}`);
		} else {
			setProducts(data || []);
		}
		setLoading(false);
	};

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const handleAddProduct = async (data: Partial<Product>) => {
		const { error } = await supabase.from("products").insert(data);
		if (error) {
			toast.error(`فشل إضافة المنتج: ${error.message}`);
			return false;
		} else {
			toast.success("تمت إضافة المنتج ✓");
			loadData();
			return true;
		}
	};

	const handleEditProduct = async (data: Partial<Product>) => {
		if (!editProduct) return false;
		const { error } = await supabase
			.from("products")
			.update(data)
			.eq("id", editProduct.id);
		if (error) {
			toast.error(`فشل التعديل: ${error.message}`);
			return false;
		} else {
			toast.success("تم تعديل المنتج ✓");
			loadData();
			return true;
		}
	};

	const handleToggleProduct = async (id: string, current: boolean) => {
		const { error } = await supabase
			.from("products")
			.update({ is_active: !current })
			.eq("id", id);
		if (error) toast.error(`فشل التحديث: ${error.message}`);
		else loadData();
	};

	if (loading)
		return (
			<div className="p-10">
				<LoadingSpinner />
			</div>
		);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<h2 className="text-[15px] font-semibold text-[#e0e0f0]">
					المنتجات ({products.length})
				</h2>
				<button className={btnPrimary} onClick={() => setShowNewProduct(true)}>
					+ منتج جديد
				</button>
			</div>

			{products.length === 0 ? (
				<div className="text-center py-10 px-5 bg-[#111118] rounded-[14px] border border-dashed border-white/10">
					<p className="text-[#4a4a6a] text-[13px]">لا يوجد منتجات بعد</p>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{products.map((p) => (
						<div
							key={p.id}
							className={`flex justify-between items-center py-3 px-3.5 rounded-lg border border-white/5 ${
								p.is_active
									? "bg-[#111118] opacity-100"
									: "bg-white/5 opacity-50"
							}`}
						>
							<div>
								<div className="text-sm font-semibold text-[#e0e0f0]">
									{p.name}
								</div>
								<div className="text-xs text-[#6b6b8a] mt-0.5">
									{p.category === "drink"
										? "مشروب"
										: p.category === "internet_card"
											? "كرت إنترنت"
											: "أخرى"}
									{p.has_sizes
										? ` · صغير ₪${p.small_price ?? "-"} / كبير ₪${p.large_price ?? "-"}`
										: ` · ₪${p.small_price ?? "-"}`}
								</div>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => setEditProduct(p)}
									className={`${btnSecondary} !py-1.5 !px-3 !text-xs !text-indigo-400 !border-indigo-400/20`}
								>
									تعديل
								</button>
								<button
									onClick={() => handleToggleProduct(p.id, p.is_active)}
									className={`${btnSecondary} !py-1.5 !px-3.5 !text-xs ${
										p.is_active
											? "!text-red-400 !border-red-400/20"
											: "!text-green-400 !border-green-400/20"
									}`}
								>
									{p.is_active ? "تعطيل" : "تفعيل"}
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{showNewProduct && (
				<ProductModal
					onSave={handleAddProduct}
					onClose={() => setShowNewProduct(false)}
				/>
			)}

			{editProduct && (
				<ProductModal
					product={editProduct}
					onSave={handleEditProduct}
					onClose={() => setEditProduct(null)}
				/>
			)}
		</div>
	);
}
