"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import SearchFilterBar from "@/components/SearchFilterBar";
import { exportToCsv } from "@/lib/exportCsv";
import { createClient } from "@/lib/supabase/client";
import type { InventoryItem } from "../types";
import { btnPrimary, fmt } from "../utils";
import EditItemModal from "./EditItemModal";
import NewItemModal from "./NewItemModal";

const supabase = createClient();

export default function ItemsTab() {
	const [items, setItems] = useState<InventoryItem[]>([]);
	const [loading, setLoading] = useState(true);

	const [searchItem, setSearchItem] = useState("");
	const [showNewItem, setShowNewItem] = useState(false);
	const [editItem, setEditItem] = useState<InventoryItem | null>(null);

	const loadData = useCallback(async () => {
		setLoading(true);
		const { data: invItems, error } = await supabase
			.from("inventory_items")
			.select("*")
			.eq("is_active", true)
			.order("name");
		if (error) {
			if (error.message?.includes("steal")) {
				console.warn("Inventory fetch abort error suppressed.");
			} else {
				toast.error(`خطأ في تحميل المخزون: ${error.message}`);
			}
		}
		setItems((invItems as InventoryItem[]) || []);
		setLoading(false);
	}, []);

	useEffect(() => {
		loadData();
	}, []);

	const filteredItems = items.filter((i) =>
		i.name.toLowerCase().includes(searchItem.toLowerCase()),
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
				<div className="text-[13px] text-[#6b6b8a]">{items.length} صنف</div>
				<button className={btnPrimary} onClick={() => setShowNewItem(true)}>
					+ صنف جديد
				</button>
			</div>

			<SearchFilterBar
				searchPlaceholder="ابحث باسم الصنف..."
				searchValue={searchItem}
				onSearchChange={setSearchItem}
				onExportExcel={() => {
					const data = filteredItems.map((i) => ({
						الصنف: i.name,
						الوحدة: i.unit || "",
						"الرصيد الحالي": i.qty,
						"حد التنبيه": i.low_stock_threshold || "",
						"سعر التكلفة": i.cost_price || "",
					}));
					exportToCsv("Inventory_Export", data);
				}}
			/>

			{filteredItems.length === 0 ? (
				<div className="text-center py-12 px-5 bg-[#111118] rounded-xl border border-dashed border-white/10 text-[#4a4a6a] text-sm">
					لا يوجد أصناف بعد
				</div>
			) : (
				<div className="bg-[#111118] rounded-xl border border-white/5 overflow-hidden">
					<table className="w-full border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-white/5">
								{[
									"الصنف",
									"الوحدة",
									"الرصيد",
									"حد التنبيه",
									"سعر التكلفة",
									"",
								].map((h) => (
									<th
										key={h}
										className="p-3 text-right text-[#6b6b8a] font-semibold text-xs"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filteredItems.map((item, i) => {
								const isLow =
									item.low_stock_threshold != null &&
									item.qty <= item.low_stock_threshold;
								return (
									<tr
										key={item.id}
										className={`${
											i < filteredItems.length - 1
												? "border-b border-white/5"
												: ""
										} ${i % 2 === 0 ? "bg-transparent" : "bg-white/5"} hover:bg-white/10 transition-colors`}
									>
										<td className="px-4 py-3 text-[#e0e0f0] font-medium">
											{item.name}
										</td>
										<td className="px-4 py-3 text-[#6b6b8a]">
											{item.unit || "—"}
										</td>
										<td className="px-4 py-3 font-bold">
											<span
												className={isLow ? "text-red-400" : "text-green-400"}
											>
												{fmt(item.qty)}
												{isLow && (
													<span className="text-[10px] mr-1.5 bg-red-400/15 px-1.5 py-0.5 rounded-full text-red-400">
														منخفض
													</span>
												)}
											</span>
										</td>
										<td className="px-4 py-3 text-[#6b6b8a]">
											{item.low_stock_threshold != null
												? fmt(item.low_stock_threshold)
												: "—"}
										</td>
										<td className="px-4 py-3 text-[#6b6b8a]">
											{item.cost_price != null ? `₪${item.cost_price}` : "—"}
										</td>
										<td className="px-4 py-3">
											<button
												onClick={() => setEditItem(item)}
												className="bg-indigo-400/10 border border-indigo-400/20 rounded-md text-indigo-400 px-3 py-1.5 text-xs cursor-pointer hover:bg-indigo-400/20 transition-colors"
											>
												تعديل
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{showNewItem && (
				<NewItemModal
					onClose={() => setShowNewItem(false)}
					onSaved={loadData}
				/>
			)}

			{editItem && (
				<EditItemModal
					item={editItem}
					onClose={() => setEditItem(null)}
					onSaved={loadData}
				/>
			)}
		</div>
	);
}
