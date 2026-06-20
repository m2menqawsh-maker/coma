import type React from "react";
import type { DeductionRow, Partner, PartnerRow, Step } from "../../types";
import { btnPrimary, btnSecondary, fmt, inputStyle } from "../../utils";

interface Props {
	deductions: DeductionRow[];
	setDeductions: React.Dispatch<React.SetStateAction<DeductionRow[]>>;
	newDeductLabel: string;
	setNewDeductLabel: (v: string) => void;
	newDeductAmount: string;
	setNewDeductAmount: (v: string) => void;
	totalApprovedDeductions: number;
	netAfterDeductions: number;
	partners: Partner[];
	setPartnerRows: (rows: PartnerRow[]) => void;
	setStep: (s: Step) => void;
}

export default function StepDeductions({
	deductions,
	setDeductions,
	newDeductLabel,
	setNewDeductLabel,
	newDeductAmount,
	setNewDeductAmount,
	totalApprovedDeductions,
	netAfterDeductions,
	partners,
	setPartnerRows,
	setStep,
}: Props) {
	return (
		<div className="flex flex-col gap-[18px]">
			<div>
				<div className="text-base font-bold text-[#f0f0f8] mb-1">الخصومات</div>
				<div className="text-[13px] text-[#6b6b8a]">
					فعّل ما تريد خصمه وعدّل المبلغ الفعلي إذا لزم
				</div>
			</div>

			{deductions.length === 0 ? (
				<div className="text-center py-[30px] px-5 text-[#4a4a6a] text-[13px] bg-white/5 rounded-xl">
					لا توجد التزامات نشطة — يمكنك إضافتها من صفحة الالتزامات
				</div>
			) : (
				<div className="flex flex-col gap-2.5">
					{deductions.map((d, idx) => (
						<div
							key={d.id}
							className={`rounded-xl py-3.5 px-[18px] flex items-center gap-[14px] border ${
								d.approved || d.type === "custom"
									? "bg-red-400/10 border-red-400/20"
									: "bg-white/5 border-white/5"
							}`}
						>
							<div
								onClick={() => {
									if (d.type === "custom") {
										setDeductions((prev) => prev.filter((_, i) => i !== idx));
									} else {
										setDeductions((prev) =>
											prev.map((x, i) =>
												i === idx ? { ...x, approved: !x.approved } : x,
											),
										);
									}
								}}
								className={`w-11 h-6 rounded-full cursor-pointer shrink-0 relative transition-colors duration-200 ${
									d.type === "custom"
										? "bg-red-400/60"
										: d.approved
											? "bg-indigo-500"
											: "bg-white/10"
								}`}
							>
								{d.type !== "custom" && (
									<div
										className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-200 ${
											d.approved ? "right-[3px]" : "right-[23px]"
										}`}
									/>
								)}
								{d.type === "custom" && (
									<div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-400/80 flex items-center justify-center text-[11px] text-white font-bold">
										✕
									</div>
								)}
							</div>

							<div className="flex-1">
								<div className="text-[13px] font-semibold text-[#e0e0f0]">
									{d.label}
								</div>
								<div className="text-[11px] text-[#6b6b8a] mt-0.5 privacy-blur transition-all duration-300">
									المحسوب: ₪{fmt(d.calculated)}
								</div>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-xs text-[#6b6b8a]">المبلغ الفعلي</span>
								<input
									type="number"
									min="0"
									step="0.01"
									dir="ltr"
									value={d.actual_amount}
									onChange={(e) =>
										setDeductions((prev) =>
											prev.map((x, i) =>
												i === idx
													? {
															...x,
															actual_amount: parseFloat(e.target.value) || 0,
														}
													: x,
											),
										)
									}
									disabled={!d.approved}
									className={`${inputStyle} w-[110px] text-left transition-opacity duration-200 ${
										d.approved
											? "opacity-100 border-red-400/30"
											: "opacity-40 border-[#2a2a3e]"
									}`}
								/>
							</div>
						</div>
					))}
				</div>
			)}

			<div className="bg-white/5 border border-dashed border-white/10 rounded-xl py-3.5 px-[18px]">
				<div className="text-xs font-semibold text-[#9090b0] mb-3">
					+ إضافة خصم يدوي
				</div>
				<div className="flex gap-2.5">
					<input
						className={`${inputStyle} flex-[2]`}
						value={newDeductLabel}
						onChange={(e) => setNewDeductLabel(e.target.value)}
						placeholder="اسم الخصم (مثال: كهرباء، إيجار...)"
					/>
					<input
						type="number"
						min="0"
						step="0.01"
						dir="ltr"
						className={`${inputStyle} flex-1`}
						value={newDeductAmount}
						onChange={(e) => setNewDeductAmount(e.target.value)}
						placeholder="المبلغ"
					/>
					<button
						onClick={() => {
							if (!newDeductLabel.trim() || !newDeductAmount) return;
							const rawAmt = parseFloat(newDeductAmount) || 0;
							const amt = Math.max(0, rawAmt);
							if (amt <= 0) return;
							const id = `custom_${Date.now()}`;
							setDeductions((prev) => [
								...prev,
								{
									id,
									label: newDeductLabel.trim(),
									calculated: amt,
									approved: true,
									actual_amount: amt,
									type: "custom",
								},
							]);
							setNewDeductLabel("");
							setNewDeductAmount("");
						}}
						disabled={!newDeductLabel.trim() || !newDeductAmount}
						className={`${btnPrimary} py-[9px] px-[18px] shrink-0 transition-opacity duration-200 ${
							!newDeductLabel.trim() || !newDeductAmount
								? "opacity-40"
								: "opacity-100"
						}`}
					>
						إضافة
					</button>
				</div>
			</div>

			<div className="bg-red-400/10 border border-red-400/15 rounded-xl py-3.5 px-[18px] flex justify-between">
				<span className="text-sm font-semibold text-[#9090b0]">
					إجمالي الخصومات المعتمدة
				</span>
				<span className="text-lg font-bold text-red-400 privacy-blur transition-all duration-300">
					₪{fmt(totalApprovedDeductions)}
				</span>
			</div>

			<div className="bg-green-400/10 border border-green-400/15 rounded-xl py-3.5 px-[18px] flex justify-between">
				<span className="text-sm font-semibold text-[#9090b0]">
					صافي الربح بعد الخصومات
				</span>
				<span className="text-xl font-bold text-green-400 privacy-blur transition-all duration-300">
					₪{fmt(netAfterDeductions)}
				</span>
			</div>

			<div className="flex gap-2.5">
				<button className={btnSecondary} onClick={() => setStep("preview")}>
					← رجوع
				</button>
				<button
					className={`${btnPrimary} flex-1`}
					onClick={() => {
						setPartnerRows(
							partners.map((p) => ({
								id: p.id,
								name: p.name,
								percent: p.share_percent,
								share:
									Math.round(
										netAfterDeductions * (p.share_percent / 100) * 100,
									) / 100,
								actual_deducted: 0,
							})),
						);
						setStep("partners");
					}}
				>
					توزيع الشركاء ←
				</button>
			</div>
		</div>
	);
}
