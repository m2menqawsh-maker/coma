import type React from "react";
import type { PartnerRow, Step } from "../../types";
import { btnPrimary, btnSecondary, fmt, inputStyle } from "../../utils";

interface Props {
	partnerRows: PartnerRow[];
	setPartnerRows: React.Dispatch<React.SetStateAction<PartnerRow[]>>;
	netAfterDeductions: number;
	setStep: (s: Step) => void;
}

export default function StepPartners({
	partnerRows,
	setPartnerRows,
	netAfterDeductions,
	setStep,
}: Props) {
	return (
		<div className="flex flex-col gap-[18px]">
			<div>
				<div className="text-base font-bold text-[#f0f0f8] mb-1">
					حصص الشركاء
				</div>
				<div className="text-[13px] text-[#6b6b8a]">
					أدخل المبلغ الفعلي المخصوم لكل شريك — الحصة المحسوبة للمرجع فقط
				</div>
			</div>

			<div className="bg-green-400/10 border border-green-400/15 rounded-xl py-3 px-[18px] flex justify-between">
				<span className="text-[13px] text-[#9090b0]">
					صافي الربح القابل للتوزيع
				</span>
				<span className="text-[17px] font-bold text-green-400 privacy-blur transition-all duration-300">
					₪{fmt(netAfterDeductions)}
				</span>
			</div>

			<div className="flex flex-col gap-3">
				{partnerRows.map((p, idx) => (
					<div
						key={p.id}
						className="bg-white/5 border border-white/5 rounded-xl py-4 px-5"
					>
						<div className="flex justify-between items-center mb-3">
							<div>
								<div className="text-[15px] font-bold text-[#f0f0f8]">
									{p.name}
								</div>
								<div className="text-xs text-[#6b6b8a] mt-0.5">
									حصة {p.percent}%
								</div>
							</div>
							<div className="text-left">
								<div className="text-[11px] text-[#6b6b8a]">الحصة المحسوبة</div>
								<div className="text-lg font-bold text-indigo-400 privacy-blur transition-all duration-300">
									₪{fmt(p.share)}
								</div>
							</div>
						</div>

						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								المبلغ المخصوم فعلياً (0 = لم يُخصم بعد)
							</label>
							<input
								type="number"
								min="0"
								step="0.01"
								dir="ltr"
								value={p.actual_deducted}
								onChange={(e) =>
									setPartnerRows((prev) =>
										prev.map((x, i) =>
											i === idx
												? {
														...x,
														actual_deducted: Math.max(
															0,
															parseFloat(e.target.value) || 0,
														),
													}
												: x,
										),
									)
								}
								className={`${inputStyle} text-[15px] font-semibold transition-colors duration-200 ${
									p.actual_deducted > 0
										? "border-green-400/35"
										: "border-[#2a2a3e]"
								}`}
								placeholder="0.00"
							/>
							{p.actual_deducted > p.share && (
								<div className="text-[11px] text-amber-400 mt-1">
									⚠ المبلغ المخصوم أكبر من الحصة المحسوبة
								</div>
							)}
						</div>
					</div>
				))}
			</div>

			<div className="flex gap-2.5">
				<button className={btnSecondary} onClick={() => setStep("deductions")}>
					← رجوع
				</button>
				<button
					className={`${btnPrimary} flex-1`}
					onClick={() => setStep("confirm")}
				>
					مراجعة وتأكيد ←
				</button>
			</div>
		</div>
	);
}
