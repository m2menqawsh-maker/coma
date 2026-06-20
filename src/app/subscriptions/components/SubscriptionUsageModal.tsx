"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { btnSecondary } from "@/app/sessions/utils";
import LoadingSpinner from "@/components/LoadingSpinner";

interface SubscriptionUsageModalProps {
	subscriptionId: string;
	subscriptionName: string;
	onClose: () => void;
}

export default function SubscriptionUsageModal({
	subscriptionId,
	subscriptionName,
	onClose,
}: SubscriptionUsageModalProps) {
	const [usages, setUsages] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUsages = async () => {
			setLoading(true);
			const supabase = createClient();
			const { data, error } = await supabase
				.from("subscription_usage")
				.select(`
					*,
					invoices (
						session_start,
						session_end,
						duration_minutes,
						total_amount
					)
				`)
				.eq("subscription_id", subscriptionId)
				.order("created_at", { ascending: false });

			if (!error && data) {
				setUsages(data);
			}
			setLoading(false);
		};

		fetchUsages();
	}, [subscriptionId]);

	const formatTime = (isoString?: string) => {
		if (!isoString) return "--";
		return new Date(isoString).toLocaleTimeString("ar-EG", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
				<div className="p-5 border-b border-[#2a2a3e] flex justify-between items-center bg-[#1a1a26]/50">
					<h2 className="text-xl font-bold text-white">
						سجل استخدام: <span className="text-indigo-400">{subscriptionName}</span>
					</h2>
					<button
						onClick={onClose}
						className="text-zinc-400 hover:text-white transition-colors"
					>
						✕
					</button>
				</div>

				<div className="p-6 overflow-y-auto custom-scrollbar">
					{loading ? (
						<div className="py-10 flex justify-center">
							<LoadingSpinner />
						</div>
					) : usages.length === 0 ? (
						<div className="text-center py-10 px-5 bg-[#111118] rounded-[14px] border border-dashed border-white/10">
							<p className="text-[#4a4a6a] text-sm">لا يوجد استخدام مسجل لهذا الاشتراك حتى الآن.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-right text-sm">
								<thead className="bg-[#1a1a26]/80 text-zinc-400 border-b border-[#2a2a3e]">
									<tr>
										<th className="px-4 py-3 font-medium">تاريخ السجل</th>
										<th className="px-4 py-3 font-medium">وقت الجلسة</th>
										<th className="px-4 py-3 font-medium">المدة (دقائق)</th>
										<th className="px-4 py-3 font-medium text-indigo-300">ساعات مخصومة</th>
										<th className="px-4 py-3 font-medium text-emerald-300">مشاريب مخصومة</th>
										<th className="px-4 py-3 font-medium">ملاحظات النظام</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#2a2a3e]">
									{usages.map((u: any) => (
										<tr key={u.id} className="hover:bg-white/5 transition-colors">
											<td className="px-4 py-3 text-white" dir="ltr">
												{u.date}
											</td>
											<td className="px-4 py-3 text-zinc-300">
												{u.invoices ? (
													<div className="flex flex-col text-xs">
														<span className="text-emerald-400">بدأ: {formatTime(u.invoices.session_start)}</span>
														<span className="text-red-400">انتهى: {formatTime(u.invoices.session_end)}</span>
													</div>
												) : (
													<span className="text-zinc-500 text-xs">-- بدون جلسة --</span>
												)}
											</td>
											<td className="px-4 py-3 text-zinc-300">
												{u.invoices?.duration_minutes || "--"} دقيقة
											</td>
											<td className="px-4 py-3 text-indigo-300 font-bold">
												{u.hours_used.toFixed(1)} س
											</td>
											<td className="px-4 py-3 text-emerald-300">
												{u.drinks_used > 0 ? (
													<div className="flex flex-col gap-1">
														<span className="font-bold">{u.drinks_used} كوب</span>
														{u.drinks_details && (
															<div className="text-[10px] text-emerald-500/70">
																{u.drinks_details.map((d: any, idx: number) => (
																	<div key={idx}>- {d.quantity}x {d.product_id}</div>
																))}
															</div>
														)}
													</div>
												) : (
													<span className="text-zinc-500">0</span>
												)}
											</td>
											<td className="px-4 py-3 text-zinc-400 text-xs max-w-[150px]">
												{u.notes || "--"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
				<div className="p-5 border-t border-[#2a2a3e] bg-[#1a1a26]/50 flex justify-end">
					<button type="button" onClick={onClose} className={btnSecondary}>
						إغلاق
					</button>
				</div>
			</div>
		</div>
	);
}
