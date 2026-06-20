import type { Invoice } from "../types";
import { DEVICE_LABELS, fmt, fmtDateTime, fmtDuration } from "../utils";

interface Props {
	invoices: Invoice[];
	totalRevenue: number;
	openInvoice: (inv: Invoice) => void;
	setPayDebtInvoice: (inv: Invoice) => void;
	setPayCustomerBalance: (bal: number | null) => void;
	setShowPayDebt: (v: boolean) => void;
	supabase: any;
}

export default function InvoicesTable({
	invoices,
	totalRevenue,
	openInvoice,
	setPayDebtInvoice,
	setPayCustomerBalance,
	setShowPayDebt,
	supabase,
}: Props) {
	if (invoices.length === 0) {
		return (
			<div className="bg-[#111118] rounded-xl border border-white/5 text-center py-[60px] px-5 text-[#4a4a6a] text-sm">
				لا توجد فواتير
			</div>
		);
	}

	return (
		<div className="bg-[#111118] rounded-xl border border-white/5 overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-[13px]">
					<thead>
						<tr className="border-b border-white/5">
							{[
								"التاريخ",
								"العميل",
								"الجهاز",
								"المدة",
								"الجلسة",
								"المنتجات",
								"الإجمالي",
								"الحالة",
								"",
							].map((h) => (
								<th
									key={h}
									className="py-3 px-3.5 text-right text-[#6b6b8a] font-semibold text-xs whitespace-nowrap"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{invoices.map((inv, i) => {
							const statusClasses = {
								paid: "bg-transparent border-r-transparent border-r-0",
								debt: "bg-red-400/[0.04] !border-r-red-400 border-r-[3px]",
								partial:
									"bg-amber-400/[0.04] !border-r-amber-400 border-r-[3px]",
								cleared:
									"bg-amber-400/[0.03] !border-r-amber-400/40 border-r-[3px]",
							}[inv.status];

							return (
								<tr
									key={inv.id}
									className={`cursor-pointer transition-colors duration-200 hover:!bg-white/[0.06] ${statusClasses} ${
										i < invoices.length - 1
											? "border-b border-white/[0.04]"
											: ""
									}`}
									onClick={() => openInvoice(inv)}
								>
									<td className="py-[11px] px-3.5 text-[#9090b0] whitespace-nowrap text-xs">
										{fmtDateTime(inv.session_end)}
									</td>
									<td className="py-[11px] px-3.5 whitespace-nowrap">
										<div className="text-[13px] font-semibold text-[#e0e0f0]">
											{inv.customer_name}
										</div>
										{inv.credit_applied > 0 && (
											<div className="text-[10px] text-green-400 mt-0.5 transition-all duration-300 privacy-blur">
												✦ رصيد مطبّق ₪{fmt(inv.credit_applied)}
											</div>
										)}
									</td>
									<td className="py-[11px] px-3.5 text-[#9090b0] text-xs whitespace-nowrap">
										{DEVICE_LABELS[inv.device]}
									</td>
									<td className="py-[11px] px-3.5 text-[#9090b0] text-xs whitespace-nowrap">
										{fmtDuration(inv.duration_minutes)}
									</td>
									<td className="py-[11px] px-3.5 text-[#c0c0e0] font-semibold whitespace-nowrap transition-all duration-300 privacy-blur">
										<div>₪{fmt(inv.session_amount)}</div>
										{inv.package_id && inv.packages && (
											<div className="text-[10px] text-indigo-400 mt-0.5 bg-indigo-400/10 w-fit px-1.5 py-0.5 rounded">
												بكبج: {inv.packages.name}
											</div>
										)}
									</td>
									<td
										className={`py-[11px] px-3.5 font-semibold whitespace-nowrap transition-all duration-300 privacy-blur ${inv.products_amount > 0 ? "text-amber-400" : "text-[#4a4a6a]"}`}
									>
										{inv.products_amount > 0
											? `₪${fmt(inv.products_amount)}`
											: "—"}
									</td>
									<td className="py-[11px] px-3.5 text-indigo-400 font-bold whitespace-nowrap transition-all duration-300 privacy-blur">
										₪{fmt(inv.total_due)}
									</td>
									<td className="py-[11px] px-3.5 whitespace-nowrap">
										{inv.status === "debt" && (
											<div className="flex items-center gap-1.5">
												<span className="w-2 h-2 rounded-full bg-red-400 inline-block shrink-0 shadow-[0_0_6px_#f87171]" />
												<div>
													<div className="text-red-400 font-bold text-[13px] transition-all duration-300 privacy-blur">
														₪{fmt(inv.debt_created)}
													</div>
													<div className="text-[#6b6b8a] text-[10px]">دين</div>
												</div>
											</div>
										)}
										{inv.status === "partial" && (
											<div className="flex items-center gap-1.5">
												<span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" />
												<div>
													<div className="text-amber-400 font-bold text-[13px] transition-all duration-300 privacy-blur">
														₪{fmt(inv.debt_created)}
													</div>
													<div className="text-[#6b6b8a] text-[10px]">جزئي</div>
												</div>
											</div>
										)}
										{inv.status === "cleared" && (
											<div className="flex items-center gap-1.5">
												<span className="text-amber-400 text-[13px]">✦</span>
												<div className="text-amber-400 text-[11px] font-semibold">
													تمت التصفية
												</div>
											</div>
										)}
										{inv.status === "paid" &&
											(() => {
												const creditCreated = Math.max(
													0,
													Math.round(
														(inv.cash_paid + inv.bank_paid - inv.total_due) *
															100,
													) / 100,
												);
												return (
													<div className="flex items-center gap-1.5">
														<span
															className={`text-[13px] ${creditCreated > 0 ? "text-indigo-400" : "text-green-400"}`}
														>
															{creditCreated > 0 ? "✦" : "✓"}
														</span>
														<div>
															<div
																className={`text-[11px] font-semibold ${creditCreated > 0 ? "text-indigo-400" : "text-green-400"}`}
															>
																{creditCreated > 0 ? "مدفوع + رصيد" : "مدفوع"}
															</div>
															{creditCreated > 0 && (
																<div className="text-indigo-400 text-[10px] mt-[1px] transition-all duration-300 privacy-blur">
																	+₪{fmt(creditCreated)} للزبون
																</div>
															)}
														</div>
													</div>
												);
											})()}
									</td>
									<td className="py-[11px] px-3.5">
										{inv.status === "cleared" ? (
											<span className="bg-amber-400/10 border border-amber-400/25 rounded-md text-amber-400 py-1 px-2.5 text-[11px] font-semibold whitespace-nowrap">
												✦ تمت التصفية
											</span>
										) : inv.debt_created > 0 ? (
											<button
												onClick={async (e) => {
													e.stopPropagation();
													setPayDebtInvoice(inv);
													setPayCustomerBalance(null);
													if (inv.customer_id) {
														const { data } = await supabase
															.from("customers")
															.select("balance")
															.eq("id", inv.customer_id)
															.single();
														setPayCustomerBalance(
															(data as { balance?: number } | null)?.balance ??
																null,
														);
													}
													setShowPayDebt(true);
												}}
												className="bg-red-400/10 border border-red-400/25 rounded-md text-red-400 py-1 px-2.5 text-xs cursor-pointer whitespace-nowrap"
											>
												سداد
											</button>
										) : null}
									</td>
								</tr>
							);
						})}
					</tbody>
					<tfoot>
						<tr className="border-t border-white/10 bg-white/5">
							<td
								colSpan={4}
								className="py-3 px-3.5 text-[#6b6b8a] text-xs font-semibold"
							>
								المجموع ({invoices.length} فاتورة)
							</td>
							<td className="py-3 px-3.5 text-[#c0c0e0] font-bold transition-all duration-300 privacy-blur">
								₪{fmt(invoices.reduce((s, i) => s + i.session_amount, 0))}
							</td>
							<td className="py-3 px-3.5 text-amber-400 font-bold transition-all duration-300 privacy-blur">
								₪{fmt(invoices.reduce((s, i) => s + i.products_amount, 0))}
							</td>
							<td className="py-3 px-3.5 text-indigo-400 font-bold transition-all duration-300 privacy-blur">
								₪{fmt(totalRevenue)}
							</td>
							<td colSpan={2} />
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	);
}
