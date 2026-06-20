"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import SearchFilterBar from "@/components/SearchFilterBar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { fmt } from "../utils";

const supabase = createClient();

export default function CustomersTab() {
	const [customers, setCustomers] = useState<
		{
			id: string;
			name: string;
			phone: string | null;
			balance: number;
			last_visit_at: string | null;
			is_vip: boolean;
			total_spent: number;
		}[]
	>([]);
	const [alerts, setAlerts] = useState<{ id: string; type: string; customer_name: string; message: string; details?: string }[]>([]);
	const [customersSearch, setCustomersSearch] = useState("");
	const [customersLoading, setCustomersLoading] = useState(false);

	const loadCustomers = async (search = "") => {
		setCustomersLoading(true);
		try {
			let q = supabase
				.from("customers")
				.select("id, name, phone, balance, last_visit_at, is_vip")
				.order("name");
			if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);

			const invQ = supabase.from("invoices").select("customer_id, total_amount").not("customer_id", "is", null);
			const subQ = supabase
				.from("subscriptions")
				.select("id, name, end_date, customer_id, customers(name), type, limit_value, subscription_usage(hours_used)")
				.eq("is_active", true);

			const [{ data }, { data: invData }, { data: subData }] = await Promise.all([q, invQ, subQ]);

			const spendingMap: Record<string, number> = {};
			if (invData) {
				invData.forEach((inv: any) => {
					if (inv.customer_id) {
						spendingMap[inv.customer_id] = (spendingMap[inv.customer_id] || 0) + Number(inv.total_amount || 0);
					}
				});
			}

			const mappedCustomers = (data || []).map((c: any) => ({
				id: c.id,
				name: c.name,
				phone: c.phone,
				balance: c.balance,
				last_visit_at: c.last_visit_at,
				is_vip: c.is_vip,
				total_spent: spendingMap[c.id] || 0,
			}));

			mappedCustomers.sort((a: any, b: any) => {
				if (a.is_vip && !b.is_vip) return -1;
				if (!a.is_vip && b.is_vip) return 1;
				return b.total_spent - a.total_spent;
			});

			setCustomers(mappedCustomers);

			const newAlerts: any[] = [];
			if (subData) {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				subData.forEach((sub: any) => {
					if (sub.type === "days") {
						const end = new Date(sub.end_date);
						const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
						if (diffDays <= 3 && diffDays >= 0) {
							newAlerts.push({
								id: sub.id,
								type: "days",
								customer_name: sub.customers?.name || "غير معروف",
								message: `اشتراك "${sub.name}" سينتهي خلال ${diffDays} أيام (${sub.end_date}).`,
							});
						} else if (diffDays < 0) {
							newAlerts.push({
								id: sub.id,
								type: "days",
								customer_name: sub.customers?.name || "غير معروف",
								message: `اشتراك "${sub.name}" انتهت صلاحيته.`,
							});
						}
					} else if (sub.type === "hours" && sub.limit_value) {
						const used =
							sub.subscription_usage?.reduce(
								(acc: number, curr: any) => acc + (curr.hours_used || 0),
								0,
							) || 0;
						const remaining = Number(sub.limit_value) - used;
						if (remaining <= 5 && remaining > 0) {
							newAlerts.push({
								id: sub.id,
								type: "hours",
								customer_name: sub.customers?.name || "غير معروف",
								message: `اشتراك "${sub.name}" أوشك على الانتهاء.`,
								details: `متبقي ${remaining} ساعات فقط من أصل ${sub.limit_value}`,
							});
						} else if (remaining <= 0) {
							newAlerts.push({
								id: sub.id,
								type: "hours",
								customer_name: sub.customers?.name || "غير معروف",
								message: `اشتراك "${sub.name}" انتهى رصيده.`,
								details: `الرصيد 0`,
							});
						}
					}
				});
			}
			setAlerts(newAlerts);
		} finally {
			setCustomersLoading(false);
		}
	};

	const toggleVIP = async (id: string, currentVIP: boolean) => {
		try {
			const { error } = await supabase
				.from("customers")
				.update({ is_vip: !currentVIP })
				.eq("id", id);
			if (error) throw error;
			
			setCustomers((prev) =>
				prev.map((c: any) => (c.id === id ? { ...c, is_vip: !currentVIP } : c)).sort((a: any, b: any) => {
					if (a.is_vip && !b.is_vip) return -1;
					if (!a.is_vip && b.is_vip) return 1;
					return b.total_spent - a.total_spent;
				})
			);
			toast.success(currentVIP ? "تم إلغاء تمييز العميل" : "تم تمييز العميل كـ VIP 👑");
		} catch (error: any) {
			toast.error("خطأ: " + error.message);
		}
	};

	useEffect(() => {
		let active = true;
		const run = async () => {
			if (active) await loadCustomers(customersSearch);
		};
		run();
		return () => {
			active = false;
		};
	}, [customersSearch]);

	return (
		<div>
			{alerts.length > 0 && (
				<div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
					<h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
						<span>⚠️</span> تنبيهات الباقات والاشتراكات
					</h3>
					<div className="flex flex-col gap-2">
						{alerts.map((a, i) => (
							<div
								key={i}
								className="flex flex-wrap justify-between items-center bg-black/20 px-4 py-2.5 rounded-lg border border-white/5 gap-4"
							>
								<div className="text-sm">
									<span className="font-bold text-[#e0e0f0] ml-2">{a.customer_name}:</span>
									<span className="text-amber-200/80">{a.message}</span>
								</div>
								{a.details && <span className="text-xs font-bold text-amber-500/70 bg-amber-500/10 px-2 py-1 rounded">{a.details}</span>}
							</div>
						))}
					</div>
				</div>
			)}

			<div className="flex gap-2.5 mb-4 items-center">
				<div className="flex-1">
					<SearchFilterBar
						searchPlaceholder="بحث عن زبون..."
						searchValue={customersSearch}
						onSearchChange={(v) => {
							setCustomersSearch(v);
						}}
					/>
				</div>
				<span className="text-xs text-[#6b6b8a]">{customers.length} زبون</span>
			</div>

			{customersLoading ? (
				<LoadingSpinner />
			) : (
				<div className="bg-[#111118] rounded-xl border border-white/5 overflow-hidden">
					<table className="w-full border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-white/5 bg-white/5">
								{["الزبون", "إجمالي الإنفاق", "الهاتف", "الرصيد أو الدين", "آخر زيارة", ""].map(
									(h) => (
										<th
											key={h}
											className="py-2.5 px-3.5 text-right text-[#6b6b8a] font-medium"
										>
											{h}
										</th>
									),
								)}
							</tr>
						</thead>
						<tbody>
							{customers.length === 0 ? (
								<tr>
									<td colSpan={4} className="p-8 text-center text-[#4a4a6a]">
										لا يوجد زبائن
									</td>
								</tr>
							) : (
								customers.map((c) => (
									<tr key={c.id} className="border-b border-white/5">
										<td className="py-3 px-3.5 text-[#e0e0f0] font-semibold">
											<div className="flex items-center gap-2">
												{c.name}
												{c.is_vip && <span className="text-amber-400 text-lg" title="عميل VIP">👑</span>}
											</div>
										</td>
										<td className="py-3 px-3.5 text-indigo-400 font-bold">
											₪{fmt(c.total_spent)}
										</td>
										<td className="py-3 px-3.5 text-[#9090b0]">
											{c.phone || "\u2014"}
										</td>
										<td className="py-3 px-3.5">
											{c.balance === 0 ? (
												<span className="text-[#6b6b8a] text-xs">متوازن</span>
											) : c.balance > 0 ? (
												<div>
													<span className="text-green-400 font-bold">
														رصيد دائن
													</span>
													<div className="text-[15px] font-bold text-green-400">
														₪{fmt(c.balance)}
													</div>
												</div>
											) : (
												<div>
													<span className="text-red-400 font-bold">
														دين على الزبون
													</span>
													<div className="text-[15px] font-bold text-red-400">
														₪{fmt(Math.abs(c.balance))}
													</div>
												</div>
											)}
										</td>
										<td className="py-3 px-3.5 text-[#6b6b8a] text-xs">
											{c.last_visit_at
												? new Date(c.last_visit_at).toLocaleDateString(
														"ar-IL",
														{ year: "numeric", month: "short", day: "numeric" },
													)
												: "\u2014"}
										</td>
										<td className="py-3 px-3.5 text-left">
											<button
												onClick={() => toggleVIP(c.id, c.is_vip)}
												className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
													c.is_vip 
														? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20" 
														: "bg-white/5 text-[#9090b0] border-white/10 hover:bg-white/10 hover:text-white"
												}`}
											>
												{c.is_vip ? "إلغاء VIP" : "ترقية لـ VIP 👑"}
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
