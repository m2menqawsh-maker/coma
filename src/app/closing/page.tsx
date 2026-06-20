"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import ClosingWizard from "./components/ClosingWizard";
import type { FinancialClosing, Obligation, Partner } from "./types";
import { btnPrimary, card, fmt, fmtDate } from "./utils";

const supabase = createClient();

export default function ClosingPage() {
	const [loading, setLoading] = useState(true);

	// Past closings
	const [closings, setClosings] = useState<FinancialClosing[]>([]);
	const [selectedClosing, setSelectedClosing] =
		useState<FinancialClosing | null>(null);

	// New closing wizard
	const [showWizard, setShowWizard] = useState(false);

	// Data for wizard
	const [partners, setPartners] = useState<Partner[]>([]);
	const [obligations, setObligations] = useState<Obligation[]>([]);

	const loadData = useCallback(async () => {
		const [{ data: cls }, { data: par }, { data: obl }] = await Promise.all([
			supabase
				.from("financial_closings")
				.select("*")
				.order("created_at", { ascending: false }),
			supabase
				.from("partners")
				.select("*")
				.eq("is_active", true)
				.order("share_percent", { ascending: false }),
			supabase.from("fixed_obligations").select("*").eq("is_active", true),
		]);
		setClosings((cls as FinancialClosing[]) || []);
		setPartners((par as Partner[]) || []);
		setObligations((obl as Obligation[]) || []);
		setLoading(false);
	}, []);

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	if (loading)
		return (
			<AppLayout>
				<LoadingSpinner />
			</AppLayout>
		);

	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1200px] mx-auto flex flex-col gap-6">
				{/* Header */}
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-xl font-bold text-[#f0f0f8] mb-1">
							الجرد المالي
						</h1>
						<p className="text-[13px] text-[#6b6b8a]">
							إغلاق الفترة وتوزيع الأرباح
						</p>
					</div>
					<button className={btnPrimary} onClick={() => setShowWizard(true)}>
						+ جرد جديد
					</button>
				</div>

				{/* Past closings */}
				{closings.length === 0 ? (
					<div className={`${card} text-center py-[60px] px-5 text-[#4a4a6a]`}>
						<div className="text-[32px] mb-3">◎</div>
						<div className="text-[15px] text-[#6b6b8a] mb-1.5">
							لا توجد جرود سابقة
						</div>
						<div className="text-[13px]">
							اضغط &quot;جرد جديد&quot; لبدء أول جرد مالي
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{closings.map((cl) => (
							<div
								key={cl.id}
								onClick={() =>
									setSelectedClosing(selectedClosing?.id === cl.id ? null : cl)
								}
								className={`cursor-pointer py-[18px] px-6 rounded-2xl border transition-colors ${
									selectedClosing?.id === cl.id
										? "border-indigo-400/40 bg-gradient-to-br from-indigo-500/10 to-violet-500/5"
										: "border-white/5 bg-[#111118] hover:border-white/15"
								}`}
							>
								<div className="flex justify-between items-start">
									<div>
										<div className="text-[15px] font-bold text-[#f0f0f8] mb-1">
											{cl.label ||
												`جرد ${fmtDate(cl.period_from)} → ${fmtDate(cl.period_to)}`}
										</div>
										<div className="text-xs text-[#6b6b8a]">
											{fmtDate(cl.period_from)} — {fmtDate(cl.period_to)}
										</div>
									</div>
									<div className="text-left flex gap-6">
										<div>
											<div className="text-[11px] text-[#6b6b8a]">الإيراد</div>
											<div className="text-base font-bold text-indigo-400">
												₪{fmt(cl.total_revenue)}
											</div>
										</div>
										<div>
											<div className="text-[11px] text-[#6b6b8a]">
												صافي الربح
											</div>
											<div className="text-base font-bold text-green-400">
												₪{fmt(cl.net_profit)}
											</div>
										</div>
										<div className="flex items-center">
											<span className="bg-amber-400/15 text-amber-400 border border-amber-400/30 rounded-full py-[3px] px-2.5 text-[11px] font-semibold">
												🔒 مقفلة
											</span>
										</div>
									</div>
								</div>

								{/* Expanded detail */}
								{selectedClosing?.id === cl.id && (
									<div className="mt-5 border-t border-white/5 pt-5">
										<div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5 mb-5">
											{[
												{
													label: "إجمالي الإيراد",
													value: cl.total_revenue,
													color: "text-indigo-400",
												},
												{
													label: "المصاريف",
													value: cl.total_expenses,
													color: "text-red-400",
												},
												{
													label: "خصومات معتمدة",
													value: cl.total_obligations,
													color: "text-orange-400",
												},
												{
													label: "صافي الربح",
													value: cl.net_profit,
													color: "text-green-400",
												},
											].map((k) => (
												<div
													key={k.label}
													className="bg-white/5 rounded-lg py-3 px-4"
												>
													<div className="text-[11px] text-[#6b6b8a] mb-1.5">
														{k.label}
													</div>
													<div className={`text-lg font-bold ${k.color}`}>
														₪{fmt(k.value)}
													</div>
												</div>
											))}
										</div>

										{/* Partners */}
										{cl.partners_snapshot &&
											cl.partners_snapshot.length > 0 && (
												<div>
													<div className="text-[13px] font-semibold text-[#9090b0] mb-3">
														توزيع الشركاء
													</div>
													<div className="flex gap-3 flex-wrap">
														{cl.partners_snapshot.map((p) => (
															<div
																key={p.id}
																className="bg-white/5 rounded-lg py-3 px-4 flex-1 min-w-[160px]"
															>
																<div className="text-[13px] font-semibold text-[#e0e0f0] mb-2">
																	{p.name} ({p.percent}%)
																</div>
																<div className="flex justify-between">
																	<div>
																		<div className="text-[10px] text-[#6b6b8a]">
																			الحصة المحسوبة
																		</div>
																		<div className="text-sm font-bold text-indigo-400">
																			₪{fmt(p.share)}
																		</div>
																	</div>
																	<div className="text-left">
																		<div className="text-[10px] text-[#6b6b8a]">
																			المخصوم فعلياً
																		</div>
																		<div
																			className={`text-sm font-bold ${
																				p.actual_deducted > 0
																					? "text-green-400"
																					: "text-[#4a4a6a]"
																			}`}
																		>
																			{p.actual_deducted > 0
																				? `₪${fmt(p.actual_deducted)}`
																				: "—"}
																		</div>
																	</div>
																</div>
															</div>
														))}
													</div>
												</div>
											)}

										{/* Approved deductions */}
										{cl.approved_deductions?.some((d) => d.approved) && (
											<div className="mt-4">
												<div className="text-[13px] font-semibold text-[#9090b0] mb-2.5">
													الخصومات المعتمدة
												</div>
												{cl.approved_deductions
													.filter((d) => d.approved)
													.map((d) => (
														<div
															key={d.id}
															className="flex justify-between py-1.5 border-b border-white/5"
														>
															<span className="text-[13px] text-[#c0c0d8]">
																{d.label}
															</span>
															<span className="text-[13px] font-bold text-red-400">
																₪{fmt(d.actual_amount)}
															</span>
														</div>
													))}
											</div>
										)}

										{cl.notes && (
											<div className="mt-3.5 py-2.5 px-3.5 bg-white/5 rounded-lg text-xs text-[#9090b0]">
												{cl.notes}
											</div>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{showWizard && (
				<ClosingWizard
					partners={partners}
					obligations={obligations}
					onClose={() => setShowWizard(false)}
					onSuccess={(msg) => {
						toast.success(msg);
						setShowWizard(false);
						loadData();
					}}
					onError={(msg) => toast.error(msg)}
				/>
			)}
		</AppLayout>
	);
}
