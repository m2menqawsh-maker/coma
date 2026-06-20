"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary, btnSecondary } from "../utils";
import PackageModal from "./PackageModal";
import type { Product } from "../types";

export interface Package {
	id: string;
	name: string;
	device: "mobile" | "laptop" | null;
	hours: number;
	price: number;
	is_active: boolean;
	notes: string | null;
}

export interface PackageItem {
	id: string;
	package_id: string;
	product_id: string;
	size: string | null;
	quantity: number;
	product?: Product;
}

const supabase = createClient();

export default function PackagesTab() {
	const [packages, setPackages] = useState<Package[]>([]);
	const [packageItems, setPackageItems] = useState<Record<string, PackageItem[]>>({});
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	
	const [showNewPackage, setShowNewPackage] = useState(false);
	const [editPackage, setEditPackage] = useState<Package | null>(null);

	const loadData = async () => {
		setLoading(true);
		
		const [{ data: pkgs, error: err1 }, { data: items, error: err2 }, { data: prods, error: err3 }] = await Promise.all([
			supabase.from("packages").select("*").order("created_at", { ascending: false }),
			supabase.from("package_items").select("*, product:products(*)"),
			supabase.from("products").select("*").eq("is_active", true).order("name"),
		]);

		if (err1) toast.error(`خطأ: ${err1.message}`);
		if (err2) toast.error(`خطأ: ${err2.message}`);
		if (err3) toast.error(`خطأ: ${err3.message}`);

		setPackages(pkgs || []);
		setProducts(prods || []);
		
		const itemsMap: Record<string, PackageItem[]> = {};
		for (const item of (items || [])) {
			if (!itemsMap[item.package_id]) itemsMap[item.package_id] = [];
			itemsMap[item.package_id].push(item as any);
		}
		setPackageItems(itemsMap);
		
		setLoading(false);
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleSavePackage = async (
		pkgData: Partial<Package>,
		itemsData: { product_id: string; size: string | null; quantity: number }[]
	) => {
		try {
			let pkgId = editPackage?.id;
			
			if (pkgId) {
				const { error } = await supabase.from("packages").update(pkgData).eq("id", pkgId);
				if (error) throw error;
				
				await supabase.from("package_items").delete().eq("package_id", pkgId);
			} else {
				const { data, error } = await supabase.from("packages").insert(pkgData).select().single();
				if (error) throw error;
				pkgId = data.id;
			}
			
			if (itemsData.length > 0 && pkgId) {
				const newItems = itemsData.map(i => ({ ...i, package_id: pkgId }));
				const { error } = await supabase.from("package_items").insert(newItems);
				if (error) throw error;
			}
			
			toast.success(editPackage ? "تم التعديل ✓" : "تم الإضافة ✓");
			loadData();
			return true;
		} catch (error: any) {
			toast.error(error.message);
			return false;
		}
	};

	const handleTogglePackage = async (id: string, current: boolean) => {
		const { error } = await supabase.from("packages").update({ is_active: !current }).eq("id", id);
		if (error) toast.error(`خطأ: ${error.message}`);
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
					البكجات ({packages.length})
				</h2>
				<button className={btnPrimary} onClick={() => setShowNewPackage(true)}>
					+ بكج جديد
				</button>
			</div>

			{packages.length === 0 ? (
				<div className="text-center py-10 px-5 bg-[#111118] rounded-[14px] border border-dashed border-white/10">
					<p className="text-[#4a4a6a] text-[13px]">لا يوجد بكجات بعد</p>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{packages.map((p) => {
						const items = packageItems[p.id] || [];
						return (
							<div
								key={p.id}
								className={`flex justify-between py-3 px-3.5 rounded-lg border border-white/5 ${
									p.is_active ? "bg-[#111118] opacity-100" : "bg-white/5 opacity-50"
								}`}
							>
								<div>
									<div className="text-sm font-semibold text-[#e0e0f0] flex items-center gap-2">
										{p.name}
										<span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded">
											{p.hours}س بـ ₪{p.price}
										</span>
									</div>
									<div className="text-xs text-[#6b6b8a] mt-1.5 flex flex-col gap-0.5">
										{items.length > 0 ? (
											items.map((i, idx) => (
												<span key={idx}>
													• {i.quantity}× {i.product?.name} {i.size ? `(${i.size === "small" ? "صغير" : "كبير"})` : ""}
												</span>
											))
										) : (
											<span>بدون منتجات</span>
										)}
									</div>
								</div>
								<div className="flex flex-col gap-2 items-end justify-start">
									<div className="flex gap-2">
										<button
											onClick={() => setEditPackage(p)}
											className={`${btnSecondary} !py-1.5 !px-3 !text-xs !text-indigo-400 !border-indigo-400/20`}
										>
											تعديل
										</button>
										<button
											onClick={() => handleTogglePackage(p.id, p.is_active)}
											className={`${btnSecondary} !py-1.5 !px-3.5 !text-xs ${
												p.is_active
													? "!text-red-400 !border-red-400/20"
													: "!text-green-400 !border-green-400/20"
											}`}
										>
											{p.is_active ? "تعطيل" : "تفعيل"}
										</button>
									</div>
									<div className="text-[10px] text-[#4a4a6a] mt-2">
										الجهاز: {p.device === "mobile" ? "موبايل" : p.device === "laptop" ? "لابتوب" : "أي جهاز"}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{showNewPackage && (
				<PackageModal
					products={products}
					onSave={handleSavePackage}
					onClose={() => setShowNewPackage(false)}
				/>
			)}

			{editPackage && (
				<PackageModal
					pkg={editPackage}
					initialItems={packageItems[editPackage.id] || []}
					products={products}
					onSave={handleSavePackage}
					onClose={() => setEditPackage(null)}
				/>
			)}
		</div>
	);
}
