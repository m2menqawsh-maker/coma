import type React from "react";
import type { BankAccount, PendingPayment } from "../types";

interface Props {
	showCalc: boolean;
	setShowCalc: (v: boolean) => void;
	calcDateFrom: string;
	setCalcDateFrom: (v: string) => void;
	calcDateTo: string;
	setCalcDateTo: (v: string) => void;
	handleCalc: () => void;
	pending: PendingPayment[];
	setPending: React.Dispatch<React.SetStateAction<PendingPayment[]>>;
	bankAccounts: BankAccount[];
	totalDue: number;
	savingPayments: boolean;
	handleConfirmPayments: () => void;
	fmt: (n: unknown) => string;
	inputStyle: string;
	btnPrimary: string;
	btnSecondary: string;
}

export default function CalculatePaymentsModal({
	showCalc,
	setShowCalc,
	calcDateFrom,
	setCalcDateFrom,
	calcDateTo,
	setCalcDateTo,
	handleCalc,
	pending,
	setPending,
	bankAccounts,
	totalDue,
	savingPayments,
	handleConfirmPayments,
	fmt,
	inputStyle,
	btnPrimary,
	btnSecondary,
}: Props) {
	if (!showCalc) return null;

	return (
		<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[600px] border border-white/5 max-h-[90vh] overflow-y-auto">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">
					احتساب المستحقات
				</h2>

				{/* Date range */}
				<div className="grid grid-cols-2 gap-3 mb-4">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							من تاريخ
						</label>
						<input
							className={inputStyle}
							type="date"
							dir="ltr"
							value={calcDateFrom}
							onChange={(e) => setCalcDateFrom(e.target.value)}
						/>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							إلى تاريخ
						</label>
						<input
							className={inputStyle}
							type="date"
							dir="ltr"
							value={calcDateTo}
							onChange={(e) => setCalcDateTo(e.target.value)}
						/>
					</div>
				</div>
				<button
					className={`${btnSecondary} mb-5 text-xs`}
					onClick={handleCalc}
					disabled={!calcDateFrom || !calcDateTo}
				>
					احسب
				</button>

				{/* Pending payments */}
				{pending.length > 0 && (
					<div className="flex flex-col gap-3">
						<div className="text-[13px] text-[#6b6b8a] mb-1">
							{pending[0].days} يوم — وافق على الالتزامات التي تريد تسجيلها:
						</div>

						{pending.map((p, idx) => (
							<div
								key={p.obligation.id}
								className={`rounded-xl p-4 border ${
									p.approved
										? "bg-[#0d0d14] border-indigo-400/25 opacity-100"
										: "bg-white/[0.02] border-white/5 opacity-50"
								}`}
							>
								{/* Header row */}
								<div className="flex justify-between items-center mb-3">
									<div className="flex items-center gap-2.5">
										{/* Checkbox */}
										<button
											onClick={() =>
												setPending((ps) =>
													ps.map((x, i) =>
														i === idx ? { ...x, approved: !x.approved } : x,
													),
												)
											}
											className={`w-5 h-5 rounded-[5px] border-none cursor-pointer flex items-center justify-center text-xs text-white shrink-0 ${
												p.approved ? "bg-indigo-500" : "bg-[#2a2a3e]"
											}`}
										>
											{p.approved ? "✓" : ""}
										</button>
										<span className="text-sm font-semibold text-[#e0e0f0]">
											{p.obligation.name}
										</span>
									</div>
									<div className="text-left">
										<div className="text-[11px] text-[#4a4a6a]">
											₪{fmt(p.dailyRate)}/يوم × {p.days} يوم
										</div>
										<div className="text-[15px] font-bold text-red-400">
											₪{fmt(p.totalDue)}
										</div>
									</div>
								</div>

								{/* Payment split */}
								{p.approved && (
									<div className="flex flex-col gap-2.5">
										<div className="grid grid-cols-2 gap-2.5">
											<div>
												<label className="text-[11px] text-amber-400 block mb-1">
													نقدي (₪)
												</label>
												<input
													className={`${inputStyle} text-xs px-2.5 py-[7px] ${
														(parseFloat(p.cashAmount) || 0) > 0
															? "border-amber-400/40"
															: ""
													}`}
													type="number"
													min="0"
													step="0.01"
													dir="ltr"
													value={p.cashAmount}
													onChange={(e) =>
														setPending((ps) =>
															ps.map((x, i) =>
																i === idx
																	? { ...x, cashAmount: e.target.value }
																	: x,
															),
														)
													}
												/>
											</div>
											<div>
												<label className="text-[11px] text-blue-400 block mb-1">
													بنك (₪)
												</label>
												<input
													className={`${inputStyle} text-xs px-2.5 py-[7px] ${
														(parseFloat(p.bankAmount) || 0) > 0
															? "border-blue-400/40"
															: ""
													}`}
													type="number"
													min="0"
													step="0.01"
													dir="ltr"
													value={p.bankAmount}
													onChange={(e) =>
														setPending((ps) =>
															ps.map((x, i) =>
																i === idx
																	? { ...x, bankAmount: e.target.value }
																	: x,
															),
														)
													}
												/>
											</div>
										</div>
										{(parseFloat(p.bankAmount) || 0) > 0 && (
											<div>
												<label className="text-[11px] text-[#9090b0] block mb-1">
													الحساب البنكي
												</label>
												<select
													className={`${inputStyle} text-xs px-2.5 py-[7px]`}
													value={p.bankAccountId}
													onChange={(e) =>
														setPending((ps) =>
															ps.map((x, i) =>
																i === idx
																	? { ...x, bankAccountId: e.target.value }
																	: x,
															),
														)
													}
												>
													<option value="">-- اختر حساب --</option>
													{bankAccounts.map((b) => (
														<option key={b.id} value={b.id}>
															{b.name}
														</option>
													))}
												</select>
											</div>
										)}
										{/* Total check */}
										{(() => {
											const total =
												(parseFloat(p.cashAmount) || 0) +
												(parseFloat(p.bankAmount) || 0);
											const diff = Math.round((total - p.totalDue) * 100) / 100;
											if (total === 0) return null;
											return (
												<div className="flex justify-between px-2.5 py-1.5 bg-white/[0.03] rounded-[7px]">
													<span className="text-[11px] text-[#6b6b8a]">
														الإجمالي المدخل
													</span>
													<span
														className={`text-xs font-bold ${
															diff === 0 ? "text-green-400" : "text-amber-400"
														}`}
													>
														₪{fmt(total)}{" "}
														{diff !== 0
															? `(${diff > 0 ? "+" : ""}${fmt(diff)} عن المستحق)`
															: "✓"}
													</span>
												</div>
											);
										})()}
									</div>
								)}
							</div>
						))}

						{/* Total */}
						<div className="bg-red-400/[0.08] border border-red-400/20 rounded-[10px] px-4 py-3 flex justify-between items-center">
							<span className="text-[13px] text-[#9090b0]">
								إجمالي {pending.filter((p) => p.approved).length} التزام
							</span>
							<span className="text-base font-bold text-red-400">
								₪{fmt(totalDue)}
							</span>
						</div>

						<div className="flex gap-2.5 mt-1.5">
							<button
								className={btnSecondary}
								onClick={() => {
									setShowCalc(false);
									setPending([]);
								}}
							>
								إلغاء
							</button>
							<button
								className={`${btnPrimary} flex-1 ${savingPayments ? "opacity-60" : "opacity-100"}`}
								onClick={handleConfirmPayments}
								disabled={
									savingPayments ||
									pending.filter((p) => p.approved).length === 0
								}
							>
								{savingPayments
									? "جاري التسجيل..."
									: `تسجيل ${pending.filter((p) => p.approved).length} التزام في المصاريف`}
							</button>
						</div>
					</div>
				)}

				{pending.length === 0 && (
					<div className="flex justify-end mt-2">
						<button className={btnSecondary} onClick={() => setShowCalc(false)}>
							إغلاق
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
