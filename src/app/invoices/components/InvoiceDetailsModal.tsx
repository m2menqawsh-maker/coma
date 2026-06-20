"use client";

import type { CustomerMovement, Invoice, InvoiceItem } from "../types";
import { DEVICE_LABELS, fmt, fmtDateTime, fmtDuration } from "../utils";

interface InvoiceDetailsModalProps {
	invoice: Invoice;
	items: InvoiceItem[];
	movements: CustomerMovement[];
	loadingItems: boolean;
	onClose: () => void;
	role?: string | null;
}

export default function InvoiceDetailsModal({
	invoice,
	items,
	movements,
	loadingItems,
	onClose,
	role,
}: InvoiceDetailsModalProps) {
	return (
		<div
			className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 overflow-y-auto"
			onClick={onClose}
		>
			<div
				className="bg-[#111118] rounded-2xl w-[600px] max-w-[95%] max-h-[90vh] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col relative"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className="absolute top-4 left-4 bg-white/5 border-none text-[#9090b0] w-8 h-8 rounded-full cursor-pointer flex items-center justify-center text-base transition-colors hover:bg-white/10"
				>
					×
				</button>

				<div className="pt-6 px-6 pb-5 border-b border-white/5">
					<h2 className="m-0 text-lg font-bold text-[#f0f0f8]">
						تفاصيل الفاتورة
					</h2>
					<div className="text-[13px] text-[#6b6b8a] mt-1">
						{fmtDateTime(invoice.session_end)}
					</div>
				</div>

				<div className="p-6 overflow-y-auto">
					{/* Main Info */}
					<div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5 mb-5">
						{[
							{ label: "الزبون", value: invoice.customer_name },
							{ label: "الجهاز", value: DEVICE_LABELS[invoice.device] },
							{ label: "المدة", value: fmtDuration(invoice.duration_minutes) },
							{
								label: "سعر الساعة",
								value: `₪${fmt(invoice.hourly_rate_snapshot ?? 0)}`,
							},
						].map((item) => (
							<div
								key={item.label}
								className="bg-[#0d0d14] rounded-lg py-2.5 px-3"
							>
								<div className="text-[10px] text-[#4a4a6a] mb-1">
									{item.label}
								</div>
								<div className="text-[13px] font-semibold text-[#c0c0e0]">
									{item.value}
								</div>
							</div>
						))}
					</div>

					{/* Orders */}
					{loadingItems ? (
						<div className="text-[#6b6b8a] text-[13px] py-2.5 mb-4">
							جاري تحميل الطلبات...
						</div>
					) : items.length > 0 ? (
						<div className="mb-4">
							<div className="text-xs text-[#6b6b8a] font-semibold mb-2">
								الطلبات
							</div>

							<div className="bg-[#0d0d14] rounded-lg overflow-hidden">
								<table className="w-full border-collapse text-xs">
									<thead>
										<tr className="border-b border-white/5">
											{["المنتج", "الكمية", "السعر", "التكلفة"]
												.concat(role !== "viewer" ? ["الربح"] : [])
												.concat(["الإجمالي"])
												.map((h) => (
													<th
														key={h}
														className="py-2 px-3 text-right text-[#4a4a6a] font-semibold text-[11px]"
													>
														{h}
													</th>
												))}
										</tr>
									</thead>

									<tbody>
										{items.map((item, i) => {
											const itemProfit = item.total_price - item.total_cost;
											const profitPct =
												item.total_price > 0
													? Math.round((itemProfit / item.total_price) * 100)
													: 0;
											const unitProfit =
												item.quantity > 0 ? itemProfit / item.quantity : 0;

											return (
												<tr
													key={item.id}
													className={
														i < items.length - 1
															? "border-b border-white/[0.04]"
															: ""
													}
												>
													<td className="py-[9px] px-3 text-[#e0e0f0]">
														{item.product_name}
														{item.size && (
															<span className="text-[10px] text-[#6b6b8a] mr-1">
																({item.size === "small" ? "صغير" : "كبير"})
															</span>
														)}
													</td>
													<td className="py-[9px] px-3 text-[#9090b0] text-center">
														×{item.quantity}
													</td>
													<td className="py-[9px] px-3 text-amber-400 font-semibold">
														₪{fmt(item.price_per_unit)}
													</td>
													<td className="py-[9px] px-3 text-red-400">
														₪{fmt(item.cost_per_unit)}
													</td>
													{role !== "viewer" && (
														<td className="py-[9px] px-3">
															<span
																className={`font-semibold ${itemProfit >= 0 ? "text-green-400" : "text-red-400"}`}
															>
																₪{fmt(unitProfit)}
															</span>
															<span className="text-[#4a4a6a] text-[10px] mr-[3px]">
																({profitPct}%)
															</span>
														</td>
													)}
													<td className="py-[9px] px-3 text-amber-400 font-bold">
														₪{fmt(item.total_price)}
													</td>
												</tr>
											);
										})}
									</tbody>

									<tfoot>
										<tr className="border-t border-white/10 bg-white/5">
											<td
												colSpan={4}
												className="py-2 px-3 text-[#6b6b8a] text-[11px]"
											>
												مجموع المنتجات
											</td>
											{role !== "viewer" && (
												<td className="py-2 px-3 text-green-400 font-bold">
													₪
													{fmt(
														items.reduce(
															(s, it) => s + it.total_price - it.total_cost,
															0,
														),
													)}
												</td>
											)}
											<td className="py-2 px-3 text-amber-400 font-bold">
												₪{fmt(items.reduce((s, it) => s + it.total_price, 0))}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					) : null}

					{/* Financial breakdown */}
					<div className="bg-[#0d0d14] rounded-xl p-4 border border-white/5">
						<div className="text-xs text-[#6b6b8a] font-semibold mb-3">
							ملخص مالي
						</div>

						{[
							...(invoice.package_id && invoice.packages
								? [
										{
											label: `البكج (${invoice.packages.name})`,
											value: invoice.final_calculation_snapshot?.package_amount || 0,
											color: "text-indigo-400",
										},
										...(invoice.final_calculation_snapshot?.session_amount > 0
											? [
													{
														label: "ساعات إضافية",
														value: invoice.final_calculation_snapshot.session_amount,
														color: "text-[#c0c0e0]",
													},
												]
											: []),
									]
								: [
										{
											label: "الجلسة",
											value: invoice.session_amount,
											color: "text-[#c0c0e0]",
										},
									]),
							{
								label: invoice.package_id ? "منتجات إضافية" : "المنتجات",
								value: invoice.products_amount,
								color: "text-amber-400",
							},
							...(invoice.discount_amount > 0
								? [
										{
											label: "الخصم",
											value: -invoice.discount_amount,
											color: "text-red-400",
										},
									]
								: []),
						].map((row) => (
							<div key={row.label} className="flex justify-between mb-1.5">
								<span className="text-xs text-[#6b6b8a]">{row.label}</span>
								<span className={`text-[13px] font-semibold ${row.color}`}>
									{row.value < 0 ? "-" : ""}₪{fmt(Math.abs(row.value))}
								</span>
							</div>
						))}

						<div className="border-t border-white/5 pt-2.5 mt-1.5">
							<div className="flex justify-between mb-1.5">
								<span className="text-[13px] font-semibold text-[#9090b0]">
									الإجمالي المستحق
								</span>
								<span className="text-[15px] font-bold text-indigo-400">
									₪{fmt(invoice.total_due)}
								</span>
							</div>

							{invoice.credit_applied > 0 && (
								<div className="flex justify-between mb-1">
									<span className="text-xs text-green-400">
										خصم من الرصيد الدائن
									</span>
									<span className="text-[13px] font-semibold text-green-400">
										₪{fmt(invoice.credit_applied)}
									</span>
								</div>
							)}

							<div className="flex justify-between mb-1">
								<span className="text-xs text-[#6b6b8a]">نقدي</span>
								<span className="text-[13px] font-semibold text-amber-400">
									₪{fmt(invoice.cash_paid)}
								</span>
							</div>

							<div className="flex justify-between mb-1">
								<span className="text-xs text-[#6b6b8a]">بنك</span>
								<span className="text-[13px] font-semibold text-blue-400">
									₪{fmt(invoice.bank_paid)}
								</span>
							</div>

							{invoice.debt_created > 0 && invoice.status !== "cleared" && (
								<div className="flex justify-between py-2 px-2.5 bg-red-400/10 rounded-lg mt-1.5">
									<div className="flex items-center gap-1.5">
										<span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
										<span className="text-xs text-red-400 font-semibold">
											دين متبقي
										</span>
									</div>
									<span className="text-sm font-bold text-red-400">
										₪{fmt(invoice.debt_created)}
									</span>
								</div>
							)}

							{invoice.status === "cleared" && (
								<div className="flex justify-between py-2 px-2.5 bg-amber-400/10 rounded-lg mt-1.5">
									<span className="text-xs text-amber-400 font-semibold">
										✦ تمت التصفية تلقائياً
									</span>
									<span className="text-xs text-amber-400">
										₪{fmt(invoice.debt_created)}
									</span>
								</div>
							)}

							{(() => {
								const creditCreated = Math.max(
									0,
									Math.round(
										(invoice.cash_paid +
											invoice.bank_paid -
											invoice.total_due) *
											100,
									) / 100,
								);
								if (creditCreated <= 0) return null;
								return (
									<div className="flex justify-between items-center py-2 px-2.5 bg-indigo-400/10 border border-indigo-400/20 rounded-lg mt-1.5">
										<div className="flex items-center gap-1.5">
											<span className="text-sm">✦</span>
											<span className="text-xs text-indigo-400 font-semibold">
												رصيد دائن أُضيف للزبون
											</span>
										</div>
										<span className="text-sm font-bold text-indigo-400">
											+₪{fmt(creditCreated)}
										</span>
									</div>
								);
							})()}
						</div>

						{/* Profit section */}
						{role !== "viewer" && (
							<div className="border-t border-white/5 pt-2.5 mt-2.5">
								<div className="text-[11px] text-[#4a4a6a] mb-2">
									تكلفة وربحية
								</div>

								<div className="flex justify-between mb-1">
									<span className="text-xs text-[#6b6b8a]">تكلفة المكان</span>
									<span className="text-xs text-[#9090b0]">
										₪{fmt(invoice.place_cost)}
									</span>
								</div>

								<div className="flex justify-between mb-1">
									<span className="text-xs text-[#6b6b8a]">تكلفة المنتجات</span>
									<span className="text-xs text-[#9090b0]">
										₪{fmt(invoice.products_cost)}
									</span>
								</div>

								<div className="flex justify-between py-2 px-2.5 bg-green-400/10 rounded-lg mt-1.5">
									<span className="text-xs text-green-400 font-semibold">
										صافي الربح
									</span>
									<span className="text-sm font-bold text-green-400">
										₪{fmt(invoice.net_profit)}
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Notes */}
					{invoice.notes && (
						<div className="mt-3 py-2.5 px-3.5 bg-white/5 rounded-lg">
							<span className="text-[11px] text-[#6b6b8a]">ملاحظات: </span>
							<span className="text-xs text-[#9090b0]">{invoice.notes}</span>
						</div>
					)}

					{/* Customer movements */}
					{invoice.customer_id && movements.length > 0 && (
						<div className="mt-3.5">
							<div className="text-xs text-[#6b6b8a] font-semibold mb-2">
								سجل حركة الزبون (آخر {movements.length} حركة)
							</div>

							<div className="bg-[#0d0d14] rounded-lg overflow-hidden">
								{movements.map((mv, i) => (
									<div
										key={mv.id}
										className={`flex justify-between items-center py-[9px] px-3.5 ${i < movements.length - 1 ? "border-b border-white/5" : ""}`}
									>
										<div>
											<div className="text-xs text-[#c0c0e0]">
												{mv.note || (mv.amount < 0 ? "دين" : "دفعة")}
											</div>
											<div className="text-[10px] text-[#4a4a6a] mt-0.5">
												{new Date(mv.date).toLocaleDateString("ar-IL", {
													year: "numeric",
													month: "short",
													day: "numeric",
												})}
												{" · "}
												{mv.channel === "bank" ? "بنك" : "نقدي"}
											</div>
										</div>

										<div className="text-left">
											<span
												className={`text-[13px] font-bold ${mv.amount >= 0 ? "text-green-400" : "text-red-400"}`}
											>
												{mv.amount >= 0 ? "+" : ""}₪{fmt(Math.abs(mv.amount))}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
