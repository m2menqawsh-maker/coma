import type { BankAccountDetail, BankTransfer } from "../types";
import { fmt, fmtDate, fmtDateTime, STATUS_CONFIG } from "../utils";

interface Props {
	transfers: BankTransfer[];
	selectedAccount: BankAccountDetail | null;
	confirmingId: string | null;
	onConfirm: (t: BankTransfer) => void;
	onReject: (t: BankTransfer) => void;
}

export default function BanksTable({
	transfers,
	selectedAccount,
	confirmingId,
	onConfirm,
	onReject,
}: Props) {
	return (
		<div className="bg-[#111118] rounded-2xl border border-white/5 overflow-hidden">
			<div className="p-[16px_22px] border-b border-white/5 text-sm font-semibold text-[#e0e0f0]">
				{selectedAccount ? `حوالات ${selectedAccount.name}` : "كل الحوالات"}
			</div>

			{transfers.length === 0 ? (
				<div className="text-center py-[60px] px-5 text-[#4a4a6a] text-sm">
					لا توجد حوالات
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-white/[0.06]">
								{[
									"التاريخ",
									"الحساب",
									"الاتجاه",
									"المبلغ",
									"المُرسِل / الوصف",
									"الحالة",
									"إجراء",
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
							{transfers.map((t, i) => {
								const cfg = STATUS_CONFIG[t.status];
								const isIn = t.direction === "in";
								const isPending = t.status === "pending";
								const isProcessing = confirmingId === t.id;
								return (
									<tr
										key={t.id}
										className={`group hover:bg-white/[0.03] ${
											i < transfers.length - 1
												? "border-b border-white/[0.04]"
												: ""
										} ${isPending ? "bg-amber-400/[0.02] border-r-[3px] border-r-amber-400/50" : "bg-transparent border-r-[3px] border-r-transparent"}`}
									>
										<td className="p-[12px_16px] text-[#9090b0] text-xs whitespace-nowrap">
											{fmtDate(t.date)}
											<div className="text-[10px] text-[#4a4a6a] mt-0.5">
												{fmtDateTime(t.created_at)}
											</div>
										</td>
										<td className="p-[12px_16px] text-[#c0c0d8] whitespace-nowrap">
											{t.bank_accounts?.name || "—"}
										</td>
										<td className="p-[12px_16px]">
											<span
												className={`py-[3px] px-2.5 rounded-full text-[11px] font-semibold ${
													isIn
														? "bg-green-400/10 text-green-400"
														: "bg-red-400/10 text-red-400"
												}`}
											>
												{isIn ? "↓ وارد" : "↑ صادر"}
											</span>
										</td>
										<td
											className={`p-[12px_16px] font-bold text-[15px] whitespace-nowrap ${
												isIn ? "text-green-400" : "text-red-400"
											} ${t.status === "rejected" ? "opacity-35" : "opacity-100"}`}
										>
											{isIn ? "+" : "-"}₪{fmt(t.amount)}
										</td>
										<td className="p-[12px_16px] max-w-[220px]">
											{t.sender_name && (
												<div className="text-[13px] text-[#e0e0f0] font-medium">
													{t.sender_name}
												</div>
											)}
											{t.sender_phone && (
												<div
													className="text-[11px] text-[#6b6b8a] mt-0.5"
													dir="ltr"
												>
													{t.sender_phone}
												</div>
											)}
											{t.description && (
												<div className="text-[11px] text-[#6b6b8a] mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
													{t.description}
												</div>
											)}
											{t.reference_type === "invoice" && (
												<div className="text-[10px] text-[#4a4a6a] mt-[3px]">
													مرتبط بفاتورة
												</div>
											)}
										</td>
										<td className="p-[12px_16px] whitespace-nowrap">
											<span
												className={`py-1 px-2.5 rounded-full text-[11px] font-semibold border ${cfg.classes}`}
											>
												{cfg.label}
											</span>
											{t.confirmed_at && (
												<div className="text-[10px] text-[#4a4a6a] mt-1">
													{fmtDateTime(t.confirmed_at)}
												</div>
											)}
										</td>
										<td className="p-[12px_16px] whitespace-nowrap">
											{isPending && isIn && (
												<div className="flex gap-1.5">
													<button
														onClick={() => onConfirm(t)}
														disabled={isProcessing}
														className={`py-1.5 px-3 rounded-[7px] text-xs font-bold border border-green-400/40 bg-green-400/10 text-green-400 ${
															isProcessing
																? "cursor-not-allowed opacity-50"
																: "cursor-pointer opacity-100"
														}`}
													>
														{isProcessing ? "..." : "✓ تصديق"}
													</button>
													<button
														onClick={() => onReject(t)}
														disabled={isProcessing}
														className={`py-1.5 px-3 rounded-[7px] text-xs font-bold border border-red-400/30 bg-red-400/[0.08] text-red-400 ${
															isProcessing
																? "cursor-not-allowed opacity-50"
																: "cursor-pointer opacity-100"
														}`}
													>
														رفض
													</button>
												</div>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
