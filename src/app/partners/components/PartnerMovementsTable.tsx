import type { Partner, PartnerMovement } from "../types";
import { fmt, fmtDate } from "../utils";

interface PartnerStats {
	totalWithdrawals: number;
	totalDeposits: number;
	totalLoansTaken: number;
	totalLoansPaid: number;
	myMovements: PartnerMovement[];
}

interface Props {
	activePartner: Partner;
	activeStats: PartnerStats;
	openModal: (
		partner: Partner,
		type: "withdrawal" | "deposit" | "loan" | "loan_payment",
	) => void;
}

export default function PartnerMovementsTable({
	activePartner,
	activeStats,
	openModal,
}: Props) {
	return (
		<div className="bg-[#111118] rounded-2xl border border-white/5 overflow-hidden">
			{/* Section header */}
			<div className="px-[22px] py-4 border-b border-white/5 flex justify-between items-center">
				<div className="text-sm font-semibold text-[#e0e0f0]">
					سجل الحركات — {activePartner.name}
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => openModal(activePartner, "deposit")}
						className="py-[7px] px-[14px] rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 text-xs font-semibold cursor-pointer"
					>
						+ إيداع
					</button>
					<button
						onClick={() => openModal(activePartner, "withdrawal")}
						className="py-[7px] px-[14px] rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 text-xs font-semibold cursor-pointer"
					>
						− سحب أرباح
					</button>
					<button
						onClick={() => openModal(activePartner, "loan_payment")}
						className="py-[7px] px-[14px] rounded-lg border border-teal-400/30 bg-teal-400/10 text-teal-400 text-xs font-semibold cursor-pointer"
					>
						+ سداد سلفة
					</button>
					<button
						onClick={() => openModal(activePartner, "loan")}
						className="py-[7px] px-[14px] rounded-lg border border-pink-400/30 bg-pink-400/10 text-pink-400 text-xs font-semibold cursor-pointer"
					>
						− أخذ سلفة
					</button>
				</div>
			</div>

			{/* Movements list */}
			{activeStats.myMovements.length === 0 ? (
				<div className="text-center py-[60px] px-5 text-[#4a4a6a] text-sm">
					لا توجد حركات مسجلة لهذا الشريك
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-white/5">
								{["التاريخ", "النوع", "الوصف", "القناة", "المبلغ"].map((h) => (
									<th
										key={h}
										className="p-[11px_18px] text-right text-[#6b6b8a] font-semibold text-xs whitespace-nowrap"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{activeStats.myMovements.map((m, i) => {
								const isWithdrawal = m.tx_type === "partner_withdrawal";
								const isDeposit = m.tx_type === "partner_deposit";
								const isLoan = m.tx_type === "partner_loan";
								const isLoanPayment = m.tx_type === "partner_loan_payment";

								return (
									<tr
										key={m.id}
										className={`transition-colors duration-100 hover:bg-white/5 ${
											i < activeStats.myMovements.length - 1
												? "border-b border-white/5"
												: ""
										}`}
									>
										<td className="p-[12px_18px] text-[#9090b0] whitespace-nowrap text-xs">
											{fmtDate(m.date)}
										</td>
										<td className="p-[12px_18px] whitespace-nowrap">
											<span
												className={`py-[3px] px-2.5 rounded-full text-[11px] font-semibold ${
													isWithdrawal
														? "bg-red-400/10 text-red-400"
														: isDeposit
															? "bg-green-400/10 text-green-400"
															: isLoan
																? "bg-pink-400/10 text-pink-400"
																: "bg-teal-400/10 text-teal-400"
												}`}
											>
												{isWithdrawal
													? "↑ سحب"
													: isDeposit
														? "↓ إيداع"
														: isLoan
															? "↑ سلفة"
															: "↓ سداد"}
											</span>
										</td>
										<td className="p-[12px_18px] text-[#c0c0d8] max-w-[260px]">
											<div className="overflow-hidden text-ellipsis whitespace-nowrap">
												{m.description}
											</div>
											{m.bank_accounts?.name && (
												<div className="text-[11px] text-[#4a4a6a] mt-0.5">
													{m.bank_accounts.name}
												</div>
											)}
										</td>
										<td className="p-[12px_18px]">
											<span
												className={`text-[11px] py-[3px] px-2 rounded-full border ${
													m.channel === "cash"
														? "bg-amber-400/10 text-amber-400 border-amber-400/20"
														: "bg-blue-400/10 text-blue-400 border-blue-400/20"
												}`}
											>
												{m.channel === "cash" ? "نقدي" : "بنك"}
											</span>
										</td>
										<td
											className={`p-[12px_18px] font-bold text-sm whitespace-nowrap text-left privacy-blur transition-all duration-300 ${
												isWithdrawal || isLoan ? "text-red-400" : "text-green-400"
											}`}
										>
											{isWithdrawal || isLoan ? "-" : "+"}₪{fmt(m.amount)}
										</td>
									</tr>
								);
							})}
						</tbody>

						{/* Footer totals */}
						<tfoot>
							<tr className="border-t border-white/10 bg-white/5">
								<td
									colSpan={4}
									className="p-[12px_18px] text-xs text-[#6b6b8a] font-semibold"
								>
									الإجمالي
								</td>
								<td className="p-[12px_18px] text-left flex flex-col items-end gap-1">
									{activeStats.totalWithdrawals > 0 && (
										<div className="text-xs text-red-400 font-bold privacy-blur transition-all duration-300">
											−₪{fmt(activeStats.totalWithdrawals)} <span className="text-[#6b6b8a] text-[10px] font-normal">(أرباح مسحوبة)</span>
										</div>
									)}
									{activeStats.totalDeposits > 0 && (
										<div className="text-xs text-green-400 font-bold privacy-blur transition-all duration-300">
											+₪{fmt(activeStats.totalDeposits)} <span className="text-[#6b6b8a] text-[10px] font-normal">(أرباح مودعة)</span>
										</div>
									)}
									{activeStats.totalLoansTaken > 0 && (
										<div className="text-xs text-pink-400 font-bold privacy-blur transition-all duration-300">
											−₪{fmt(activeStats.totalLoansTaken)} <span className="text-[#6b6b8a] text-[10px] font-normal">(سلف مأخوذة)</span>
										</div>
									)}
									{activeStats.totalLoansPaid > 0 && (
										<div className="text-xs text-teal-400 font-bold privacy-blur transition-all duration-300">
											+₪{fmt(activeStats.totalLoansPaid)} <span className="text-[#6b6b8a] text-[10px] font-normal">(سلف مسددة)</span>
										</div>
									)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			)}
		</div>
	);
}
