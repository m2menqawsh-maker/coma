import type { LedgerEntry, LedgerTxType } from "../types";

interface Props {
	entries: LedgerEntry[];
	TX_TYPE_COLORS: Record<LedgerTxType, { bg: string; text: string }>;
	TX_TYPE_LABELS: Record<LedgerTxType, string>;
	formatDate: (d: string) => string;
	formatAmount: (n: number) => string;
}

export default function LedgerTable({
	entries,
	TX_TYPE_COLORS,
	TX_TYPE_LABELS,
	formatDate,
	formatAmount,
}: Props) {
	return (
		<div className="bg-[#111118] rounded-[14px] border border-white/5 overflow-hidden">
			{entries.length === 0 ? (
				<div className="text-center py-15 px-5 text-[#4a4a6a] text-sm">
					لا توجد قيود بهذه الفلاتر
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-white/5">
								{[
									"التاريخ",
									"النوع",
									"الوصف",
									"القناة",
									"الاتجاه",
									"بواسطة",
									"المبلغ",
								].map((h) => (
									<th
										key={h}
										className="py-3 px-4 text-right text-[#6b6b8a] font-semibold text-xs whitespace-nowrap"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{entries.map((e, i) => (
								<tr
									key={e.id}
									className={`${
										i < entries.length - 1 ? "border-b border-white/5" : ""
									} ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"} hover:bg-white/5 transition-colors duration-100`}
								>
									<td className="py-2.5 px-4 text-[#9090b0] whitespace-nowrap">
										{formatDate(e.date)}
									</td>
									<td className="py-2.5 px-4 whitespace-nowrap">
										<span
											className={`py-[3px] px-2 rounded-full text-[11px] font-semibold inline-block ${TX_TYPE_COLORS[e.tx_type].bg} ${TX_TYPE_COLORS[e.tx_type].text}`}
										>
											{TX_TYPE_LABELS[e.tx_type]}
										</span>
									</td>
									<td className="py-2.5 px-4 text-[#c0c0d8] max-w-[220px]">
										<div className="overflow-hidden text-ellipsis whitespace-nowrap">
											{e.description}
										</div>
										{e.bank_accounts?.name && (
											<div className="text-[11px] text-[#4a4a6a] mt-0.5">
												{e.bank_accounts.name}
											</div>
										)}
									</td>
									<td className="py-2.5 px-4">
										<span
											className={`text-[11px] py-[3px] px-2 rounded-full border ${
												e.channel === "cash"
													? "bg-amber-400/10 text-amber-400 border-amber-400/20"
													: "bg-blue-400/10 text-blue-400 border-blue-400/20"
											}`}
										>
											{e.channel === "cash" ? "نقدي" : "بنك"}
										</span>
									</td>
									<td className="py-2.5 px-4">
										<span
											className={`text-[11px] py-[3px] px-2 rounded-full border ${
												e.direction === "in"
													? "bg-green-400/10 text-green-400 border-green-400/20"
													: "bg-red-400/10 text-red-400 border-red-400/20"
											}`}
										>
											{e.direction === "in" ? "↓ دخل" : "↑ خرج"}
										</span>
									</td>
									<td className="py-2.5 px-4 text-[#9090b0] text-[11px] whitespace-nowrap">
										{e.user_profiles?.name || "-"}
									</td>
									<td
										className={`py-2.5 px-4 text-left font-bold text-sm whitespace-nowrap transition-all duration-300 privacy-blur ${
											e.direction === "in" ? "text-green-400" : "text-red-400"
										}`}
									>
										{e.direction === "in" ? "+" : "-"}₪{formatAmount(e.amount)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
