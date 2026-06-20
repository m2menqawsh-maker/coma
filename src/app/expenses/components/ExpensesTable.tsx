import type { Expense } from "../types";
import {
	EXPENSE_TYPE_COLORS,
	EXPENSE_TYPE_LABELS,
	fmt,
	fmtDate,
} from "../utils";

interface Props {
	expenses: Expense[];
	totalCash: number;
	totalBank: number;
	totalAll: number;
	onEditClick: (e: Expense) => void;
}

export default function ExpensesTable({
	expenses,
	totalCash,
	totalBank,
	totalAll,
	onEditClick,
}: Props) {
	return (
		<div className="bg-[#111118] rounded-[14px] border border-white/5 overflow-hidden">
			{expenses.length === 0 ? (
				<div className="text-center py-[60px] px-5 text-[#4a4a6a] text-sm">
					لا توجد مصاريف
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-full border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-white/5">
								{[
									"التاريخ",
									"الاسم",
									"النوع",
									"نقدي",
									"بنك",
									"الحساب",
									"الملاحظات",
									"الإجمالي",
									"",
								].map((h) => (
									<th
										key={h}
										className="p-[12px_10px] text-right text-[#6b6b8a] font-semibold text-xs whitespace-nowrap"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{expenses.map((e, i) => {
								const total = (e.cash_amount || 0) + (e.bank_amount || 0);
								return (
									<tr
										key={e.id}
										className={`transition-colors duration-100 hover:bg-white/5 ${
											i < expenses.length - 1 ? "border-b border-white/5" : ""
										} ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"}`}
									>
										<td className="p-[11px_10px] text-[#9090b0] whitespace-nowrap">
											{fmtDate(e.date)}
										</td>
										<td className="p-[11px_10px] text-[#e0e0f0] font-medium min-w-[120px]">
											{e.name}
										</td>
										<td className="p-[11px_10px] whitespace-nowrap">
											<span
												className={`py-[3px] px-2 rounded-full text-[11px] font-semibold ${EXPENSE_TYPE_COLORS[e.expense_type].bg} ${EXPENSE_TYPE_COLORS[e.expense_type].text}`}
											>
												{EXPENSE_TYPE_LABELS[e.expense_type]}
											</span>
										</td>
										<td
											className={`p-[11px_10px] font-semibold whitespace-nowrap privacy-blur transition-all duration-300 ${
												(e.cash_amount || 0) > 0
													? "text-amber-400"
													: "text-[#3a3a5a]"
											}`}
										>
											{(e.cash_amount || 0) > 0
												? `₪${fmt(e.cash_amount)}`
												: "—"}
										</td>
										<td
											className={`p-[11px_10px] font-semibold whitespace-nowrap privacy-blur transition-all duration-300 ${
												(e.bank_amount || 0) > 0
													? "text-blue-400"
													: "text-[#3a3a5a]"
											}`}
										>
											{(e.bank_amount || 0) > 0
												? `₪${fmt(e.bank_amount)}`
												: "—"}
										</td>
										<td className="p-[11px_10px] text-[#6b6b8a] text-xs">
											{e.bank_accounts?.name || "—"}
										</td>
										<td className="p-[11px_10px] text-[#6b6b8a] text-xs max-w-[160px]">
											<div className="overflow-hidden text-ellipsis whitespace-nowrap">
												{e.notes || "—"}
											</div>
										</td>
										<td className="p-[11px_10px] text-left font-bold text-sm text-red-400 whitespace-nowrap privacy-blur transition-all duration-300">
											-₪{fmt(total)}
										</td>
										<td className="p-[11px_10px]">
											<button
												onClick={() => onEditClick(e)}
												className="bg-indigo-400/10 border border-indigo-400/20 rounded-[7px] text-indigo-400 py-[5px] px-3 text-xs cursor-pointer"
											>
												تعديل
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
						<tfoot>
							<tr className="border-t border-white/10 bg-white/5">
								<td
									colSpan={3}
									className="p-[12px_10px] text-[#6b6b8a] text-xs font-semibold"
								>
									المجموع ({expenses.length} قيد)
								</td>
								<td className="p-[12px_10px] text-amber-400 font-bold privacy-blur transition-all duration-300">
									₪{fmt(totalCash)}
								</td>
								<td className="p-[12px_10px] text-blue-400 font-bold privacy-blur transition-all duration-300">
									₪{fmt(totalBank)}
								</td>
								<td colSpan={2} />
								<td className="p-[12px_10px] text-left font-bold text-[15px] text-red-400 privacy-blur transition-all duration-300">
									-₪{fmt(totalAll)}
								</td>
								<td />
							</tr>
						</tfoot>
					</table>
				</div>
			)}
		</div>
	);
}
